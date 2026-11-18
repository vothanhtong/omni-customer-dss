from pydantic import BaseModel, Field

class CustomerSegmentRequest(BaseModel):
    recency: float = Field(..., ge=0, description="Số ngày kể từ lần mua hàng gần nhất")
    frequency: int = Field(..., ge=1, description="Tổng số đơn hàng")
    monetary: float = Field(..., ge=0.0, description="Tổng giá trị đơn thành công (VNĐ)")

    class Config:
        json_schema_extra = {
            "example": {
                "recency": 10,
                "frequency": 2,
                "monetary": 600000.0
            }
        }

class CustomerSegmentResponse(BaseModel):
    cluster_id: int
    segment_name: str
    recency: float
    frequency: int
    monetary: float
