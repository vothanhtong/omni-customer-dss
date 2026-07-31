from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.rfm import CustomerSegmentRequest, CustomerSegmentResponse
from backend.app.core.ml_models import ml_manager
from backend.app.core.database import db_manager

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
            **response_data.dict(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi dự đoán phân cụm RFM: {str(e)}"
        )
