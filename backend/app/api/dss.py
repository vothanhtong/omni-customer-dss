from datetime import datetime, timezone
from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.dss import DSSRequest, DSSResponse
    from backend.app.schemas import dump_model
    from backend.app.core.dss_engine import evaluate_customer_dss, evaluate_batch_dss
    from backend.app.core.database import db_manager
except ImportError:
    from app.schemas.dss import DSSRequest, DSSResponse
    from app.schemas import dump_model
    from app.core.dss_engine import evaluate_customer_dss, evaluate_batch_dss
    from app.core.database import db_manager

router = APIRouter(prefix="/api/dss", tags=["DSS Engine"])

@router.post("/evaluate", response_model=DSSResponse)
async def evaluate_dss(payload: DSSRequest):
    """
    Đánh giá quy tắc Hỗ trợ ra Quyết định (DSS) cho 1 khách hàng và lưu vào MongoDB.
    """
    try:
        res = evaluate_customer_dss(dump_model(payload))
        response_data = DSSResponse(**res)
        
        # Async save to MongoDB
        await db_manager.save_dss_log({
            **dump_model(payload),
            **dump_model(response_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi đánh giá DSS: {str(e)}"
        )

@router.post("/evaluate-batch", response_model=List[DSSResponse])
async def evaluate_dss_batch(payload: List[DSSRequest]):
    """
    Đánh giá DSS cho danh sách nhiều khách hàng cùng lúc và lưu nhật ký vào MongoDB.
    """
    try:
        customers_list = [dump_model(p) for p in payload]
        res_list = evaluate_batch_dss(customers_list)
        response_data = [DSSResponse(**item) for item in res_list]
        
        # Async save batch to MongoDB
        for p, r in zip(payload, response_data):
            await db_manager.save_dss_log({
                **dump_model(p),
                **dump_model(r),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi đánh giá DSS Batch: {str(e)}"
        )

@router.get("/logs", response_model=List[DSSResponse])
async def get_dss_logs(limit: int = 50):
    """
    Lấy danh sách nhật ký DSS gần nhất lưu trong MongoDB.
    """
    try:
        logs = await db_manager.get_recent_dss_logs(limit=limit)
        return [DSSResponse(**log) for log in logs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi truy vấn nhật ký DSS từ MongoDB: {str(e)}"
        )
