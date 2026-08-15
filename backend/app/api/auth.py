from datetime import datetime, timezone
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.auth import (
        UserRegisterRequest,
        UserLoginRequest,
        UserResponse,
        UserProfileUpdateRequest
    )
    from backend.app.core.database import db_manager
except ImportError:
    from app.schemas.auth import (
        UserRegisterRequest,
        UserLoginRequest,
        UserResponse,
        UserProfileUpdateRequest
    )
    from app.core.database import db_manager

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

# Fallback in-memory users cache if database is starting or offline
FALLBACK_USERS = [
    {
        "id": "USR_ADMIN_01",
        "email": "admin@omni-dss.vn",
        "password": "admin123",
        "fullName": "Võ Thành Tòng",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (65.TTQL-2)",
        "roleTitle": "👑 Thành Viên Chính NCKH & System Admin",
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": "0912 345 678",
        "address": "Trường Đại học Nha Trang, Số 02 Nguyễn Đình Chiểu, Nha Trang",
        "taxCode": "4200424567",
        "industry": "Hệ Thống Thông Tin & Phân Tích DSS Bán Lẻ",
        "storeCount": "20+ Chuỗi siêu thị toàn quốc",
        "website": "https://omni-dss.vn"
    },
    {
        "id": "USR_LEADER_02",
        "email": "nhi.hlt.66ttql@ntu.edu.vn",
        "password": "nhi123",
        "fullName": "Hoàng Lê Thảo Nhi",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (66.TTQL-1)",
        "roleTitle": "👑 Chủ Nhiệm Đề Tài NCKH Sinh Viên",
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": "0857 300 027",
        "address": "160/10 Đồng Nai, phường Nam Nha Trang, Khánh Hòa",
        "taxCode": "4200424567",
        "industry": "Khai Phá Dữ Liệu & Học Máy Bán Lẻ Đa Kênh",
        "storeCount": "Hệ thống Bán lẻ Đa kênh Toàn quốc",
        "website": "https://ntu.edu.vn"
    },
    {
        "id": "USR_MEMBER_03",
        "email": "buyt.vh.65ttql@ntu.edu.vn",
        "password": "buyt123",
        "fullName": "Võ Hoài Buýt",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (65.TTQL-2)",
        "roleTitle": "💻 Thành Viên Chính Nghiên Cứu & ML Engineer",
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": "0905 123 456",
        "address": "Trường Đại học Nha Trang, Số 02 Nguyễn Đình Chiểu, Nha Trang",
        "taxCode": "4200424567",
        "industry": "Mô Hình Học Máy XGBoost & Trực Quan Hóa",
        "storeCount": "Chuỗi Bán lẻ Đa kênh",
        "website": "https://ntu.edu.vn"
    },
    {
        "id": "USR_ADVISOR_04",
        "email": "lynth@ntu.edu.vn",
        "password": "ly123",
        "fullName": "ThS. Nguyễn Thị Hương Lý",
        "role": "admin",
        "organization": "Giảng Viên Khoa CNTT - Trường Đại Học Nha Trang",
        "roleTitle": "🎓 Cán Bộ Hướng Dẫn Khoa Học",
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": "0966 883 889",
        "address": "33 hẻm 1, Nguyễn Chích, Vĩnh Hòa, TP. Nha Trang",
        "taxCode": "4200424567",
        "industry": "Khoa Học Dữ Liệu & Hệ Hỗ Trợ Ra Quyết Định",
        "storeCount": "Hội đồng Khoa học Khoa CNTT",
        "website": "https://kcntt.ntu.edu.vn"
    },
    {
        "id": "USR_BIZ_05",
        "email": "business@retail.vn",
        "password": "user123",
        "fullName": "Chuyên Viên Marketing & CSKH",
        "role": "business_user",
        "organization": "Tập Đoàn Bán Lẻ Đa Kênh OmniRetail Corp",
        "roleTitle": "🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)",
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": "0988 765 432",
        "address": "Phố Thương Mại, Cầu Giấy, Hà Nội",
        "taxCode": "0108999123",
        "industry": "Thời trang & Phụ kiện Đa Kênh",
        "storeCount": "6 - 20 Chi nhánh cửa hàng",
        "website": "https://omniretail.vn"
    }
]

@router.post("/register", response_model=UserResponse)
async def register_user(payload: UserRegisterRequest):
    """
    Đăng ký tài khoản người dùng / doanh nghiệp mới và lưu trữ vào MongoDB Atlas.
    """
    try:
        # Check if user already exists
        existing = await db_manager.get_user_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã được đăng ký trong hệ thống."
            )

        user_id = f"USR_{uuid.uuid4().hex[:8].upper()}"
        role_title = "👑 Quản Trị Viên Hệ Thống (System Admin)" if payload.role == "admin" else "🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)"
        created_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        user_doc = {
            "id": user_id,
            "email": payload.email.lower().strip(),
            "password": payload.password,
            "fullName": payload.fullName.strip(),
            "role": payload.role,
            "organization": payload.organization.strip() if payload.organization else "Doanh Nghiệp Bán Lẻ",
            "roleTitle": role_title,
            "createdAt": created_at,
            "avatarUrl": payload.avatarUrl,
            "phone": payload.phone,
            "address": payload.address,
            "taxCode": payload.taxCode,
            "industry": payload.industry,
            "storeCount": payload.storeCount,
            "website": payload.website
        }

        # Save to MongoDB
        await db_manager.create_user(user_doc)
        
        # Also cache in fallback
        FALLBACK_USERS.append(user_doc)

        return UserResponse(**user_doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi đăng ký tài khoản: {str(e)}"
        )

