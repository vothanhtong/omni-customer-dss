from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.rfm import CustomerSegmentRequest, CustomerSegmentResponse
    from backend.app.schemas import dump_model
    from backend.app.core.ml_models import ml_manager, ModelNotReadyError
    from backend.app.core.database import db_manager
except ImportError:
    from app.schemas.rfm import CustomerSegmentRequest, CustomerSegmentResponse
    from app.schemas import dump_model
    from app.core.ml_models import ml_manager, ModelNotReadyError
    from app.core.database import db_manager

router = APIRouter(prefix="/api/rfm", tags=["RFM Segmentation"])

@router.post("/predict", response_model=CustomerSegmentResponse)
async def predict_segment(payload: CustomerSegmentRequest):
    """
    Phân cụm RFM khách hàng bằng thuật toán K-Means ML và lưu lịch sử vào MongoDB.
    """
    try:
        res = ml_manager.predict_rfm_segment(
            recency=payload.recency,
            frequency=payload.frequency,
            monetary=payload.monetary
        )
        response_data = CustomerSegmentResponse(
            cluster_id=res["cluster_id"],
            segment_name=res["segment_name"],
            recency=payload.recency,
            frequency=payload.frequency,
            monetary=payload.monetary
        )
        
        # Async save to MongoDB
        await db_manager.save_rfm_prediction({
            **dump_model(response_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except ModelNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi dự đoán phân cụm RFM: {str(e)}"
        )
