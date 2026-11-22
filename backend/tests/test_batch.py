import os
import re

import pandas as pd
import pytest

from backend.ml.batch_scoring import BatchInputError, aggregates_from_csv, normalize_orders
from backend.tests.conftest import requires_models

PHONE_ID = re.compile(r"KH_\d{9,}")

HEADER = "customer_id,order_id,inserted_at,updated_at,status_group,total_price_cleaned,channel_group,region_type\n"
ROWS = [
    # A: 2 đơn, đơn 2 được chốt SAU as_of -> phải tính là đang xử lý (point-in-time)
    "KH_0900000001,1,2022-10-01 10:00:00,2022-10-03 10:00:00,Completed,300000,Facebook Fanpage,Miền Nam",
    "KH_0900000001,2,2022-10-20 10:00:00,2022-11-10 10:00:00,Completed,200000,Website,Miền Nam",
    # B: 1 đơn hoàn trả
    "KH_0900000002,3,2022-10-15 09:00:00,2022-10-18 09:00:00,Returned,150000,TikTok Shop,Miền Bắc",
    # C: đơn đặt SAU as_of -> bị loại hoàn toàn
    "KH_0900000003,4,2022-11-05 09:00:00,2022-11-06 09:00:00,Completed,500000,Shopee,Miền Trung",
]


def _csv(rows=ROWS, header=HEADER) -> bytes:
    return (header + "\n".join(rows) + "\n").encode("utf-8")


# ------------------------------------------------------------------ đọc & kiểm tra dữ liệu
def test_point_in_time_aggregation():
    agg, rep = aggregates_from_csv(_csv(), pd.Timestamp("2022-11-01"))
    assert set(agg.index) == {"KH_0900000001", "KH_0900000002"}  # C đặt sau as_of
    a = agg.loc["KH_0900000001"]
    assert a["total_orders"] == 2 and a["completed_orders"] == 1  # đơn 2 chốt sau as_of -> chưa biết
    assert a["monetary"] == 300000
    assert agg.loc["KH_0900000002", "returned_orders"] == 1
    assert rep["n_customers"] == 2 and rep["n_orders"] == 3
    assert any("sau mốc as_of" in w for w in rep["warnings"])


def test_default_as_of_is_after_last_order():
    agg, rep = aggregates_from_csv(_csv())
    assert len(agg) == 3 and rep["as_of"] == "2022-11-05 09:00:01"


def test_missing_required_column():
    with pytest.raises(BatchInputError, match="status_group"):
        aggregates_from_csv(_csv(header=HEADER.replace("status_group", "trang_thai")))


def test_dirty_rows_and_unknown_values_are_reported():
    rows = ROWS + [
        ",5,2022-10-02 10:00:00,2022-10-03 10:00:00,Completed,100,Website,Miền Nam",          # thiếu customer_id
        "KH_0900000004,6,không-phải-ngày,2022-10-03 10:00:00,Completed,100,Website,Miền Nam",  # ngày hỏng
        "KH_0900000005,7,2022-10-02 10:00:00,2022-10-03 10:00:00,Lạ,100,Zalo,Tây Nguyên",      # giá trị lạ
    ]
    df = pd.read_csv(pd.io.common.BytesIO(_csv(rows)), dtype={"customer_id": str, "order_id": str})
    orders, rep = normalize_orders(df)
    assert rep["n_dropped_rows"] == 2
    row = orders[orders["customer_id"] == "KH_0900000005"].iloc[0]
    assert (row["status_group"], row["channel_group"], row["region_type"]) == ("In_Progress", "Unknown/Other", "Chưa xác định")
    assert len(rep["warnings"]) >= 4  # thiếu cột tùy chọn + dòng hỏng + status/kênh/vùng lạ


def test_as_of_before_all_orders():
    with pytest.raises(BatchInputError, match="Không có khách"):
        aggregates_from_csv(_csv(), pd.Timestamp("2020-01-01"))


# ------------------------------------------------------------------ API
@pytest.fixture
def auth(client):
    token = client.post("/api/auth/login", json={"email": "business@retail.vn", "password": "user123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _upload(client, headers, data: bytes, **params):
    return client.post("/api/churn/predict-batch", headers=headers, params=params,
                       files={"file": ("orders.csv", data, "text/csv")})


def test_batch_requires_login(client):
    assert _upload(client, {}, _csv()).status_code == 401


@requires_models
def test_batch_api_ok(client, auth):
    r = _upload(client, auth, _csv(), as_of="2022-11-01T00:00:00")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["summary"]["n_customers"] == 2 and len(d["items"]) == 2 and not d["items_truncated"]
    assert not PHONE_ID.search(r.text)  # chỉ trả ID đã che
    assert all(it["display_id"].startswith("KH_0900***") for it in d["items"])
    assert all(0 <= it["churn_probability_pct"] <= 100 and it["recommendation"] for it in d["items"])
    assert all(it["top_factors"] for it in d["items"])
    assert sum(d["summary"]["risk_distribution"].values()) == 2

    assert len(_upload(client, auth, _csv(), max_items=1).json()["items"]) == 1


@requires_models
def test_batch_api_errors(client, auth):
    assert _upload(client, auth, b"").status_code == 422
    assert _upload(client, auth, _csv(header=HEADER.replace("order_id", "ma_don"))).status_code == 422
    assert _upload(client, auth, "a,b\n1,2\n".encode("utf-16")).status_code == 422


# ------------------------------------------------------------------ train/serve parity trên dữ liệu thật
SCORED = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models", "scored_customers.csv")
ORDERS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Cleaned_data", "orders_cleaned.csv")


@requires_models
@pytest.mark.skipif(not (os.path.exists(SCORED) and os.path.exists(ORDERS)), reason="thiếu dữ liệu thật")
def test_batch_matches_training_scores():
    from backend.app.core.ml_models import load_metrics, ml_manager
    cutoff = pd.Timestamp(load_metrics()["churn"]["observation_window"]["cutoff"])
    with open(ORDERS, "rb") as f:
        agg, _ = aggregates_from_csv(f.read(), cutoff)
    ref = pd.read_csv(SCORED).set_index("customer_id")
    sc = ml_manager.score_aggregates(agg.loc[agg.index.intersection(ref.index)], explain_limit=0)
    assert len(sc) == len(ref)
    assert (sc["churn_prob"] - ref.loc[sc.index, "churn_prob"]).abs().max() < 1e-4
    assert (sc["rfm_segment"] == ref.loc[sc.index, "rfm_segment"]).all()
