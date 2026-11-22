import json
import os
from typing import Any, Dict

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.deps import get_current_user
from backend.app.core.config import SAVED_MODELS_DIR

router = APIRouter(prefix="/api/analytics", tags=["BI Analytics"])
ANALYTICS_PATH = os.path.join(SAVED_MODELS_DIR, "analytics_summary.json")


@router.get("/overview")
def analytics_overview(_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Số liệu BI tổng hợp từ dữ liệu thật (sinh bởi backend/train_pipeline.py):
    phân bổ theo kênh & vùng miền, đơn hàng theo tháng, churn theo kênh/vùng, xu hướng churn theo tuần,
    phân bố rủi ro dự đoán và SHAP feature importance. Chỉ chứa số liệu gộp, không có thông tin cá nhân.
    """
    if not os.path.exists(ANALYTICS_PATH):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa có analytics_summary.json. Hãy chạy: python backend/train_pipeline.py",
        )
    with open(ANALYTICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
