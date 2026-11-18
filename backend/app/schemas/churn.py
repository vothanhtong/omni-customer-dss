from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

ChannelType = Literal["Facebook Fanpage", "Shopee", "TikTok Shop", "Unknown/Other", "Website"]
RegionType = Literal["Miền Bắc", "Miền Nam", "Miền Trung", "Chưa xác định"]


class ChurnPredictionRequest(BaseModel):
    """Đặc trưng hành vi của khách trong cửa sổ quan sát (khớp định nghĩa dữ liệu huấn luyện)."""
    recency_days: float = Field(..., ge=0, description="Số ngày kể từ đơn hàng gần nhất")
    total_orders: int = Field(..., ge=1, description="Tổng số đơn hàng")
    completed_orders: int = Field(..., ge=0, description="Số đơn giao thành công")
    monetary: float = Field(..., ge=0, description="Tổng giá trị các đơn thành công (VNĐ)")
    returned_orders: int = Field(0, ge=0, description="Số đơn bị hoàn trả")
    cancelled_orders: int = Field(0, ge=0, description="Số đơn bị hủy")
    ad_orders: int = Field(0, ge=0, description="Số đơn đến từ quảng cáo")
    processing_hours_mean: Optional[float] = Field(None, ge=0, description="Thời gian xử lý đơn trung bình (giờ); bỏ trống = trung vị tập train")
    num_channels: int = Field(1, ge=1, description="Số kênh bán hàng khách đã mua")
    tenure_days: float = Field(0, ge=0, description="Số ngày giữa đơn đầu tiên và đơn gần nhất")
    primary_channel: ChannelType = Field("Facebook Fanpage", description="Kênh mua chính")
    region: RegionType = Field("Miền Nam", description="Vùng miền giao hàng")

    @model_validator(mode="after")
    def _check_counts(self):
        if self.completed_orders + self.returned_orders + self.cancelled_orders > self.total_orders:
            raise ValueError("completed_orders + returned_orders + cancelled_orders không được vượt quá total_orders")
        if self.ad_orders > self.total_orders:
            raise ValueError("ad_orders không được vượt quá total_orders")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "recency_days": 20,
                "total_orders": 2,
                "completed_orders": 1,
                "monetary": 350000,
                "returned_orders": 1,
                "cancelled_orders": 0,
                "ad_orders": 1,
                "num_channels": 1,
                "tenure_days": 15,
                "primary_channel": "Facebook Fanpage",
                "region": "Miền Nam",
            }
        }


class ChurnPredictionResponse(BaseModel):
    churn_probability: float
    churn_probability_pct: float
    churn_prediction: int
    risk_level: str
    model_name: str
