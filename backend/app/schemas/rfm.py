from pydantic import BaseModel, Field, model_validator

class CustomerSegmentRequest(BaseModel):
    recency: float = Field(..., ge=0, description="Số ngày kể từ lần mua hàng gần nhất")
    frequency: int = Field(..., ge=0, description="Số đơn mua THÀNH CÔNG (không tính đơn hủy/hoàn/đang xử lý)")
    monetary: float = Field(..., ge=0.0, description="Tổng giá trị đơn thành công (VNĐ)")

    @model_validator(mode="after")
    def _check_consistency(self):
        if self.frequency == 0 and self.monetary > 0:
            raise ValueError("Có doanh thu (monetary > 0) thì phải có ít nhất 1 đơn thành công (frequency >= 1)")
        return self

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
