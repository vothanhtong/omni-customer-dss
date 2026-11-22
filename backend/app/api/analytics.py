from typing import Any, Dict

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends

from backend.app.api.deps import artifact_or_503, get_current_user
from backend.app.core.artifacts import artifact_path

router = APIRouter(prefix="/api/analytics", tags=["BI Analytics"])
ANALYTICS_FILE = "analytics_summary.json"
ANALYTICS_PATH = artifact_path(ANALYTICS_FILE)


@router.get("/overview")
def analytics_overview(_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Số liệu BI tổng hợp từ dữ liệu thật (sinh bởi backend/train_pipeline.py):
    phân bổ theo kênh & vùng miền, đơn hàng theo tháng, churn theo kênh/vùng, xu hướng churn theo tuần,
    phân bố rủi ro dự đoán và SHAP feature importance. Chỉ chứa số liệu gộp, không có thông tin cá nhân.
    """
    return artifact_or_503(ANALYTICS_FILE)
