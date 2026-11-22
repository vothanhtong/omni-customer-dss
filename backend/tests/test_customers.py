import os
import re

import pytest

from backend.app.core.customer_store import CustomerStore, customer_ref, mask_customer_id, SCORED_PATH

PHONE_ID = re.compile(r"KH_\d{9,}")


# ------------------------------------------------------------------ store (CSV tạm)
@pytest.fixture
def store(tmp_path):
    p = tmp_path / "scored.csv"
    p.write_text(
        "customer_id,recency,frequency,monetary,fav_channel,region,churn_prob,rfm_segment,actual_churn\n"
        "KH_0900000001,40.0,1,0.0,Facebook Fanpage,Miền Nam,0.91,VIP,1\n"
        "KH_0900000002,10.0,2,500000,Website,Miền Bắc,0.75,Tiềm năng,1\n"
        "KH_0900000003,5.0,1,200000,TikTok Shop,Miền Trung,0.55,Rủi ro,0\n"
        "KH_0900000004,2.0,3,900000,Facebook Fanpage,Miền Nam,0.10,VIP,0\n",
        encoding="utf-8",
    )
    return CustomerStore(str(p))


def test_mask_customer_id():
    assert mask_customer_id("KH_0908774444") == "KH_0908***444"
    assert "774" not in mask_customer_id("KH_0908774444")
    assert mask_customer_id("KH_123") == "KH_1***"


def test_ref_is_stable_and_opaque():
    assert customer_ref("KH_0908774444") == customer_ref("KH_0908774444")
    assert customer_ref("KH_0908774444") != customer_ref("KH_0908774445")
    assert "0908774444" not in customer_ref("KH_0908774444")


def test_store_levels_sorting_and_no_raw_id(store):
    rows = store.all()
    levels = [r["alert_level"] for r in rows]
    assert levels == ["CRITICAL", "HIGH", "HIGH", "LOW"]  # VIP 91% / >70% / Rủi ro 55% / VIP 10%
    assert rows[1]["churn_prob_pct"] > rows[2]["churn_prob_pct"]
    assert not any(PHONE_ID.search(str(v)) for r in rows for v in r.values())


def test_store_query_filters_and_paging(store):
    res = store.risk(["CRITICAL", "HIGH"])
    assert res["total"] == 3 and res["population"] == 4
    assert res["alert_counts"] == {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 0, "LOW": 1}
    assert store.risk(["CRITICAL", "HIGH"], region="Miền Bắc")["total"] == 1
    assert store.risk(None, segment="VIP")["total"] == 2
    p2 = store.risk(None, page=2, page_size=3)
    assert len(p2["items"]) == 1 and p2["total"] == 4


def test_store_opportunities(store):
    res = store.opportunities()
    # Chỉ khách VIP/Tiềm năng có xác suất mua lại >= 60%: KH 4 (VIP, churn 10% -> mua lại 90%)
    assert res["total"] == 1 and res["opportunity_count"] == 1
    it = res["items"][0]
    assert it["segment"] == "VIP" and it["repurchase_prob_pct"] == 90.0
    assert it["recommendations"]  # DSS vẫn có khuyến nghị (tri ân / cross-sell)


# ------------------------------------------------------------------ API (dữ liệu thật)
requires_scored = pytest.mark.skipif(not os.path.exists(SCORED_PATH), reason="chưa chạy train_pipeline.py")


@pytest.fixture
def auth(client):
    token = client.post("/api/auth/login", json={"email": "business@retail.vn", "password": "user123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_high_risk_requires_login(client):
    assert client.get("/api/customers/high-risk").status_code == 401
    assert client.post("/api/customers/abc/actions", json={"action": "x"}).status_code == 401


@requires_scored
def test_high_risk_list(client, auth):
    r = client.get("/api/customers/high-risk", headers=auth)
    assert r.status_code == 200
    d = r.json()
    assert d["items"] and all(it["alert_level"] in ("CRITICAL", "HIGH") for it in d["items"])
    probs = [it["churn_prob_pct"] for it in d["items"] if it["alert_level"] == "HIGH"]
    assert probs == sorted(probs, reverse=True)
    assert not PHONE_ID.search(r.text)  # không lộ số điện thoại
    assert d["data_note"]

    r2 = client.get("/api/customers/high-risk", headers=auth, params={"alert_level": "LOW", "page_size": 5})
    assert r2.status_code == 200 and all(it["alert_level"] == "LOW" for it in r2.json()["items"])
    assert client.get("/api/customers/high-risk", headers=auth, params={"alert_level": "BAD"}).status_code == 422
    assert client.get("/api/customers/high-risk", headers=auth, params={"page_size": 500}).status_code == 422


@requires_scored
def test_opportunities_api(client, auth):
    assert client.get("/api/customers/opportunities").status_code == 401
    r = client.get("/api/customers/opportunities", headers=auth, params={"page_size": 50})
    assert r.status_code == 200
    d = r.json()
    assert d["total"] == d["opportunity_count"]
    items = d["items"]
    assert all(it["segment"] in ("VIP", "Tiềm năng") and it["repurchase_prob_pct"] >= 60 for it in items)
    probs = [it["repurchase_prob_pct"] for it in items]
    assert probs == sorted(probs, reverse=True)
    assert all(abs(it["repurchase_prob_pct"] + it["churn_prob_pct"] - 100) < 0.02 for it in items)
    assert not PHONE_ID.search(r.text)


@requires_scored
def test_trigger_action_flow(client, auth):
    item = client.get("/api/customers/high-risk", headers=auth, params={"page_size": 1}).json()["items"][0]
    ref, rec = item["ref"], item["recommendations"][0]

    assert client.post(f"/api/customers/{ref}/actions", headers=auth, json={"action": "tự bịa"}).status_code == 422
    assert client.post("/api/customers/khong-ton-tai/actions", headers=auth, json={"action": rec}).status_code == 404

    r = client.post(f"/api/customers/{ref}/actions", headers=auth, json={"action": rec, "note": "gọi lúc 9h"})
    assert r.status_code == 201
    a = r.json()
    assert a["action"] == rec and a["triggered_by"] == "business@retail.vn"
    assert a["persisted"] is False  # test chạy offline, không có MongoDB

    again = client.get("/api/customers/high-risk", headers=auth, params={"page_size": 1}).json()["items"][0]
    assert again["ref"] == ref and again["last_action"]["action"] == rec
