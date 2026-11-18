# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.core.ml_models import load_metrics
except ImportError:
    from app.core.ml_models import load_metrics

router = APIRouter(prefix="/api", tags=["Model Metrics"])


@router.get("/metrics")
def get_model_metrics():
    """
    Chỉ số đánh giá thực tế của mô hình (sinh bởi backend/train_pipeline.py, lưu ở saved_models/model_metrics.json).
    """
    metrics = load_metrics()
    if metrics is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa có model_metrics.json. Hãy chạy: python backend/train_pipeline.py",
        )
    return metrics
