from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class DSSRequest(BaseModel):
    customer_id: Optional[str] = Field("N/A", description="Mã định danh khách hàng")
    rfm_segment: str = Field(..., description="Phân khúc RFM ('VIP', 'Tiềm năng', 'Cần chăm sóc', 'Rủi ro')")
    churn_risk: float = Field(..., ge=0, le=100, description="Xác suất churn (0.0 - 1.0) hoặc phần trăm (> 1 - 100)")
    recency: Optional[float] = None
    frequency: Optional[int] = None
    monetary: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "customer_id": "CUST_1001",
                "rfm_segment": "VIP",
                "churn_risk": 0.75,
                "recency": 60,
                "frequency": 20,
                "monetary": 25000.0
            }
        }

class DSSResponse(BaseModel):
    customer_id: str
    rfm_segment: str
    churn_risk_pct: float
    alert_level: str
    warnings: List[str]
    recommendations: List[str]
    matched_rules: List[str] = []
