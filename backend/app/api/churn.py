from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.churn import ChurnPredictionRequest, ChurnPredictionResponse
    from backend.app.schemas import dump_model
    from backend.app.core.ml_models import ml_manager, ModelNotReadyError
    from backend.app.core.database import db_manager
except ImportError:
    from app.schemas.churn import ChurnPredictionRequest, ChurnPredictionResponse
    from app.schemas import dump_model
    from app.core.ml_models import ml_manager, ModelNotReadyError
    from app.core.database import db_manager

router = APIRouter(prefix="/api/churn", tags=["Churn Prediction"])

@router.post("/predict", response_model=ChurnPredictionResponse)
async def predict_churn(payload: ChurnPredictionRequest):
    """
    Dự đoán xác suất Churn bằng mô hình tốt nhất từ train_pipeline.py (xem /api/metrics) và lưu vào MongoDB.
    """
    try:
        res = ml_manager.predict_churn_risk(dump_model(payload))
        response_data = ChurnPredictionResponse(**res)

        # Async save to MongoDB
        await db_manager.save_churn_prediction({
            **dump_model(payload),
            **dump_model(response_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except ModelNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi dự đoán Churn: {str(e)}"
        )
