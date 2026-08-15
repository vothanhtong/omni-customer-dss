from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.churn import ChurnPredictionRequest, ChurnPredictionResponse
    from backend.app.schemas import dump_model
    from backend.app.core.ml_models import ml_manager
    from backend.app.core.database import db_manager
except ImportError:
    from app.schemas.churn import ChurnPredictionRequest, ChurnPredictionResponse
    from app.schemas import dump_model
    from app.core.ml_models import ml_manager
    from app.core.database import db_manager

router = APIRouter(prefix="/api/churn", tags=["Churn Prediction"])

@router.post("/predict", response_model=ChurnPredictionResponse)
async def predict_churn(payload: ChurnPredictionRequest):
    """
    Dự đoán xác suất Churn của khách hàng bằng mô hình XGBoost và lưu vào MongoDB.
    """
    try:
        res = ml_manager.predict_churn_risk(
            recency=payload.recency,
            frequency=payload.frequency,
            monetary=payload.monetary,
            support_tickets=payload.support_tickets,
            app_logins_last_month=payload.app_logins_last_month,
            days_since_last_support=payload.days_since_last_support
        )
        response_data = ChurnPredictionResponse(
            churn_probability=res["churn_probability"],
            churn_probability_pct=res["churn_probability_pct"],
            churn_prediction=res["churn_prediction"],
            risk_level=res["risk_level"]
        )
        
        # Async save to MongoDB
        await db_manager.save_churn_prediction({
            **dump_model(payload),
            **dump_model(response_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi dự đoán Churn: {str(e)}"
        )
