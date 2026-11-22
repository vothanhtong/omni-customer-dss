from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

ChannelType = Literal["Facebook Fanpage", "Shopee", "TikTok Shop", "Unknown/Other", "Website"]
RegionType = Literal["Miền Bắc", "Miền Nam", "Miền Trung", "Chưa xác định"]


class ChurnPredictionRequest(BaseModel):
    """
    Số liệu hành vi của khách tính ĐẾN THỜI ĐIỂM HIỆN TẠI (khớp định nghĩa point-in-time lúc huấn luyện,
    xem backend/ml/feature_engineering.py). Trạng thái đơn chỉ tính những đơn đã chốt; đơn còn lại = đang xử lý.
    """
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "recency_days": 20,
            "tenure_days": 15,
            "total_orders": 2,
            "orders_last_30d": 2,
            "orders_last_7d": 0,
            "completed_orders": 1,
            "returned_orders": 1,
            "cancelled_orders": 0,
            "monetary": 350000,
            "ad_orders": 1,
            "cod_orders": 2,
            "orders_by_channel": {"Facebook Fanpage": 2},
            "region": "Miền Nam",
        }
    })

    recency_days: float = Field(..., ge=0, description="Số ngày kể từ đơn hàng gần nhất")
    tenure_days: float = Field(0, ge=0, description="Số ngày giữa đơn đầu tiên và đơn gần nhất")
    total_orders: int = Field(..., ge=1, description="Tổng số đơn hàng")
    orders_last_7d: Optional[int] = Field(None, ge=0, description="Số đơn trong 7 ngày gần nhất (bỏ trống = tự suy ra)")
    orders_last_30d: Optional[int] = Field(None, ge=0, description="Số đơn trong 30 ngày gần nhất (bỏ trống = tự suy ra)")
    completed_orders: int = Field(..., ge=0, description="Số đơn đã giao thành công")
    returned_orders: int = Field(0, ge=0, description="Số đơn bị hoàn trả")
    cancelled_orders: int = Field(0, ge=0, description="Số đơn bị hủy")
    monetary: float = Field(..., ge=0, description="Tổng giá trị các đơn thành công (VNĐ)")
    ad_orders: int = Field(0, ge=0, description="Số đơn đến từ quảng cáo")
    cod_orders: Optional[int] = Field(None, ge=0, description="Số đơn thanh toán COD (bỏ trống = tất cả)")
    num_categories: int = Field(1, ge=1, description="Số ngành hàng đã mua")
    num_sources: int = Field(1, ge=1, description="Số fanpage/cửa hàng đã mua")
    processing_hours_mean: Optional[float] = Field(None, ge=0, description="Thời gian xử lý TB của các đơn đã chốt (giờ)")
    orders_by_channel: Optional[Dict[ChannelType, int]] = Field(None, description="Số đơn theo từng kênh; tổng phải = total_orders")
    primary_channel: ChannelType = Field("Facebook Fanpage", description="Dùng khi không gửi orders_by_channel")
    region: RegionType = Field("Miền Nam", description="Vùng miền giao hàng")

    @model_validator(mode="after")
    def _check_counts(self):
        t = self.total_orders
        if self.completed_orders + self.returned_orders + self.cancelled_orders > t:
            raise ValueError("completed_orders + returned_orders + cancelled_orders không được vượt quá total_orders")
        for name in ("ad_orders", "cod_orders", "orders_last_7d", "orders_last_30d"):
            v = getattr(self, name)
            if v is not None and v > t:
                raise ValueError(f"{name} không được vượt quá total_orders")
        if self.orders_last_7d is not None and self.orders_last_30d is not None and self.orders_last_7d > self.orders_last_30d:
            raise ValueError("orders_last_7d không được vượt quá orders_last_30d")
        if self.recency_days > 7 and self.orders_last_7d:
            raise ValueError("recency_days > 7 nên orders_last_7d phải bằng 0")
        if self.recency_days > 30 and self.orders_last_30d:
            raise ValueError("recency_days > 30 nên orders_last_30d phải bằng 0")
        if self.orders_by_channel is not None:
            if any(v < 0 for v in self.orders_by_channel.values()):
                raise ValueError("orders_by_channel không được có giá trị âm")
            if sum(self.orders_by_channel.values()) != t:
                raise ValueError("Tổng orders_by_channel phải bằng total_orders")
        if t == 1 and self.tenure_days > 0:
            raise ValueError("Khách chỉ có 1 đơn thì tenure_days phải bằng 0")
        return self


class ChurnFactor(BaseModel):
    feature: str
    label: str
    value: float
    shap_value: float
    effect: str


class ChurnPredictionResponse(BaseModel):
    churn_probability: float
    churn_probability_pct: float
    churn_prediction: int
    risk_level: str
    model_name: str
    top_factors: List[ChurnFactor] = []


# ------------------------------------------------------------------ Dự đoán hàng loạt (CSV)
class BatchCustomerResult(BaseModel):
    display_id: str                      # customer_id đã che, không trả ID gốc
    recency_days: float
    total_orders: int
    completed_orders: int
    monetary: float
    primary_channel: str
    region: str
    churn_probability_pct: float
    risk_level: str
    rfm_segment: str
    alert_level: str
    recommendation: str
    top_factors: List[ChurnFactor] = []


class BatchSummary(BaseModel):
    n_rows: int
    n_valid_rows: int
    n_dropped_rows: int
    n_orders: int
    n_customers: int
    first_order_at: str
    as_of: str
    mean_churn_probability_pct: float
    risk_distribution: Dict[str, int]
    alert_distribution: Dict[str, int]
    segment_distribution: Dict[str, int]
    warnings: List[str]


class BatchPredictionResponse(BaseModel):
    model_name: str
    summary: BatchSummary
    items: List[BatchCustomerResult]   # khách ưu tiên cao nhất trước, tối đa max_items
    items_truncated: bool
