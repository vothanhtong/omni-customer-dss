"""
Danh sách cảnh báo khách hàng rủi ro cao (dữ liệu thật đã chấm điểm) & ghi nhận hành động chăm sóc.
Mọi endpoint bắt buộc đăng nhập; không trả customer_id gốc (xem core/customer_store.py).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

try:
    from backend.app.api.deps import get_current_user
    from backend.app.core.customer_store import (
        OPPORTUNITY_MIN_REPURCHASE_PCT, OPPORTUNITY_SEGMENTS, CustomersNotReadyError, customer_store,
    )
    from backend.app.core.database import db_manager
    from backend.app.core.ml_models import load_metrics
except ImportError:
    from app.api.deps import get_current_user
    from app.core.customer_store import (
        OPPORTUNITY_MIN_REPURCHASE_PCT, OPPORTUNITY_SEGMENTS, CustomersNotReadyError, customer_store,
    )
    from app.core.database import db_manager
    from app.core.ml_models import load_metrics

router = APIRouter(prefix="/api/customers", tags=["High-risk Customers"])

AlertLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]

# Bản sao trong bộ nhớ: giữ trạng thái khi MongoDB offline (mất khi khởi động lại server)
_memory_actions: Dict[str, Dict[str, Any]] = {}


class CustomerAction(BaseModel):
    action: str
    note: Optional[str] = None
    triggered_by: str
    triggered_at: str
    persisted: bool


class HighRiskCustomer(BaseModel):
    ref: str
    display_id: str
    segment: str
    churn_prob_pct: float
    repurchase_prob_pct: float
    recency_days: float
    frequency: int
    monetary: float
    channel: str
    region: str
    alert_level: str
    warnings: List[str]
    recommendations: List[str]
    matched_rules: List[str]
    last_action: Optional[CustomerAction] = None


class HighRiskPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[HighRiskCustomer]
    alert_counts: Dict[str, int]
    opportunity_count: int
    population: int
    facets: Dict[str, List[str]]
    data_note: str


class ActionRequest(BaseModel):
    action: str = Field(..., min_length=1, max_length=300, description="Một trong các khuyến nghị DSS của khách này")
    note: Optional[str] = Field(None, max_length=500)


def _data_note() -> str:
    m = load_metrics() or {}
    cutoff = (m.get("churn", {}).get("observation_window") or {}).get("cutoff")
    model = m.get("churn", {}).get("best_model", "mô hình tốt nhất")
    base = f"Khách thuộc tập kiểm tra out-of-time, chấm điểm bằng {model}"
    return f"{base}, hành vi tính đến mốc {str(cutoff)[:10]}." if cutoff else f"{base}."


@router.get("/high-risk", response_model=HighRiskPage)
async def list_high_risk(
    alert_level: List[AlertLevel] = Query(default=["CRITICAL", "HIGH"], description="Lọc mức cảnh báo DSS"),
    segment: Optional[str] = None,
    channel: Optional[str] = None,
    region: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _user: Dict[str, Any] = Depends(get_current_user),
):
    """Khách hàng đã chấm điểm, sắp theo mức cảnh báo DSS rồi xác suất churn giảm dần."""
    try:
        res = customer_store.risk(alert_level, segment=segment, channel=channel, region=region, page=page, page_size=page_size)
    except CustomersNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    return await _with_actions(res, _data_note())


@router.get("/opportunities", response_model=HighRiskPage)
async def list_opportunities(
    segment: Optional[str] = None,
    channel: Optional[str] = None,
    region: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Cảnh báo KHÁCH TIỀM NĂNG (công việc 4.4): phân khúc VIP/Tiềm năng có xác suất mua lại >= 60%,
    sắp theo xác suất mua lại giảm dần — cơ hội bán thêm / tri ân thay vì chống rời bỏ.
    """
    try:
        res = customer_store.opportunities(segment=segment, channel=channel, region=region, page=page, page_size=page_size)
    except CustomersNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    note = (f"{_data_note()} Tiêu chí: phân khúc {' / '.join(OPPORTUNITY_SEGMENTS)} "
            f"và xác suất mua lại >= {OPPORTUNITY_MIN_REPURCHASE_PCT:.0f}%.")
    return await _with_actions(res, note)


async def _with_actions(res: Dict[str, Any], note: str) -> Dict[str, Any]:
    refs = [it["ref"] for it in res["items"]]
    stored = await db_manager.get_customer_actions(refs)
    for it in res["items"]:
        act = stored.get(it["ref"]) or _memory_actions.get(it["ref"])
        it["last_action"] = {k: act[k] for k in CustomerAction.model_fields if k in act} if act else None
    return {**res, "data_note": note}


@router.post("/{ref}/actions", response_model=CustomerAction, status_code=status.HTTP_201_CREATED)
async def trigger_action(ref: str, payload: ActionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Ghi nhận việc kích hoạt một khuyến nghị DSS cho khách (lưu MongoDB 'customer_actions')."""
    try:
        customer = customer_store.get(ref)
    except CustomersNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy khách hàng.")
    if payload.action not in customer["recommendations"]:
        raise HTTPException(status_code=422,
                            detail="Hành động phải là một trong các khuyến nghị DSS của khách hàng này.")

    record = {
        "ref": ref,
        "alert_level": customer["alert_level"],
        "churn_prob_pct": customer["churn_prob_pct"],
        "action": payload.action,
        "note": payload.note,
        "triggered_by": user.get("email", "unknown"),
        "triggered_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    record["persisted"] = await db_manager.save_customer_action(record)
    _memory_actions[ref] = record
    return {k: record[k] for k in CustomerAction.model_fields}
