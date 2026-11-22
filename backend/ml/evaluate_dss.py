"""
Đánh giá hiệu quả hệ DSS (công việc 6.2) và case study (công việc 6.3) trên TẬP KIỂM TRA OUT-OF-TIME.

Tập kiểm tra có kết quả thực tế (actual_churn: khách có mua lại trong cửa sổ kết quả hay không), nên có thể đo
trực tiếp: nhóm khách mà DSS cảnh báo / gợi ý có thực sự khác biệt so với phần còn lại không.

Đầu vào : saved_models/scored_customers.csv (sinh bởi train_pipeline.py)
Đầu ra  : saved_models/dss_evaluation.json — chỉ số liệu gộp + case study với ID đã che (không có customer_id gốc).
Chạy riêng: python -m backend.ml.evaluate_dss
"""

import json
import os
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from backend.app.core.config import SAVED_MODELS_DIR
from backend.app.core.customer_store import (
    ALERT_ORDER, OPPORTUNITY_MIN_REPURCHASE_PCT, OPPORTUNITY_SEGMENTS, is_opportunity, mask_customer_id,
)
from backend.app.core.dss_engine import RULES, evaluate_customer_dss

SCORED_PATH = os.path.join(SAVED_MODELS_DIR, "scored_customers.csv")
OUTPUT_PATH = os.path.join(SAVED_MODELS_DIR, "dss_evaluation.json")


def _r(x: float, d: int = 4) -> float:
    return round(float(x), d)


def _group(df: pd.DataFrame, base_repurchase: float) -> Dict[str, Any]:
    n = len(df)
    rep = float(1 - df["actual_churn"].mean()) if n else float("nan")
    return {
        "customers": int(n),
        "actual_churn_rate": _r(df["actual_churn"].mean()) if n else None,
        "actual_repurchase_rate": _r(rep) if n else None,
        "repurchased_customers": int((df["actual_churn"] == 0).sum()),
        "repurchase_lift": _r(rep / base_repurchase, 2) if n and base_repurchase > 0 else None,
        "mean_predicted_churn": _r(df["churn_prob"].mean()) if n else None,
    }


def cumulative_gains(score: np.ndarray, positive: np.ndarray, points: int = 20) -> List[Dict[str, float]]:
    """Xếp khách theo score giảm dần; tại mỗi % đầu danh sách: tỷ lệ số dương tính bắt được."""
    order = np.argsort(-score, kind="stable")
    pos_sorted = positive[order]
    total_pos = max(pos_sorted.sum(), 1)
    out = []
    for i in range(1, points + 1):
        k = int(round(len(score) * i / points))
        captured = pos_sorted[:k].sum()
        out.append({
            "population_share": _r(i / points, 3),
            "captured_share": _r(captured / total_pos),
            "precision": _r(captured / max(k, 1)),
        })
    return out


def evaluate(scored: pd.DataFrame) -> Dict[str, Any]:
    df = scored.copy()
    dss = [evaluate_customer_dss({"rfm_segment": s, "churn_risk": float(p)}) for s, p in zip(df["rfm_segment"], df["churn_prob"])]
    df["alert_level"] = [d["alert_level"] for d in dss]
    df["matched_rules"] = [d["matched_rules"] for d in dss]
    df["recommendation"] = [d["recommendations"][0] for d in dss]
    df["repurchase_prob"] = 1 - df["churn_prob"]
    df["repurchased"] = (df["actual_churn"] == 0).astype(int)
    df["is_opportunity"] = [is_opportunity(s, float(p)) for s, p in zip(df["rfm_segment"], df["churn_prob"])]
    df["is_risk_alert"] = df["alert_level"].isin(["CRITICAL", "HIGH"])

    base_rep = float(df["repurchased"].mean())
    by_alert = {lvl: _group(df[df["alert_level"] == lvl], base_rep) for lvl in sorted(ALERT_ORDER, key=lambda x: -ALERT_ORDER[x])}
    by_segment = {seg: _group(g, base_rep) for seg, g in df.groupby("rfm_segment")}

    rule_coverage = []
    for rule in RULES:
        g = df[df["matched_rules"].apply(lambda m: rule.rule_id in m)]
        rule_coverage.append({"rule_id": rule.rule_id, "level": rule.level, **_group(g, base_rep)})

    # Mô hình xếp hạng: top-k theo xác suất mua lại bắt được bao nhiêu khách thực sự mua lại
    gains = cumulative_gains(df["repurchase_prob"].to_numpy(), df["repurchased"].to_numpy())
    top = {f"top_{int(p * 100)}pct": next(g for g in gains if abs(g["population_share"] - p) < 1e-9) for p in (0.05, 0.10, 0.20)}

    return {
        "data": {
            "source": "Tập kiểm tra out-of-time (scored_customers.csv), nhãn = hành vi thực tế trong cửa sổ kết quả",
            "customers": int(len(df)),
            "base_actual_churn_rate": _r(df["actual_churn"].mean()),
            "base_actual_repurchase_rate": _r(base_rep),
        },
        "risk_alerts": {
            "definition": "Mức cảnh báo DSS CRITICAL hoặc HIGH",
            "alerted": _group(df[df["is_risk_alert"]], base_rep),
            "not_alerted": _group(df[~df["is_risk_alert"]], base_rep),
        },
        "opportunity_alerts": {
            "definition": f"Phân khúc {' / '.join(OPPORTUNITY_SEGMENTS)} và xác suất mua lại >= {OPPORTUNITY_MIN_REPURCHASE_PCT:.0f}%",
            "alerted": _group(df[df["is_opportunity"]], base_rep),
            "not_alerted": _group(df[~df["is_opportunity"]], base_rep),
        },
        "by_alert_level": by_alert,
        "by_segment": by_segment,
        "rule_coverage": rule_coverage,
        "repurchase_ranking": {"cumulative_gains": gains, **top},
        "case_studies": case_studies(df),
    }


