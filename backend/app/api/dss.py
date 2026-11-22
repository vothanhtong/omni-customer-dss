from datetime import datetime, timezone
from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.dss import DSSRequest, DSSResponse
    from backend.app.schemas import dump_model
    from backend.app.core.dss_engine import describe_rules, evaluate_customer_dss, evaluate_batch_dss
    from backend.app.core.database import db_manager
    from backend.app.api.deps import artifact_or_503
except ImportError:
    from app.schemas.dss import DSSRequest, DSSResponse
    from app.schemas import dump_model
    from app.core.dss_engine import describe_rules, evaluate_customer_dss, evaluate_batch_dss
    from app.core.database import db_manager
    from app.api.deps import artifact_or_503

router = APIRouter(prefix="/api/dss", tags=["DSS Engine"])


@router.get("/evaluation")
def dss_evaluation():
    """
    Đánh giá hiệu quả DSS trên tập kiểm tra out-of-time (sinh bởi train_pipeline.py -> dss_evaluation.json):
    tỷ lệ rời bỏ/mua lại thực tế theo mức cảnh báo, lift của cảnh báo khách tiềm năng, độ phủ luật, cumulative gains.
    Chỉ số liệu gộp và case study với ID đã che.
    """
    return artifact_or_503("dss_evaluation.json")


@router.get("/rules")
def list_rules():
    """Bảng luật DSS (mức cảnh báo, phân khúc, khoảng xác suất churn, cảnh báo, khuyến nghị) — theo thứ tự ưu tiên khai báo."""
    return describe_rules()


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
        
        # Lưu toàn bộ batch vào MongoDB bằng một lệnh insert_many
        ts = datetime.now(timezone.utc).isoformat()
        await db_manager.save_dss_logs([
            {**inp, **dump_model(r), "timestamp": ts}
            for inp, r in zip(customers_list, response_data)
        ])
            
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
