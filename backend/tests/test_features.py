import numpy as np
import pandas as pd
import pytest

from backend.ml import feature_engineering as fe

T = pd.Timestamp("2022-10-01 00:00:00")


def _order(cid, oid, t, status="Completed", updated=None, price=300000, channel="Facebook Fanpage",
           region="Miền Nam", ad=0, cod=300000, cat="ÁO", source="Shop A"):
    t = pd.Timestamp(t)
    return {
        "customer_id": cid, "order_id": oid, "inserted_at": str(t),
        "updated_at": str(pd.Timestamp(updated) if updated else t + pd.Timedelta(hours=48)),
        "status_group": status, "total_price_cleaned": price, "channel_group": channel,
        "region_type": region, "is_from_ad": ad, "cod_cleaned": cod, "categories_name": cat, "source": source,
    }


@pytest.fixture
def orders():
    rows = [
        # Khách A: 3 đơn trước cutoff, đa kênh
        _order("A", 1, "2022-09-01", price=200000, ad=1),
        _order("A", 2, "2022-09-20", status="Returned", channel="TikTok Shop", cat="VÁY"),
        _order("A", 3, "2022-09-29", status="Completed", updated="2022-10-05"),  # chốt SAU cutoff -> chưa biết
        # Khách B: 1 đơn, bị hủy trước cutoff
        _order("B", 4, "2022-09-15", status="Cancelled", region="Miền Bắc", cod=0),
        # Khách C: chỉ mua sau cutoff -> không có trong tập đặc trưng
        _order("C", 5, "2022-10-03"),
        # Khách A mua lại sau cutoff (chỉ ảnh hưởng nhãn)
        _order("A", 6, "2022-10-04"),
    ]
    return fe.prepare_orders(pd.DataFrame(rows))


def test_aggregates_point_in_time(orders):
    agg = fe.build_customer_aggregates(orders, T)
    assert set(agg.index) == {"A", "B"}
    a = agg.loc["A"]
    assert a["total_orders"] == 3
    assert a["completed_orders"] == 1          # đơn 3 chốt sau cutoff -> không tính là hoàn thành
    assert a["returned_orders"] == 1
    assert a["monetary"] == 200000             # chỉ đơn hoàn thành đã chốt trước cutoff
    assert a["orders_ch__TikTok Shop"] == 1 and a["orders_ch__Facebook Fanpage"] == 2
    assert a["recency_days"] == pytest.approx(2.0)
    assert a["tenure_days"] == pytest.approx(28.0)
    assert a["processing_hours_mean"] == pytest.approx(48.0)  # chỉ 2 đơn đã chốt
    assert agg.loc["B", "cancelled_orders"] == 1 and agg.loc["B", "region"] == "Miền Bắc"


def test_features_invariant_to_post_cutoff_information(orders):
    """Chống rò rỉ: thay đổi MỌI thông tin sau cutoff không được làm đổi đặc trưng."""
    base = fe.build_model_features(fe.build_customer_aggregates(orders, T))

    mutated = orders.copy()
    after_update = mutated["update_time"] >= T
    mutated.loc[after_update, "status_group"] = "Returned"           # đổi trạng thái chốt sau cutoff
    mutated.loc[after_update, "update_time"] += pd.Timedelta(days=30)  # đổi thời điểm chốt sau cutoff
    mutated = mutated[mutated["order_time"] < T]                      # xóa toàn bộ đơn sau cutoff
    extra = fe.prepare_orders(pd.DataFrame([_order("B", 99, "2022-10-02", channel="Shopee")]))
    mutated = pd.concat([mutated, extra])                             # thêm đơn mới sau cutoff

    pd.testing.assert_frame_equal(base, fe.build_model_features(fe.build_customer_aggregates(mutated, T)))


def test_labels(orders):
    y = fe.build_labels(orders, T, pd.Timestamp("2022-10-10"), ["A", "B"])
    assert y.to_dict() == {"A": 0, "B": 1}   # A mua lại, B không


