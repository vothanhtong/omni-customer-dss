import pytest

from backend.tests.conftest import requires_models

CHURN_OK = {
    "recency_days": 20, "tenure_days": 15, "total_orders": 2, "orders_last_30d": 2, "orders_last_7d": 0,
    "completed_orders": 1, "returned_orders": 1, "cancelled_orders": 0, "monetary": 350000,
    "ad_orders": 1, "cod_orders": 2, "orders_by_channel": {"Facebook Fanpage": 2}, "region": "Miền Nam",
}


# ------------------------------- /api/rfm/predict -------------------------------
@requires_models
@pytest.mark.parametrize("payload", [
    {"recency": 5, "frequency": 3, "monetary": 1500000},
    {"recency": 10, "frequency": 1, "monetary": 300000},
    {"recency": 60, "frequency": 1, "monetary": 300000},
    {"recency": 10, "frequency": 0, "monetary": 0},
])
def test_rfm_predict_returns_known_segment(client, payload):
    r = client.post("/api/rfm/predict", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["segment_name"] in {"VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"}
    assert body["recency"] == payload["recency"] and body["frequency"] == payload["frequency"]


@requires_models
def test_rfm_segments_are_ordered_sensibly(client):
    seg = lambda p: client.post("/api/rfm/predict", json=p).json()["segment_name"]
    assert seg({"recency": 2, "frequency": 4, "monetary": 2000000}) == "VIP"
    assert seg({"recency": 10, "frequency": 0, "monetary": 0}) == "Rủi ro"
    # Hồi quy lỗi VIP: khách chỉ có đơn hủy/hoàn (0 đơn thành công, 0đ) không được xếp VIP
    assert seg({"recency": 3, "frequency": 0, "monetary": 0}) != "VIP"


@pytest.mark.parametrize("payload", [
    {"recency": -1, "frequency": 1, "monetary": 0},
    {"recency": 1, "frequency": 0, "monetary": 500000},  # có doanh thu nhưng 0 đơn thành công
    {"recency": 1, "frequency": -1, "monetary": 0},
    {"recency": 1, "frequency": 1, "monetary": -5},
    {"recency": 1, "frequency": 1},
])
def test_rfm_predict_validation(client, payload):
    assert client.post("/api/rfm/predict", json=payload).status_code == 422


# ------------------------------- /api/churn/predict -----------------------------
@requires_models
def test_churn_predict_ok_with_top_factors(client):
    r = client.post("/api/churn/predict", json=CHURN_OK)
    assert r.status_code == 200, r.text
    body = r.json()
    assert 0.0 <= body["churn_probability"] <= 1.0
    assert body["churn_probability_pct"] == pytest.approx(body["churn_probability"] * 100, abs=0.01)
    assert body["churn_prediction"] == int(body["churn_probability"] >= 0.5)
    assert body["repurchase_probability"] == pytest.approx(1 - body["churn_probability"], abs=1e-4)  # xu hướng mua
    expected = "High Risk" if body["churn_probability"] >= 0.7 else "Medium Risk" if body["churn_probability"] >= 0.4 else "Low Risk"
    assert body["risk_level"] == expected
    assert body["model_name"] in {"Random Forest", "XGBoost"}
    factors = body["top_factors"]
    assert 1 <= len(factors) <= 5
    assert all(f["effect"] in {"tăng rủi ro rời bỏ", "giảm rủi ro rời bỏ"} and f["label"] for f in factors)
    assert [abs(f["shap_value"]) for f in factors] == sorted((abs(f["shap_value"]) for f in factors), reverse=True)


@requires_models
def test_churn_predict_matches_training_pipeline(client):
    """API phải cho cùng xác suất với pipeline huấn luyện khi nhận cùng số liệu thô."""
    import joblib, pandas as pd
    from backend.app.core.config import SAVED_MODELS_DIR
    from backend.app.core.ml_models import churn_payload_to_aggregates, load_metrics
    from backend.ml.feature_engineering import build_model_features

    model = joblib.load(f"{SAVED_MODELS_DIR}/churn_model.pkl")
    feats = joblib.load(f"{SAVED_MODELS_DIR}/churn_features.pkl")
    fill = load_metrics()["churn"]["inference_defaults"]["processing_hours_mean"]
    X = build_model_features(churn_payload_to_aggregates(CHURN_OK), fill)[feats]
    expected = float(model.predict_proba(X)[0][1])
    assert client.post("/api/churn/predict", json=CHURN_OK).json()["churn_probability"] == pytest.approx(expected, abs=1e-4)


@requires_models
def test_churn_predict_minimal_payload_uses_defaults(client):
    r = client.post("/api/churn/predict", json={"recency_days": 3, "total_orders": 1, "completed_orders": 1, "monetary": 200000})
    assert r.status_code == 200, r.text


@pytest.mark.parametrize("override", [
    {"total_orders": 0},
    {"completed_orders": 3},                        # completed > total
    {"completed_orders": 1, "returned_orders": 2},  # tổng > total
    {"ad_orders": 5},
    {"orders_last_7d": 2, "orders_last_30d": 1},
    {"recency_days": 40},                           # recency > 30 nhưng orders_last_30d = 2
    {"orders_by_channel": {"Facebook Fanpage": 1}}, # tổng kênh != total_orders
    {"orders_by_channel": {"POS": 2}},
    {"region": "Hà Nội"},
    {"recency_days": -1},
])
def test_churn_predict_validation(client, override):
    assert client.post("/api/churn/predict", json={**CHURN_OK, **override}).status_code == 422


def test_single_order_with_tenure_rejected(client):
    p = {"recency_days": 3, "total_orders": 1, "completed_orders": 1, "monetary": 1, "tenure_days": 5}
    assert client.post("/api/churn/predict", json=p).status_code == 422


# ------------------------------- /api/dss/evaluate ------------------------------
@pytest.mark.parametrize("segment,churn,level", [
    ("VIP", 0.9, "CRITICAL"),
    ("VIP", 0.1, "LOW"),
    ("Tiềm năng", 0.5, "MEDIUM"),
    ("Cần chăm sóc", 0.8, "HIGH"),
    ("Rủi ro", 0.2, "MEDIUM"),
    ("Rủi ro", 55, "HIGH"),
])
def test_dss_evaluate(client, segment, churn, level):
    r = client.post("/api/dss/evaluate", json={"customer_id": "C1", "rfm_segment": segment, "churn_risk": churn})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["alert_level"] == level
    assert body["recommendations"] and isinstance(body["matched_rules"], list)


@pytest.mark.parametrize("churn", [-0.1, 101])
def test_dss_evaluate_validation(client, churn):
    assert client.post("/api/dss/evaluate", json={"rfm_segment": "VIP", "churn_risk": churn}).status_code == 422


def test_dss_evaluate_batch_uses_insert_many(client, monkeypatch):
    from backend.app.core.database import db_manager
    calls = []

    async def fake_save_many(records):
        calls.append(records)
        return True

    async def fail_single(_):  # không được gọi trong batch
        raise AssertionError("save_dss_log không được dùng cho batch")

    monkeypatch.setattr(db_manager, "save_dss_logs", fake_save_many)
    monkeypatch.setattr(db_manager, "save_dss_log", fail_single)
    payload = [{"customer_id": f"C{i}", "rfm_segment": s, "churn_risk": c}
               for i, (s, c) in enumerate([("VIP", 0.9), ("Rủi ro", 0.1), ("Tiềm năng", 0.3)])]
    r = client.post("/api/dss/evaluate-batch", json=payload)
    assert r.status_code == 200, r.text
    assert [x["alert_level"] for x in r.json()] == ["CRITICAL", "MEDIUM", "LOW"]
    assert len(calls) == 1 and len(calls[0]) == 3
    assert all("timestamp" in rec and "alert_level" in rec for rec in calls[0])


# ------------------------------- /api/metrics -----------------------------------
@requires_models
def test_metrics_endpoint(client):
    r = client.get("/api/metrics")
    assert r.status_code == 200
    m = r.json()["churn"]
    assert {x["model"] for x in m["models"]} == {"Logistic Regression", "Decision Tree", "Random Forest", "XGBoost"}
    assert m["n_train"] > 0 and m["n_test"] > 0
    for x in m["models"]:
        for k in ("accuracy", "precision", "recall", "f1_score", "roc_auc"):
            assert 0.0 <= x["test"][k] <= 1.0
    assert m["best_model"] in {"Random Forest", "XGBoost"}
    assert m["best_model_feature_importance"] and m["importance_method"].startswith("SHAP")
    assert m["leakage_audit"]["share_updated_after_cutoff"] > 0
    for x in m["models"]:
        if x["family"] == "advanced":
            assert "imbalance_ablation" in x


# ------------------------------- /api/analytics/overview ------------------------
def test_analytics_requires_login(client):
    assert client.get("/api/analytics/overview").status_code == 401


@requires_models
def test_analytics_overview(client):
    import os
    from backend.app.api.analytics import ANALYTICS_PATH
    if not os.path.exists(ANALYTICS_PATH):
        pytest.skip("chưa chạy train_pipeline.py")
    token = client.post("/api/auth/login", json={"email": "business@retail.vn", "password": "user123"}).json()["access_token"]
    r = client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    a = r.json()
    assert {c["name"] for c in a["channel_distribution"]} >= {"Facebook Fanpage", "Website", "TikTok Shop"}
    assert {c["name"] for c in a["region_distribution"]} >= {"Miền Bắc", "Miền Trung", "Miền Nam"}
    assert sum(c["orders"] for c in a["channel_distribution"]) == a["totals"]["orders"]
    trend = a["churn"]["weekly_trend"]
    assert trend and all(p["churn_rate"] is None or 0 <= p["churn_rate"] <= 1 for p in trend)
    # tuần quá ít khách -> không tính tỷ lệ (tránh tỷ lệ 100% trên 1-2 khách)
    assert all(p["churn_rate"] is None for p in trend if p["active_customers"] < a["min_group_size_for_rates"])
    assert a["feature_importance"]
    text = r.text
    assert "KH_" not in text  # không lộ customer_id
