"""
Tổng hợp số liệu BI cho Dashboard (chỉ số liệu gộp — KHÔNG chứa customer_id hay thông tin cá nhân).
Kết quả lưu vào saved_models/analytics_summary.json và phục vụ qua GET /api/analytics/overview.

Lưu ý: phần mô tả (phân bổ kênh/vùng, doanh thu) dùng trạng thái đơn cuối cùng trong dữ liệu —
đây là thống kê mô tả, không dùng để huấn luyện nên không ảnh hưởng tới rò rỉ nhãn.
"""

from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from backend.ml.feature_engineering import ALL_REGIONS, CHANNELS, build_labels

MIN_GROUP = 10  # nhóm nhỏ hơn ngưỡng này không tính tỷ lệ (tránh suy diễn từ mẫu quá nhỏ)


def _rate(num: float, den: float) -> Optional[float]:
    return None if den < MIN_GROUP else round(float(num) / float(den), 4)


def _distribution(orders: pd.DataFrame, by: str, categories: List[str]) -> List[Dict]:
    completed = orders["status_group"] == "Completed"
    g = orders.assign(revenue=orders["total_price_cleaned"].fillna(0) * completed).groupby(by)
    stats = pd.DataFrame({
        "orders": g["order_id"].nunique(),
        "customers": g["customer_id"].nunique(),
        "revenue_vnd": g["revenue"].sum(),
        "returned": g["status_group"].apply(lambda s: (s == "Returned").sum()),
        "cancelled": g["status_group"].apply(lambda s: (s == "Cancelled").sum()),
    }).reindex(categories).fillna(0)
    total_orders = stats["orders"].sum() or 1
    out = []
    for name, row in stats.iterrows():
        out.append({
            "name": name,
            "orders": int(row["orders"]),
            "customers": int(row["customers"]),
            "order_share": round(float(row["orders"] / total_orders), 4),
            "revenue_vnd": float(row["revenue_vnd"]),
            "return_rate": _rate(row["returned"], row["orders"]),
            "cancel_rate": _rate(row["cancelled"], row["orders"]),
        })
    return out


def _monthly_orders_by_channel(orders: pd.DataFrame) -> List[Dict]:
    month = orders["order_time"].dt.to_period("M").astype(str)
    pivot = orders.assign(month=month).pivot_table(index="month", columns="channel_group", values="order_id", aggfunc="nunique", fill_value=0)
    pivot = pivot.reindex(columns=CHANNELS, fill_value=0)
    return [{"month": m, **{c: int(pivot.loc[m, c]) for c in CHANNELS}, "total": int(pivot.loc[m].sum())} for m in pivot.index]


def _churn_by_group(groups: pd.Series, labels: pd.Series, categories: List[str]) -> List[Dict]:
    df = pd.DataFrame({"group": groups, "churn": labels})
    out = []
    for c in categories:
        sub = df[df["group"] == c]
        out.append({"name": c, "customers": int(len(sub)), "churn_rate": _rate(sub["churn"].sum(), len(sub))})
    return out


def churn_trend(orders: pd.DataFrame, horizon_days: float, active_days: int = 30, step_days: int = 7) -> List[Dict]:
    """
    Xu hướng churn theo tuần (rolling cutoff): tại mỗi mốc T, xét khách có đơn trong [T - active_days, T);
    churn = không có đơn nào trong [T, T + horizon_days]. Cùng định nghĩa nhãn với bài toán chính.
    """
    start, end = orders["order_time"].min(), orders["order_time"].max()
    horizon = pd.Timedelta(days=horizon_days)
    T = (start + pd.Timedelta(days=active_days)).normalize()
    points = []
    while T + horizon <= end:
        active = orders[(orders["order_time"] >= T - pd.Timedelta(days=active_days)) & (orders["order_time"] < T)]["customer_id"].unique()
        if len(active):
            labels = build_labels(orders, T, T + horizon, active)
            points.append({
                "cutoff": T.strftime("%Y-%m-%d"),
                "active_customers": int(len(active)),
                "churn_rate": _rate(labels.sum(), len(labels)),  # None nếu < MIN_GROUP khách
            })
        T += pd.Timedelta(days=step_days)
    return points


def build_analytics_summary(
    orders: pd.DataFrame,
    split: dict,
    test_proba: Optional[np.ndarray] = None,
    feature_importance: Optional[List[Dict]] = None,
    model_name: Optional[str] = None,
) -> Dict:
    agg_all = pd.concat([split["agg_train"], split["agg_test"]])
    y_all = pd.concat([split["y_train"], split["y_test"]])
    primary = pd.Series(
        np.array(CHANNELS)[agg_all[[f"orders_ch__{c}" for c in CHANNELS]].to_numpy().argmax(axis=1)],
        index=agg_all.index,
    )
    horizon_days = (split["horizon_end"] - split["cutoff"]).total_seconds() / 86400

    summary = {
        "period": {"start": str(orders["order_time"].min()), "end": str(orders["order_time"].max())},
        "totals": {
            "orders": int(orders["order_id"].nunique()),
            "customers": int(orders["customer_id"].nunique()),
            "revenue_vnd": float((orders["total_price_cleaned"].fillna(0) * (orders["status_group"] == "Completed")).sum()),
            "omnichannel_customers": int((orders.groupby("customer_id")["channel_group"].nunique() > 1).sum()),
        },
        "channel_distribution": _distribution(orders, "channel_group", CHANNELS),
        "region_distribution": _distribution(orders, "region_type", ALL_REGIONS),
        "monthly_orders_by_channel": _monthly_orders_by_channel(orders),
        "churn": {
            "definition": f"Không phát sinh đơn mới trong {horizon_days:.1f} ngày sau mốc cutoff",
            "cutoff": str(split["cutoff"]),
            "population": int(len(y_all)),
            "overall_rate": round(float(y_all.mean()), 4),
            "by_channel": _churn_by_group(primary, y_all, CHANNELS),
            "by_region": _churn_by_group(agg_all["region"], y_all, ALL_REGIONS),
            "weekly_trend": churn_trend(orders, horizon_days),
        },
        "min_group_size_for_rates": MIN_GROUP,
    }
    if test_proba is not None:
        risk = pd.cut(test_proba, bins=[-np.inf, 0.4, 0.7, np.inf], right=False, labels=["Low", "Medium", "High"])
        hist, edges = np.histogram(test_proba, bins=10, range=(0, 1))
        summary["prediction"] = {
            "model": model_name,
            "test_customers": int(len(test_proba)),
            "risk_distribution": {k: int(v) for k, v in pd.Series(risk).value_counts().reindex(["High", "Medium", "Low"]).fillna(0).items()},
            "probability_histogram": [{"from": round(float(edges[i]), 1), "to": round(float(edges[i + 1]), 1), "count": int(hist[i])} for i in range(10)],
        }
    if feature_importance is not None:
        summary["feature_importance"] = feature_importance[:15]
    return summary
