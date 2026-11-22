# pyrefly: ignore [missing-import]
from fastapi import APIRouter

try:
    from backend.app.api.deps import artifact_or_503
except ImportError:
    from app.api.deps import artifact_or_503

router = APIRouter(prefix="/api", tags=["Model Metrics"])


@router.get("/metrics")
def get_model_metrics():
    """
    Chỉ số đánh giá thực tế của mô hình (sinh bởi backend/train_pipeline.py, lưu ở saved_models/model_metrics.json).
    """
    return artifact_or_503("model_metrics.json")
