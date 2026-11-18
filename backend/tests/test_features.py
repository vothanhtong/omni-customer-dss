import numpy as np
import pandas as pd

from backend.app.core.features import CHURN_FEATURES, churn_feature_frame, rank_rfm_centroids, rfm_feature_frame


def test_rank_rfm_centroids_uses_all_three_dimensions():
    # cột: recency_z, frequency_z, monetary_z
    centroids = np.array([
        [2.0, -0.5, 0.5],   # M khá nhưng lâu không mua -> điểm -2.0
        [-1.0, 2.0, 1.5],   # điểm 4.5 -> VIP
        [-0.5, 0.0, 0.2],   # 0.7 -> Tiềm năng
        [0.0, -0.5, 1.0],   # 0.5 -> Cần chăm sóc  (M cao hơn cụm 2 nhưng không phải VIP)
    ])
    mapping = rank_rfm_centroids(centroids)
    assert mapping == {1: "VIP", 2: "Tiềm năng", 3: "Cần chăm sóc", 0: "Rủi ro"}


def test_rfm_feature_frame_log_transform():
    X = rfm_feature_frame([10], [1], [0])
    assert list(X.columns) == ["recency", "frequency_log", "monetary_log"]
    assert X.iloc[0].tolist() == [10.0, np.log1p(1), 0.0]


def test_churn_feature_frame_derived_values():
    raw = pd.DataFrame([{
        "recency_days": 5, "total_orders": 4, "completed_orders": 2, "monetary": 600000,
        "returned_orders": 1, "cancelled_orders": 1, "ad_orders": 2, "processing_hours_mean": 30,
        "num_channels": 2, "tenure_days": 12, "primary_channel": "TikTok Shop", "region": "Miền Bắc",
    }])
    X = churn_feature_frame(raw)
    assert list(X.columns) == CHURN_FEATURES
    row = X.iloc[0]
    assert row["return_rate"] == 0.25 and row["cancel_rate"] == 0.25 and row["ad_order_ratio"] == 0.5
    assert row["avg_order_value_log"] == np.log1p(300000)
    assert row["is_omnichannel"] == 1.0
    assert row["channel_TikTok Shop"] == 1.0 and row["channel_Facebook Fanpage"] == 0.0
    assert row["region_Miền Bắc"] == 1.0 and row["region_Miền Nam"] == 0.0


def test_unknown_region_encodes_all_zero():
    raw = pd.DataFrame([{
        "recency_days": 1, "total_orders": 1, "completed_orders": 0, "monetary": 0,
        "returned_orders": 0, "cancelled_orders": 0, "ad_orders": 0, "processing_hours_mean": 10,
        "num_channels": 1, "tenure_days": 0, "primary_channel": "Website", "region": "Chưa xác định",
    }])
    X = churn_feature_frame(raw)
    assert X[[c for c in CHURN_FEATURES if c.startswith("region_")]].sum(axis=1).iloc[0] == 0
    assert X["avg_order_value_log"].iloc[0] == 0.0
