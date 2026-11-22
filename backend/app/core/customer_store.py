"""
Kho khách hàng đã chấm điểm (saved_models/scored_customers.csv, sinh bởi backend/train_pipeline.py)
phục vụ danh sách cảnh báo rủi ro cao.

Bảo vệ dữ liệu cá nhân: customer_id gốc chứa số điện thoại -> KHÔNG BAO GIỜ trả ra API.
  - `ref`        : mã tham chiếu mờ (HMAC-SHA256 của customer_id, khóa = JWT_SECRET) để gọi API hành động.
  - `display_id` : ID đã che (KH_0908***444) để hiển thị.
"""

import hashlib
import hmac
import os
import threading
from typing import Any, Dict, List, Optional

import pandas as pd

try:
    from backend.app.core.config import JWT_SECRET, SAVED_MODELS_DIR
    from backend.app.core.dss_engine import evaluate_customer_dss
except ImportError:
    from app.core.config import JWT_SECRET, SAVED_MODELS_DIR
    from app.core.dss_engine import evaluate_customer_dss

SCORED_PATH = os.path.join(SAVED_MODELS_DIR, "scored_customers.csv")
ALERT_ORDER = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 0}


class CustomersNotReadyError(RuntimeError):
    pass


def mask_customer_id(customer_id: str) -> str:
    """KH_0908774444 -> KH_0908***444. Chuỗi ngắn (<= 7 ký tự phần số) che gần hết."""
    prefix, sep, body = customer_id.rpartition("_")
    head = f"{prefix}{sep}"
    if len(body) <= 7:
        return head + body[:1] + "***" if body else customer_id
    return f"{head}{body[:4]}***{body[-3:]}"


def customer_ref(customer_id: str) -> str:
    key = ("omni-customer-ref:" + JWT_SECRET).encode("utf-8")
    return hmac.new(key, customer_id.encode("utf-8"), hashlib.sha256).hexdigest()[:16]


class CustomerStore:
    """Nạp CSV một lần (tự nạp lại khi file đổi), tính sẵn kết quả DSS cho từng khách."""

    def __init__(self, path: str = SCORED_PATH):
        self.path = path
        self._lock = threading.Lock()
        self._mtime: Optional[float] = None
        self._rows: List[Dict[str, Any]] = []
        self._by_ref: Dict[str, Dict[str, Any]] = {}

    def _load(self) -> None:
        if not os.path.exists(self.path):
            raise CustomersNotReadyError("Chưa có scored_customers.csv. Hãy chạy: python backend/train_pipeline.py")
        mtime = os.path.getmtime(self.path)
        if self._mtime == mtime:
            return
        with self._lock:
            if self._mtime == mtime:
                return
            df = pd.read_csv(self.path, dtype={"customer_id": str}, encoding="utf-8")
            rows: List[Dict[str, Any]] = []
            for r in df.itertuples(index=False):
                cid = str(r.customer_id)
                dss = evaluate_customer_dss({"customer_id": cid, "rfm_segment": r.rfm_segment, "churn_risk": float(r.churn_prob)})
                rows.append({
                    "ref": customer_ref(cid),
                    "display_id": mask_customer_id(cid),
                    "segment": dss["rfm_segment"],
                    "churn_prob_pct": round(float(r.churn_prob) * 100, 2),
                    "recency_days": float(r.recency),
                    "frequency": int(r.frequency),
                    "monetary": float(r.monetary),
                    "channel": str(r.fav_channel),
                    "region": str(r.region),
                    "alert_level": dss["alert_level"],
                    "warnings": dss["warnings"],
                    "recommendations": dss["recommendations"],
                    "matched_rules": dss["matched_rules"],
                })
            rows.sort(key=lambda x: (-ALERT_ORDER.get(x["alert_level"], 0), -x["churn_prob_pct"]))
            self._rows = rows
            self._by_ref = {x["ref"]: x for x in rows}
            self._mtime = mtime

    def all(self) -> List[Dict[str, Any]]:
        self._load()
        return self._rows

    def get(self, ref: str) -> Optional[Dict[str, Any]]:
        self._load()
        return self._by_ref.get(ref)

    def query(
        self,
        alert_levels: Optional[List[str]] = None,
        segment: Optional[str] = None,
        channel: Optional[str] = None,
        region: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        rows = self.all()
        sel = [
            r for r in rows
            if (not alert_levels or r["alert_level"] in alert_levels)
            and (not segment or r["segment"] == segment)
            and (not channel or r["channel"] == channel)
            and (not region or r["region"] == region)
        ]
        counts = {lvl: 0 for lvl in ALERT_ORDER}
        for r in rows:
            counts[r["alert_level"]] = counts.get(r["alert_level"], 0) + 1
        start = (page - 1) * page_size
        return {
            "total": len(sel),
            "page": page,
            "page_size": page_size,
            "items": [dict(r) for r in sel[start:start + page_size]],
            "alert_counts": counts,
            "population": len(rows),
            "facets": {
                "segments": sorted({r["segment"] for r in rows}),
                "channels": sorted({r["channel"] for r in rows}),
                "regions": sorted({r["region"] for r in rows}),
            },
        }


customer_store = CustomerStore()