def test_model_features_derived_values(orders):
    X = fe.build_model_features(fe.build_customer_aggregates(orders, T), processing_hours_fill=10)
    assert list(X.columns) == fe.MODEL_FEATURES
    a, b = X.loc["A"], X.loc["B"]
    assert a["return_rate"] == pytest.approx(1 / 3) and a["pending_rate"] == pytest.approx(1 / 3)
    assert a["num_channels"] == 2 and a["is_omnichannel"] == 1
    assert a["channel_entropy"] == pytest.approx(-(2 / 3 * np.log2(2 / 3) + 1 / 3 * np.log2(1 / 3)))
    assert a["primary_channel__Facebook Fanpage"] == 1 and a["primary_channel_share"] == pytest.approx(2 / 3)
    assert a["customer_age_days"] == pytest.approx(30.0)
    assert a["mean_interpurchase_days"] == pytest.approx(14.0)
    assert a["num_categories"] == 2 and a["ad_order_ratio"] == pytest.approx(1 / 3)
    assert b["cancel_rate"] == 1 and b["cod_ratio"] == 0 and b["region__Miền Bắc"] == 1
    assert b["avg_order_value_log"] == 0 and b["is_repeat_customer"] == 0


def test_missing_processing_hours_uses_fill_and_flag():
    row = {c: 0 for c in fe.AGGREGATE_COLUMNS}
    row.update({"recency_days": 1, "total_orders": 1, "processing_hours_mean": np.nan, "region": "Chưa xác định", "orders_ch__Website": 1})
    agg = pd.DataFrame([row])
    X = fe.build_model_features(agg, processing_hours_fill=77.0)
    assert X.loc[0, "processing_hours_mean"] == 77.0 and X.loc[0, "processing_hours_known"] == 0
    assert X[[c for c in fe.MODEL_FEATURES if c.startswith("region__")]].sum(axis=1).iloc[0] == 0


def test_rank_rfm_centroids_uses_all_three_dimensions():
    centroids = np.array([
        [2.0, -0.5, 0.5],   # -2.0 -> Rủi ro
        [-1.0, 2.0, 1.5],   # 4.5  -> VIP
        [-0.5, 0.0, 0.2],   # 0.7  -> Tiềm năng
        [0.0, -0.5, 1.0],   # 0.5  -> Cần chăm sóc (M cao hơn cụm 2 nhưng không phải VIP)
    ])
    assert fe.rank_rfm_centroids(centroids) == {1: "VIP", 2: "Tiềm năng", 3: "Cần chăm sóc", 0: "Rủi ro"}


def test_rfm_feature_frame_log_transform():
    X = fe.rfm_feature_frame([10], [1], [0])
    assert list(X.columns) == ["recency", "frequency_log", "monetary_log"]
    assert X.iloc[0].tolist() == [10.0, np.log1p(1), 0.0]


def test_explain_rows_on_small_xgboost():
    from xgboost import XGBClassifier
    from backend.ml.explain import explain_rows, global_shap_importance, make_explainer

    rng = np.random.RandomState(0)
    X = pd.DataFrame({"recency_days": rng.uniform(0, 60, 300), "total_orders": rng.randint(1, 5, 300).astype(float)})
    y = (X["recency_days"] > 20).astype(int)
    model = XGBClassifier(n_estimators=30, max_depth=2).fit(X, y)
    expl = make_explainer(model)
    imp = global_shap_importance(expl, X)
    assert imp[0]["feature"] == "recency_days" and imp[0]["direction"] == "tăng rủi ro"
    assert abs(sum(d["importance"] for d in imp) - 1) < 1e-3
    factors = explain_rows(expl, X.iloc[[0]], top_k=2)[0]
    assert len(factors) == 2 and factors[0]["label"].startswith("Số ngày từ đơn gần nhất")
