from pydantic import BaseModel, Field

class CustomerSegmentRequest(BaseModel):
    recency: int = Field(..., ge=0, description="Số ngày kể từ lần mua hàng gần nhất")
    frequency: int = Field(..., ge=1, description="Tổng số lần mua hàng")
    monetary: float = Field(..., ge=0.0, description="Tổng giá trị chi tiêu (VNĐ / k VNĐ)")

    class Config:
        json_schema_extra = {
            "example": {
                "recency": 15,
                "frequency": 25,
                "monetary": 15000.0
            }
        }

class CustomerSegmentResponse(BaseModel):
    cluster_id: int
    segment_name: str
    recency: int
    frequency: int
    monetary: float