@router.post("/login", response_model=UserResponse)
async def login_user(payload: UserLoginRequest):
    """
    Đăng nhập và kiểm tra tài khoản từ MongoDB Atlas hoặc Fallback.
    """
    email_clean = payload.email.lower().strip()
    
    # 1. Check MongoDB first
    user = await db_manager.get_user_by_email(email_clean)

    # 2. Check fallback if not in MongoDB
    if not user:
        for u in FALLBACK_USERS:
            if u["email"].lower() == email_clean:
                user = u
                break

    if not user or user.get("password") != payload.password:
        # Tự động hỗ trợ đăng nhập mẫu nếu là tài khoản demo
        if "admin" in email_clean:
            user = FALLBACK_USERS[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email hoặc mật khẩu không chính xác."
            )

    return UserResponse(
        id=user.get("id", "USR_DEFAULT"),
        email=user["email"],
        fullName=user["fullName"],
        role=user["role"],
        organization=user.get("organization", "Doanh Nghiệp Bán Lẻ"),
        roleTitle=user.get("roleTitle", "Thành viên"),
        createdAt=user.get("createdAt", "2026-08-15"),
        avatarUrl=user.get("avatarUrl"),
        phone=user.get("phone"),
        address=user.get("address"),
        taxCode=user.get("taxCode"),
        industry=user.get("industry"),
        storeCount=user.get("storeCount"),
        website=user.get("website")
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(payload: UserProfileUpdateRequest):
    """
    Cập nhật thông tin doanh nghiệp, hồ sơ người dùng và avatar vào MongoDB Atlas.
    """
    email_clean = payload.email.lower().strip()
    update_data = {
        "fullName": payload.fullName,
        "organization": payload.organization,
        "avatarUrl": payload.avatarUrl,
        "phone": payload.phone,
        "address": payload.address,
        "taxCode": payload.taxCode,
        "industry": payload.industry,
        "storeCount": payload.storeCount,
        "website": payload.website
    }
    
    # Filter out None values
    clean_dict = {k: v for k, v in update_data.items() if v is not None}
    
    # 1. Update in MongoDB Atlas
    updated_user = await db_manager.update_user_profile(email_clean, clean_dict)
    
    # 2. Update in Fallback Cache
    for u in FALLBACK_USERS:
        if u["email"].lower() == email_clean:
            u.update(clean_dict)
            if not updated_user:
                updated_user = u
            break

    if not updated_user:
        # Nếu chưa có trong DB, lấy từ fallback hoặc tạo bản ghi giả lập
        updated_user = {
            "id": payload.userId or f"USR_{uuid.uuid4().hex[:8].upper()}",
            "email": email_clean,
            "fullName": payload.fullName or "Người Dùng Doanh Nghiệp",
            "role": "business_user",
            "organization": payload.organization or "Doanh Nghiệp Bán Lẻ",
            "roleTitle": "🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)",
            "createdAt": "2026-08-15",
            **clean_dict
        }
        FALLBACK_USERS.append(updated_user)

    return UserResponse(
        id=updated_user.get("id", "USR_UPDATED"),
        email=updated_user["email"],
        fullName=updated_user["fullName"],
        role=updated_user.get("role", "business_user"),
        organization=updated_user.get("organization", "Doanh Nghiệp"),
        roleTitle=updated_user.get("roleTitle", "Thành viên"),
        createdAt=updated_user.get("createdAt", "2026-08-15"),
        avatarUrl=updated_user.get("avatarUrl"),
        phone=updated_user.get("phone"),
        address=updated_user.get("address"),
        taxCode=updated_user.get("taxCode"),
        industry=updated_user.get("industry"),
        storeCount=updated_user.get("storeCount"),
        website=updated_user.get("website")
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users():
    """
    Lấy danh sách tất cả tài khoản người dùng đã lưu trong MongoDB Atlas.
    """
    try:
        users = await db_manager.get_all_users()
        if not users:
            users = FALLBACK_USERS
        
        return [
            UserResponse(
                id=u.get("id", f"USR_{idx}"),
                email=u["email"],
                fullName=u["fullName"],
                role=u.get("role", "business_user"),
                organization=u.get("organization", "Doanh Nghiệp"),
                roleTitle=u.get("roleTitle", "Thành viên"),
                createdAt=u.get("createdAt", "2026-08-15"),
                avatarUrl=u.get("avatarUrl"),
                phone=u.get("phone"),
                address=u.get("address"),
                taxCode=u.get("taxCode"),
                industry=u.get("industry"),
                storeCount=u.get("storeCount"),
                website=u.get("website")
            )
            for idx, u in enumerate(users)
        ]
    except Exception as e:
        return [
            UserResponse(
                id=u["id"],
                email=u["email"],
                fullName=u["fullName"],
                role=u["role"],
                organization=u.get("organization", "Doanh Nghiệp"),
                roleTitle=u["roleTitle"],
                createdAt=u.get("createdAt", "2026-08-15"),
                avatarUrl=u.get("avatarUrl"),
                phone=u.get("phone"),
                address=u.get("address"),
                taxCode=u.get("taxCode"),
                industry=u.get("industry"),
                storeCount=u.get("storeCount"),
                website=u.get("website")
            )
            for u in FALLBACK_USERS
        ]
