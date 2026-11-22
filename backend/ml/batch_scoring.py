"""
Chấm điểm churn HÀNG LOẠT từ file đơn hàng CSV (cùng định dạng Cleaned_data/orders_cleaned.csv).

Dùng ĐÚNG pipeline lúc huấn luyện:
  CSV -> chuẩn hóa cột -> prepare_orders -> build_customer_aggregates(cutoff=as_of)  (point-in-time)
      -> build_model_features -> mô hình churn + SHAP + K-Means RFM  (xem MLModelManager.score_aggregates)

Module này chỉ làm phần đọc & kiểm tra dữ liệu; không chứa logic mô hình.
"""

import io
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from backend.ml.feature_engineering import (
    ALL_REGIONS, CANCELLED, CHANNELS, COMPLETED, RETURNED,
    build_customer_aggregates, prepare_orders,
)

REQUIRED_COLUMNS: List[str] = [
    "customer_id", "order_id", "inserted_at", "updated_at", "status_group", "total_price_cleaned",
]
# Cột tùy chọn -> giá trị mặc định khi thiếu (ghi lại trong cảnh báo)
OPTIONAL_DEFAULTS: Dict[str, Any] = {
    "channel_group": "Unknown/Other",
    "region_type": "Chưa xác định",
    "cod_cleaned": None,        # None -> bằng total_price_cleaned (coi là COD)
    "is_from_ad": 0,
    "categories_name": "Khác",
    "source": "Khác",
}
KNOWN_STATUSES = {COMPLETED, RETURNED, CANCELLED, "In_Progress"}

MAX_ROWS = 300_000


class BatchInputError(ValueError):
    """Lỗi dữ liệu đầu vào (trả về HTTP 422 với thông báo thân thiện)."""


def read_orders_csv(raw: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(raw), encoding="utf-8-sig", low_memory=False, dtype={"customer_id": str, "order_id": str})
    except UnicodeDecodeError:
        raise BatchInputError("File phải được mã hóa UTF-8.")
    except (pd.errors.ParserError, pd.errors.EmptyDataError) as e:
        raise BatchInputError(f"Không đọc được file CSV: {e}")
    if len(df) > MAX_ROWS:
        raise BatchInputError(f"File có {len(df):,} dòng, vượt giới hạn {MAX_ROWS:,} dòng.")
    return df


def normalize_orders(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Kiểm tra cột, ép kiểu, loại dòng hỏng. Trả (orders đã prepare_orders, báo cáo)."""
    df = df.rename(columns=lambda c: str(c).strip())
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise BatchInputError(f"Thiếu cột bắt buộc: {', '.join(missing)}. Cột cần có: {', '.join(REQUIRED_COLUMNS)}.")

    warnings: List[str] = []
    o = df.copy()
    n_rows = len(o)

    for col, default in OPTIONAL_DEFAULTS.items():
        if col not in o.columns:
            o[col] = o["total_price_cleaned"] if col == "cod_cleaned" else default
            warnings.append(f"Thiếu cột '{col}', dùng giá trị mặc định.")

    o["customer_id"] = o["customer_id"].astype(str).str.strip().replace({"": None, "nan": None})
    o["total_price_cleaned"] = pd.to_numeric(o["total_price_cleaned"], errors="coerce").fillna(0).clip(lower=0)
    o["cod_cleaned"] = pd.to_numeric(o["cod_cleaned"], errors="coerce").fillna(0)
    o["is_from_ad"] = pd.to_numeric(o["is_from_ad"], errors="coerce").fillna(0).clip(0, 1).astype(int)

    inserted = pd.to_datetime(o["inserted_at"], errors="coerce")
    bad = inserted.isna() | o["customer_id"].isna() | o["order_id"].isna()
    if bad.any():
        warnings.append(f"Bỏ {int(bad.sum()):,} dòng thiếu customer_id/order_id hoặc inserted_at không hợp lệ.")
    o = o[~bad].copy()
    if o.empty:
        raise BatchInputError("Không còn dòng hợp lệ nào sau khi kiểm tra dữ liệu.")

    unknown_status = ~o["status_group"].isin(KNOWN_STATUSES)
    if unknown_status.any():
        warnings.append(f"{int(unknown_status.sum()):,} dòng có status_group lạ -> coi là đang xử lý.")
        o.loc[unknown_status, "status_group"] = "In_Progress"

    unknown_ch = o["channel_group"].notna() & ~o["channel_group"].isin(CHANNELS)
    if unknown_ch.any():
        warnings.append(f"{int(unknown_ch.sum()):,} dòng có kênh lạ -> gộp vào 'Unknown/Other'.")
        o.loc[unknown_ch, "channel_group"] = "Unknown/Other"
    unknown_rg = o["region_type"].notna() & ~o["region_type"].isin(ALL_REGIONS)
    if unknown_rg.any():
        warnings.append(f"{int(unknown_rg.sum()):,} dòng có vùng miền lạ -> 'Chưa xác định'.")
        o.loc[unknown_rg, "region_type"] = "Chưa xác định"

    o = prepare_orders(o)
    return o, {"n_rows": n_rows, "n_valid_rows": len(o), "n_dropped_rows": n_rows - len(o), "warnings": warnings}


def aggregates_from_csv(raw: bytes, as_of: Optional[pd.Timestamp] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """CSV -> số liệu thô theo khách tại mốc as_of (mặc định: ngay sau đơn cuối cùng trong file)."""
    orders, report = normalize_orders(read_orders_csv(raw))
    last = orders["order_time"].max()
    cutoff = pd.Timestamp(as_of) if as_of is not None else last + pd.Timedelta(seconds=1)
    if cutoff.tzinfo is not None:
        cutoff = cutoff.tz_convert(None)

    after = int((orders["order_time"] >= cutoff).sum())
    if after:
        report["warnings"].append(f"Bỏ qua {after:,} dòng có đơn đặt sau mốc as_of (không dùng dữ liệu tương lai).")
    agg = build_customer_aggregates(orders, cutoff)
    if agg.empty:
        raise BatchInputError("Không có khách hàng nào có đơn trước mốc as_of.")

    report.update({
        "as_of": cutoff.isoformat(sep=" ", timespec="seconds"),
        "first_order_at": orders["order_time"].min().isoformat(sep=" ", timespec="seconds"),
        "n_orders": int(orders.loc[orders["order_time"] < cutoff, "order_id"].nunique()),
        "n_customers": int(len(agg)),
    })
    return agg, report
