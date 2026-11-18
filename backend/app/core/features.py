"""
Định nghĩa đặc trưng dùng CHUNG cho huấn luyện (train_pipeline.py) và suy luận (API),
đảm bảo không lệch tiền xử lý giữa train và serving.

Nguồn dữ liệu: Cleaned_data/orders_cleaned.csv (đơn hàng đa kênh thực tế 06–11/2022).
"""

from typing import Dict, Iterable, List

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# CHURN (Out-of-time): đặc trưng hành vi trong cửa sổ quan sát (trước mốc cutoff)
# ---------------------------------------------------------------------------

CHANNELS: List[str] = ["Facebook Fanpage", "Shopee", "TikTok Shop", "Unknown/Other", "Website"]
REGIONS: List[str] = ["Miền Bắc", "Miền Nam", "Miền Trung"]  # "Chưa xác định" -> tất cả bằng 0

# Đặc trưng số được chuẩn hóa bằng StandardScaler
CHURN_NUMERIC_FEATURES: List[str] = [
    "recency_days",
    "total_orders",
    "completed_orders",
    "monetary_log",
    "avg_order_value_log",
    "return_rate",
    "cancel_rate",
    "ad_order_ratio",
    "processing_hours_mean",
    "num_channels",
    "is_omnichannel",
    "tenure_days",
]
CHURN_CATEGORICAL_FEATURES: List[str] = [f"channel_{c}" for c in CHANNELS] + [f"region_{r}" for r in REGIONS]
CHURN_FEATURES: List[str] = CHURN_NUMERIC_FEATURES + CHURN_CATEGORICAL_FEATURES

# Ánh xạ sang tên cột trong Cleaned_data/*_churn_oot.csv (đã chuẩn hóa sẵn) để kiểm chứng tái dựng
OOT_COLUMN_MAP: Dict[str, str] = {
    "recency_days": "obs_recency_days",
    "total_orders": "obs_total_orders",
    "completed_orders": "obs_completed_orders",
    "monetary_log": "obs_monetary_log",
    "avg_order_value_log": "obs_avg_order_value_log",
    "return_rate": "obs_return_rate",
    "cancel_rate": "obs_cancel_rate",
    "ad_order_ratio": "obs_ad_order_ratio",
    "processing_hours_mean": "obs_processing_hours_mean",
    "num_channels": "obs_num_channels",
    "is_omnichannel": "obs_is_omnichannel",
    "tenure_days": "obs_tenure_days",
}


def build_churn_raw_features(orders: pd.DataFrame, cutoff: pd.Timestamp) -> pd.DataFrame:
    """
    Tổng hợp đặc trưng thô theo khách hàng từ các đơn hàng TRƯỚC mốc cutoff.
    Trả về DataFrame index=customer_id với các cột đầu vào thô (giống payload API).
    """
    ob = orders[orders["order_time"] < cutoff].copy()
    ob["is_completed"] = (ob["status_group"] == "Completed").astype(int)
    ob["is_cancelled"] = (ob["status_group"] == "Cancelled").astype(int)
    ob["completed_value"] = ob["total_price_cleaned"] * ob["is_completed"]

    g = ob.groupby("customer_id")
    raw = pd.DataFrame({
        "recency_days": (cutoff - g["order_time"].max()).dt.total_seconds() / 86400.0,
        "total_orders": g["order_id"].nunique(),
        "completed_orders": g["is_completed"].sum(),
        "monetary": g["completed_value"].sum(),
        "returned_orders": g["is_returned"].sum(),
        "cancelled_orders": g["is_cancelled"].sum(),
        "ad_orders": g["is_from_ad"].sum(),
        "processing_hours_mean": g["processing_hours"].mean(),
        "num_channels": g["channel_group"].nunique(),
        "tenure_days": (g["order_time"].max() - g["order_time"].min()).dt.total_seconds() / 86400.0,
        "primary_channel": g["channel_group"].agg(lambda s: s.mode().iloc[0]),
        "region": g["region_type"].agg(lambda s: s.mode().iloc[0]),
    })
    return raw


def churn_feature_frame(raw: pd.DataFrame) -> pd.DataFrame:
    """
    Biến đổi đầu vào thô (training hoặc payload API) -> ma trận đặc trưng CHURN_FEATURES (chưa scale).
    Cột bắt buộc: recency_days, total_orders, completed_orders, monetary, returned_orders,
    cancelled_orders, ad_orders, processing_hours_mean, num_channels, tenure_days, primary_channel, region.
    """
    total = raw["total_orders"].astype(float).clip(lower=1)
    completed = raw["completed_orders"].astype(float)
    monetary = raw["monetary"].astype(float).clip(lower=0)
    aov = np.where(completed > 0, monetary / completed.clip(lower=1), 0.0)

    X = pd.DataFrame(index=raw.index)
    X["recency_days"] = raw["recency_days"].astype(float)
    X["total_orders"] = total
    X["completed_orders"] = completed
    X["monetary_log"] = np.log1p(monetary)
    X["avg_order_value_log"] = np.log1p(aov)
    X["return_rate"] = raw["returned_orders"].astype(float) / total
    X["cancel_rate"] = raw["cancelled_orders"].astype(float) / total
    X["ad_order_ratio"] = raw["ad_orders"].astype(float) / total
    X["processing_hours_mean"] = raw["processing_hours_mean"].astype(float)
    X["num_channels"] = raw["num_channels"].astype(float)
    X["is_omnichannel"] = (raw["num_channels"].astype(float) > 1).astype(float)
    X["tenure_days"] = raw["tenure_days"].astype(float)
    for c in CHANNELS:
        X[f"channel_{c}"] = (raw["primary_channel"] == c).astype(float)
    for r in REGIONS:
        X[f"region_{r}"] = (raw["region"] == r).astype(float)
    return X[CHURN_FEATURES]


# ---------------------------------------------------------------------------
# RFM (K-Means)
# ---------------------------------------------------------------------------

RFM_FEATURES: List[str] = ["recency", "frequency_log", "monetary_log"]
SEGMENT_LABELS: List[str] = ["VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"]


def rfm_feature_frame(recency: Iterable[float], frequency: Iterable[float], monetary: Iterable[float]) -> pd.DataFrame:
    """R giữ nguyên (ngày), F và M lệch phải mạnh nên lấy log1p trước khi chuẩn hóa."""
    return pd.DataFrame({
        "recency": np.asarray(list(recency), dtype=float),
        "frequency_log": np.log1p(np.asarray(list(frequency), dtype=float)),
        "monetary_log": np.log1p(np.clip(np.asarray(list(monetary), dtype=float), 0, None)),
    })[RFM_FEATURES]


def rank_rfm_centroids(centroids_scaled: np.ndarray) -> Dict[int, str]:
    """
    Xếp hạng tâm cụm theo điểm tổng hợp trên không gian đã chuẩn hóa:
        score = -R_z + F_z + M_z   (Recency càng thấp càng tốt nên đảo dấu)
    Điểm cao nhất -> VIP, rồi Tiềm năng, Cần chăm sóc, thấp nhất -> Rủi ro.
    """
    scores = -centroids_scaled[:, 0] + centroids_scaled[:, 1] + centroids_scaled[:, 2]
    order = np.argsort(-scores)
    return {int(cid): SEGMENT_LABELS[rank] for rank, cid in enumerate(order)}