def case_studies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Một vài khách tiêu biểu (ID đã che) minh họa luồng dữ liệu -> dự đoán -> luật DSS -> khuyến nghị."""
    picks = []
    crit = df[df["alert_level"] == "CRITICAL"].sort_values("churn_prob", ascending=False)
    opp = df[df["is_opportunity"]].sort_values("repurchase_prob", ascending=False)
    risk_seg = df[(df["rfm_segment"] == "Rủi ro") & (df["alert_level"].isin(["HIGH", "MEDIUM"]))].sort_values("churn_prob", ascending=False)
    for title, sub in (("VIP có nguy cơ rời bỏ cao", crit), ("Khách tiềm năng có xu hướng mua lại", opp),
                       ("Khách chưa có đơn thành công (phân khúc Rủi ro)", risk_seg)):
        if len(sub):
            r = sub.iloc[0]
            picks.append({
                "title": title,
                "display_id": mask_customer_id(str(r["customer_id"])),
                "segment": r["rfm_segment"],
                "recency_days": _r(r["recency"], 1),
                "completed_orders": int(r["frequency"]),
                "total_orders": int(r["total_orders"]) if "total_orders" in r else None,
                "monetary": float(r["monetary"]),
                "channel": r["fav_channel"],
                "region": r["region"],
                "churn_prob_pct": _r(r["churn_prob"] * 100, 2),
                "repurchase_prob_pct": _r(r["repurchase_prob"] * 100, 2),
                "alert_level": r["alert_level"],
                "matched_rules": list(r["matched_rules"]),
                "recommendation": r["recommendation"],
                "actual_outcome": "Đã mua lại trong cửa sổ kết quả" if r["actual_churn"] == 0 else "Không mua lại (churn)",
            })
    return picks


def run(path: str = SCORED_PATH, out: str = OUTPUT_PATH) -> Dict[str, Any]:
    res = evaluate(pd.read_csv(path, dtype={"customer_id": str}))
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    return res


if __name__ == "__main__":
    r = run()
    d = r["data"]
    print(f"Tập kiểm tra: {d['customers']:,} khách, mua lại thực tế {d['base_actual_repurchase_rate']:.1%}")
    for k in ("risk_alerts", "opportunity_alerts"):
        a, b = r[k]["alerted"], r[k]["not_alerted"]
        print(f"{k:20s} được cảnh báo: n={a['customers']:,} mua lại {a['actual_repurchase_rate']:.1%} (lift {a['repurchase_lift']}) | "
              f"còn lại: n={b['customers']:,} mua lại {b['actual_repurchase_rate']:.1%}")
    for lvl, g in r["by_alert_level"].items():
        print(f"  {lvl:8s} n={g['customers']:5,}  churn thực tế {g['actual_churn_rate'] if g['actual_churn_rate'] is not None else '—'}")
    print("Top 10% theo xác suất mua lại:", r["repurchase_ranking"]["top_10pct"])
    print(f"💾 {OUTPUT_PATH}")
