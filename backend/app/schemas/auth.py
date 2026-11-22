from typing import Optional
from pydantic import BaseModel, Field

class UserRegisterRequest(BaseModel):
    fullName: str = Field(..., description="Họ và tên người dùng")
    email: str = Field(..., description="Địa chỉ email")
    password: str = Field(..., min_length=6, max_length=72, description="Mật khẩu tài khoản (6–72 ký tự)")
    role: str = Field("business_user", description="Vai trò: 'admin' hoặc 'business_user'")
    organization: Optional[str] = Field("Doanh Nghiệp Bán Lẻ", description="Đơn vị / Doanh nghiệp")
    avatarUrl: Optional[str] = Field(None, description="URL ảnh đại diện")
    phone: Optional[str] = Field(None, description="Số điện thoại liên hệ")
    address: Optional[str] = Field(None, description="Địa chỉ trụ sở")
    taxCode: Optional[str] = Field(None, description="Mã số thuế")
    industry: Optional[str] = Field("Bán lẻ đa kênh (Omnichannel Retail)", description="Ngành hàng kinh doanh")
    storeCount: Optional[str] = Field("1 - 5 Cửa hàng / Chi nhánh", description="Quy mô chuỗi")
    website: Optional[str] = Field(None, description="Trang web doanh nghiệp")

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Địa chỉ email đăng nhập")
    password: str = Field(..., description="Mật khẩu đăng nhập")

class UserProfileUpdateRequest(BaseModel):
    userId: Optional[str] = Field(None, description="ID tài khoản")
    email: Optional[str] = Field(None, description="Email định danh (nếu gửi, phải trùng email trong token)")
    fullName: Optional[str] = Field(None, description="Họ và tên")
    organization: Optional[str] = Field(None, description="Tên doanh nghiệp / Đơn vị")
    avatarUrl: Optional[str] = Field(None, description="URL ảnh đại diện hoặc Base64")
    phone: Optional[str] = Field(None, description="Số điện thoại liên hệ")
    address: Optional[str] = Field(None, description="Địa chỉ trụ sở")
    taxCode: Optional[str] = Field(None, description="Mã số thuế / GPKD")
    industry: Optional[str] = Field(None, description="Ngành hàng kinh doanh")
    storeCount: Optional[str] = Field(None, description="Quy mô chuỗi cửa hàng")
    website: Optional[str] = Field(None, description="Website công ty")

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    organization: Optional[str] = None
    roleTitle: str
    createdAt: str
    avatarUrl: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    taxCode: Optional[str] = None
    industry: Optional[str] = None
    storeCount: Optional[str] = None
    website: Optional[str] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
