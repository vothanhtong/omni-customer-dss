"""
Feature Engineering — đặc trưng hành vi khách hàng đa kênh (dùng chung cho huấn luyện & API).

Nguyên tắc chống rò rỉ nhãn (target leakage) — POINT-IN-TIME:
  * Chỉ dùng các đơn hàng có `inserted_at < cutoff`.
  * Trạng thái đơn (hoàn thành / hoàn trả / hủy) chỉ được coi là "đã biết" nếu lần cập nhật cuối
    (`updated_at`) xảy ra TRƯỚC cutoff; ngược lại đơn được coi là "đang xử lý" tại cutoff.
    (Dữ liệu xuất ra ghi trạng thái cuối cùng; ~26% đơn trước cutoff được cập nhật SAU cutoff.)
  * Thời gian xử lý đơn chỉ tính trên các đơn đã kết thúc trước cutoff.
  * KHÔNG dùng các cột tổng hợp sẵn trên toàn bộ lịch sử của orders_cleaned.csv
    (num_distinct_recipients, is_shared_phone, remain_quantity, ...) vì chúng chứa thông tin sau cutoff.

Hai tầng:
  1. build_customer_aggregates(orders, cutoff) -> số liệu thô theo khách (giống payload API).
  2. build_model_features(aggregates)           -> ma trận đặc trưng cho mô hình (tỷ lệ, log, one-hot...).
     API gọi trực tiếp tầng 2 với payload => train/serve dùng cùng một hàm.
"""

import os
from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Hằng số miền dữ liệu
# ---------------------------------------------------------------------------
CHANNELS: List[str] = ["Facebook Fanpage", "Shopee", "TikTok Shop", "Unknown/Other", "Website"]
REGIONS: List[str] = ["Miền Bắc", "Miền Nam", "Miền Trung"]  # "Chưa xác định" -> mã hóa toàn 0
ALL_REGIONS: List[str] = REGIONS + ["Chưa xác định"]

CHANNEL_COUNT_COLS: Dict[str, str] = {c: f"orders_ch__{c}" for c in CHANNELS}

# Cột thô (tầng 1) — khớp với ChurnPredictionRequest
AGGREGATE_COLUMNS: List[str] = [
    "recency_days", "tenure_days",
    "total_orders", "orders_last_7d", "orders_last_30d",
    "completed_orders", "returned_orders", "cancelled_orders",
    "monetary", "ad_orders", "cod_orders", "num_categories", "num_sources",
    "processing_hours_mean", "region",
] + list(CHANNEL_COUNT_COLS.values())

# Đặc trưng mô hình (tầng 2)
NUMERIC_FEATURES: List[str] = [
    # R-F-M
    "recency_days", "total_orders", "monetary_log", "avg_order_value_log",
    # vòng đời & nhịp mua
    "customer_age_days", "tenure_days", "mean_interpurchase_days", "is_repeat_customer",
    "orders_last_7d", "orders_last_30d",
    # chất lượng đơn (as-of cutoff)
    "completed_orders", "completed_rate", "return_rate", "cancel_rate", "pending_rate",
    "processing_hours_mean", "processing_hours_known",
    # hành vi mua
    "ad_order_ratio", "cod_ratio", "num_categories",
    # đa kênh
    "num_channels", "is_omnichannel", "channel_entropy", "primary_channel_share", "num_sources",
]
CATEGORICAL_FEATURES: List[str] = [f"primary_channel__{c}" for c in CHANNELS] + [f"region__{r}" for r in REGIONS]
MODEL_FEATURES: List[str] = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Tên tiếng Việt để giải thích mô hình trước hội đồng / trên giao diện
FEATURE_LABELS: Dict[str, str] = {
    "recency_days": "Số ngày từ đơn gần nhất (Recency)",
    "total_orders": "Tổng số đơn (Frequency)",
    "monetary_log": "Giá trị đơn thành công (Monetary)",
    "avg_order_value_log": "Giá trị đơn trung bình",
    "customer_age_days": "Số ngày từ đơn đầu tiên",
    "tenure_days": "Khoảng cách đơn đầu – đơn cuối",
    "mean_interpurchase_days": "Chu kỳ mua lại trung bình",
    "is_repeat_customer": "Khách đã mua lại",
    "orders_last_7d": "Số đơn 7 ngày gần nhất",
    "orders_last_30d": "Số đơn 30 ngày gần nhất",
    "completed_orders": "Số đơn giao thành công",
    "completed_rate": "Tỷ lệ đơn thành công",
    "return_rate": "Tỷ lệ đơn hoàn trả",
    "cancel_rate": "Tỷ lệ đơn bị hủy",
    "pending_rate": "Tỷ lệ đơn đang xử lý",
    "processing_hours_mean": "Thời gian xử lý đơn TB (giờ)",
    "processing_hours_known": "Đã có đơn xử lý xong",
    "ad_order_ratio": "Tỷ lệ đơn từ quảng cáo",
    "cod_ratio": "Tỷ lệ đơn thanh toán COD",
    "num_categories": "Số ngành hàng đã mua",
    "num_channels": "Số kênh đã mua",
    "is_omnichannel": "Mua đa kênh",
    "channel_entropy": "Độ đa dạng kênh (entropy)",
    "primary_channel_share": "Tỷ trọng kênh chính",
    "num_sources": "Số fanpage/cửa hàng đã mua",
    **{f"primary_channel__{c}": f"Kênh chính: {c}" for c in CHANNELS},
    **{f"region__{r}": f"Vùng: {r}" for r in REGIONS},
}

