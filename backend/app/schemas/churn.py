from pydantic import BaseModel, Field

class ChurnPredictionRequest(BaseModel):
    recency: int = Field(..., ge=0, description="Số ngày kể từ lần mua gần nhất")
    frequency: int = Field(..., ge=1, description="Số lần mua hàng")
    monetary: float = Field(..., ge=0.0, description="Tổng chi tiêu")
    support_tickets: int = Field(0, ge=0, description="Số lượng phản ánh/yêu cầu CSKH")
    app_logins_last_month: int = Field(0, ge=0, description="Số lần đăng nhập ứng dụng trong tháng")
    days_since_last_support: int = Field(30, ge=0, description="Số ngày kể từ lần liên hệ CSKH gần nhất")

    class Config:
        json_schema_extra = {
            "example": {
                "recency": 45,
                "frequency": 3,
                "monetary": 1200.0,
                "support_tickets": 4,
                "app_logins_last_month": 2,
                "days_since_last_support": 10
            }
        }

class ChurnPredictionResponse(BaseModel):
    churn_probability: float
    churn_probability_pct: float
    churn_prediction: int
    risk_level: str
