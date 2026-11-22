import os
import re

import numpy as np
import pandas as pd
import pytest

from backend.ml.evaluate_dss import OUTPUT_PATH, cumulative_gains, evaluate

PHONE_ID = re.compile(r"KH_\d{9,}")


def test_cumulative_gains_perfect_and_random_ranking():
    pos = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])
    perfect = cumulative_gains(np.arange(10, 0, -1), pos, points=10)
    assert perfect[1]["captured_share"] == 1.0 and perfect[1]["precision"] == 1.0  # top 20% bắt đủ 2/2
    assert perfect[-1]["captured_share"] == 1.0
    worst = cumulative_gains(np.arange(1, 11), pos, points=10)
    assert worst[7]["captured_share"] == 0.0  # 2 dương tính bị xếp cuối


def test_evaluate_groups_and_no_raw_ids():
    df = pd.DataFrame({
        "customer_id": [f"KH_09000000{i:02d}" for i in range(6)],
        "recency": [5, 6, 30, 40, 2, 3], "frequency": [2, 1, 0, 1, 2, 1], "total_orders": [2, 1, 1, 1, 2, 1],
        "monetary": [600000, 300000, 0, 300000, 700000, 300000],
        "fav_channel": ["Website"] * 6, "region": ["Miền Nam"] * 6,
        "churn_prob": [0.80, 0.75, 0.85, 0.50, 0.15, 0.30],
        "rfm_segment": ["VIP", "Tiềm năng", "Rủi ro", "Cần chăm sóc", "VIP", "Tiềm năng"],
        "actual_churn": [1, 1, 1, 1, 0, 0],
    })
    r = evaluate(df)
    assert r["data"]["customers"] == 6 and r["data"]["base_actual_repurchase_rate"] == pytest.approx(2 / 6, abs=1e-4)
    opp = r["opportunity_alerts"]["alerted"]
    assert opp["customers"] == 2 and opp["actual_repurchase_rate"] == 1.0 and opp["repurchase_lift"] == 3.0
    assert r["risk_alerts"]["alerted"]["actual_churn_rate"] == 1.0
    assert sum(g["customers"] for g in r["by_alert_level"].values()) == 6
    assert not PHONE_ID.search(str(r))  # case study chỉ dùng ID đã che


@pytest.mark.skipif(not os.path.exists(OUTPUT_PATH), reason="chưa chạy train_pipeline.py")
def test_evaluation_endpoint(client):
    r = client.get("/api/dss/evaluation")
    assert r.status_code == 200
    d = r.json()
    assert d["opportunity_alerts"]["alerted"]["customers"] >= 0 and d["repurchase_ranking"]["cumulative_gains"]
    assert not PHONE_ID.search(r.text)