COMPLETED, RETURNED, CANCELLED = "Completed", "Returned", "Cancelled"


# ---------------------------------------------------------------------------
# Nạp dữ liệu
# ---------------------------------------------------------------------------
def default_data_dir() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.environ.get("CLEANED_DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(here)), "Cleaned_data"))


def read_csv(name: str, data_dir: Optional[str] = None, **kw) -> pd.DataFrame:
    return pd.read_csv(os.path.join(data_dir or default_data_dir(), name), encoding="utf-8-sig", **kw)


def load_orders(data_dir: Optional[str] = None) -> pd.DataFrame:
    orders = read_csv("orders_cleaned.csv", data_dir, low_memory=False)
    return prepare_orders(orders)


def prepare_orders(orders: pd.DataFrame) -> pd.DataFrame:
    o = orders.copy()
    o["order_time"] = pd.to_datetime(o["inserted_at"])
    o["update_time"] = pd.to_datetime(o["updated_at"], errors="coerce")
    o["channel_group"] = o["channel_group"].fillna("Unknown/Other")
    o["region_type"] = o["region_type"].fillna("Chưa xác định")
    return o


# ---------------------------------------------------------------------------
# Tầng 1: tổng hợp point-in-time theo khách hàng
# ---------------------------------------------------------------------------
def _mode(s: pd.Series) -> str:
    m = s.mode()
    return m.iloc[0] if len(m) else "Chưa xác định"


def build_customer_aggregates(orders: pd.DataFrame, cutoff: pd.Timestamp) -> pd.DataFrame:
    """
    Tổng hợp số liệu thô cho mỗi khách hàng có ít nhất một đơn trước `cutoff`.
    `orders` phải qua prepare_orders(). Mọi thông tin đều được xác định tại thời điểm cutoff.
    """
    ob = orders[orders["order_time"] < cutoff].copy()
    known = ob["update_time"].notna() & (ob["update_time"] < cutoff)  # trạng thái đã chốt trước cutoff
    status = ob["status_group"].where(known, "Pending")

    ob["is_completed"] = (status == COMPLETED).astype(int)
    ob["is_returned"] = (status == RETURNED).astype(int)
    ob["is_cancelled"] = (status == CANCELLED).astype(int)
    ob["completed_value"] = ob["total_price_cleaned"].fillna(0) * ob["is_completed"]
    ob["is_cod"] = (ob["cod_cleaned"].fillna(0) > 0).astype(int)
    ob["proc_hours_known"] = np.where(
        known & status.isin([COMPLETED, RETURNED, CANCELLED]),
        (ob["update_time"] - ob["order_time"]).dt.total_seconds() / 3600.0,
        np.nan,
    )
    ob["in_last_7d"] = (ob["order_time"] >= cutoff - pd.Timedelta(days=7)).astype(int)
    ob["in_last_30d"] = (ob["order_time"] >= cutoff - pd.Timedelta(days=30)).astype(int)

    g = ob.groupby("customer_id")
    agg = pd.DataFrame({
        "recency_days": (cutoff - g["order_time"].max()).dt.total_seconds() / 86400.0,
        "tenure_days": (g["order_time"].max() - g["order_time"].min()).dt.total_seconds() / 86400.0,
        "total_orders": g["order_id"].nunique(),
        "orders_last_7d": g["in_last_7d"].sum(),
        "orders_last_30d": g["in_last_30d"].sum(),
        "completed_orders": g["is_completed"].sum(),
        "returned_orders": g["is_returned"].sum(),
        "cancelled_orders": g["is_cancelled"].sum(),
        "monetary": g["completed_value"].sum(),
        "ad_orders": g["is_from_ad"].sum(),
        "cod_orders": g["is_cod"].sum(),
        "num_categories": g["categories_name"].nunique(),
        "num_sources": g["source"].nunique(),
        "processing_hours_mean": g["proc_hours_known"].mean(),
        "region": g["region_type"].agg(_mode),
    })
    counts = ob.pivot_table(index="customer_id", columns="channel_group", values="order_id", aggfunc="count", fill_value=0)
    for c, col in CHANNEL_COUNT_COLS.items():
        agg[col] = counts[c] if c in counts.columns else 0
    agg["num_categories"] = agg["num_categories"].clip(lower=1)
    agg["num_sources"] = agg["num_sources"].clip(lower=1)
    return agg[AGGREGATE_COLUMNS]


def build_labels(orders: pd.DataFrame, cutoff: pd.Timestamp, horizon_end: pd.Timestamp, customers: Iterable[str]) -> pd.Series:
    """target = 1 (churn) nếu khách KHÔNG có đơn nào trong [cutoff, horizon_end]."""
    window = orders[(orders["order_time"] >= cutoff) & (orders["order_time"] <= horizon_end)]
    returned = set(window["customer_id"])
    idx = pd.Index(list(customers))
    return pd.Series([0 if c in returned else 1 for c in idx], index=idx, name="target")


# ---------------------------------------------------------------------------
# Tầng 2: đặc trưng mô hình
# ---------------------------------------------------------------------------
def build_model_features(agg: pd.DataFrame, processing_hours_fill: float = 0.0) -> pd.DataFrame:
    """Biến đổi số liệu thô -> MODEL_FEATURES. Dùng cho cả training và payload API."""
    a = agg.copy()
    for c, col in CHANNEL_COUNT_COLS.items():
        if col not in a:
            a[col] = 0
    total = a["total_orders"].astype(float).clip(lower=1)
    completed = a["completed_orders"].astype(float)
    returned = a["returned_orders"].astype(float)
    cancelled = a["cancelled_orders"].astype(float)
    monetary = a["monetary"].astype(float).clip(lower=0)

    ch = a[list(CHANNEL_COUNT_COLS.values())].astype(float).to_numpy()
    ch_total = ch.sum(axis=1, keepdims=True)
    ch_total_safe = np.where(ch_total > 0, ch_total, 1.0)
    share = ch / ch_total_safe
    with np.errstate(divide="ignore", invalid="ignore"):
        entropy = -(np.where(share > 0, share * np.log2(share), 0.0)).sum(axis=1)
    primary_idx = ch.argmax(axis=1)  # hòa -> kênh đứng trước trong CHANNELS
    has_channel = ch_total.ravel() > 0

    proc = a["processing_hours_mean"].astype(float)

    X = pd.DataFrame(index=a.index)
    X["recency_days"] = a["recency_days"].astype(float)
    X["total_orders"] = total
    X["monetary_log"] = np.log1p(monetary)
    X["avg_order_value_log"] = np.log1p(np.where(completed > 0, monetary / completed.clip(lower=1), 0.0))
    X["customer_age_days"] = a["recency_days"].astype(float) + a["tenure_days"].astype(float)  # = cutoff - đơn đầu tiên
    X["tenure_days"] = a["tenure_days"].astype(float)
    X["mean_interpurchase_days"] = np.where(total > 1, a["tenure_days"].astype(float) / (total - 1).clip(lower=1), 0.0)
    X["is_repeat_customer"] = (total > 1).astype(float)
    X["orders_last_7d"] = a["orders_last_7d"].astype(float)
    X["orders_last_30d"] = a["orders_last_30d"].astype(float)
    X["completed_orders"] = completed
    X["completed_rate"] = completed / total
    X["return_rate"] = returned / total
    X["cancel_rate"] = cancelled / total
    X["pending_rate"] = ((total - completed - returned - cancelled).clip(lower=0)) / total
    X["processing_hours_mean"] = proc.fillna(processing_hours_fill)
    X["processing_hours_known"] = proc.notna().astype(float)
    X["ad_order_ratio"] = a["ad_orders"].astype(float) / total
    X["cod_ratio"] = a["cod_orders"].astype(float) / total
    X["num_categories"] = a["num_categories"].astype(float)
    X["num_channels"] = (ch > 0).sum(axis=1).astype(float)
    X["is_omnichannel"] = (X["num_channels"] > 1).astype(float)
    X["channel_entropy"] = entropy
    X["primary_channel_share"] = np.where(has_channel, share.max(axis=1), 0.0)
    X["num_sources"] = a["num_sources"].astype(float)
    for i, c in enumerate(CHANNELS):
        X[f"primary_channel__{c}"] = ((primary_idx == i) & has_channel).astype(float)
    for r in REGIONS:
        X[f"region__{r}"] = (a["region"] == r).astype(float)
    return X[MODEL_FEATURES]


# ---------------------------------------------------------------------------
# Thiết lập bài toán out-of-time từ các file OOT của nhóm
# ---------------------------------------------------------------------------
def load_oot_split(orders: pd.DataFrame, data_dir: Optional[str] = None) -> dict:
    """
    Dùng NGUYÊN tập khách hàng, nhãn và phép chia train/test của train_churn_oot.csv / test_churn_oot.csv.
    Suy ra cutoff (= đơn đầu tiên sớm nhất của khách KHÔNG thuộc OOT), tính đặc trưng point-in-time
    và kiểm chứng định nghĩa nhãn.
    """
    oot_train = read_csv("train_churn_oot.csv", data_dir).set_index("customer_id")
    oot_test = read_csv("test_churn_oot.csv", data_dir).set_index("customer_id")
    oot_ids = oot_train.index.union(oot_test.index)

    first_order = orders.groupby("customer_id")["order_time"].min()
    cutoff = first_order[~first_order.index.isin(oot_ids)].min()
    if pd.isna(cutoff):
        raise RuntimeError("Không suy ra được mốc cutoff từ dữ liệu OOT.")
    horizon_end = orders["order_time"].max()

    agg = build_customer_aggregates(orders, cutoff)
    missing = oot_ids.difference(agg.index)
    if len(missing):
        raise RuntimeError(f"{len(missing)} khách hàng OOT không có đơn trước cutoff.")

    labels = build_labels(orders, cutoff, horizon_end, oot_ids)
    oot_all = pd.concat([oot_train, oot_test])
    label_agreement = float((labels.loc[oot_all.index] == oot_all["target"]).mean())

    before = orders[orders["order_time"] < cutoff]
    leakage_audit = {
        "orders_before_cutoff": int(len(before)),
        "orders_updated_after_cutoff": int((before["update_time"] >= cutoff).sum()),
        "share_updated_after_cutoff": round(float((before["update_time"] >= cutoff).mean()), 4),
        "policy": "Trạng thái/thời gian xử lý của các đơn này được coi là CHƯA BIẾT tại cutoff",
    }
    return {
        "cutoff": cutoff,
        "horizon_end": horizon_end,
        "observation_start": orders["order_time"].min(),
        "agg_train": agg.loc[oot_train.index],
        "agg_test": agg.loc[oot_test.index],
        "y_train": oot_train["target"].astype(int),
        "y_test": oot_test["target"].astype(int),
        "label_agreement": label_agreement,
        "leakage_audit": leakage_audit,
    }


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
