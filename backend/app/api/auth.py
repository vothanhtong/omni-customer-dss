from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

try:
    from backend.app.schemas.auth import (
        UserRegisterRequest,
        UserLoginRequest,
        UserResponse,
        UserProfileUpdateRequest,
        AuthTokenResponse,
    )
    from backend.app.core.database import db_manager
    from backend.app.core.security import (
        hash_password,
        verify_password,
        verify_legacy_plaintext,
        create_access_token,
    )
    from backend.app.core.user_store import (
        FALLBACK_USERS,
        find_fallback_user,
        find_user,
        normalize_email,
        to_public,
    )
    from backend.app.api.deps import get_current_user, get_optional_user, require_admin
except ImportError:
    from app.schemas.auth import (
        UserRegisterRequest,
        UserLoginRequest,
        UserResponse,
        UserProfileUpdateRequest,
        AuthTokenResponse,
    )
    from app.core.database import db_manager
    from app.core.security import (
        hash_password,
        verify_password,
        verify_legacy_plaintext,
        create_access_token,
    )
    from app.core.user_store import (
        FALLBACK_USERS,
        find_fallback_user,
        find_user,
        normalize_email,
        to_public,
    )
    from app.api.deps import get_current_user, get_optional_user, require_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Email hoặc mật khẩu không chính xác.",
)


def _token_response(user: Dict[str, Any]) -> AuthTokenResponse:
    public = to_public(user)
    return AuthTokenResponse(
        access_token=create_access_token(public["email"], public["role"]),
        user=UserResponse(**public),
    )


@router.post("/register", response_model=AuthTokenResponse)
async def register_user(
    payload: UserRegisterRequest,
    requester: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """
    Đăng ký tài khoản mới. Tài khoản vai trò 'admin' chỉ được tạo bởi một Quản trị viên đã đăng nhập.
    """
    if payload.role not in ("admin", "business_user"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vai trò không hợp lệ.")
    if payload.role == "admin" and (requester is None or requester.get("role") != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Quản trị viên mới có thể tạo tài khoản vai trò Admin.",
        )

    email_clean = normalize_email(payload.email)
    if await find_user(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống.",
        )

    role_title = (
        "👑 Quản Trị Viên Hệ Thống (System Admin)"
        if payload.role == "admin"
        else "🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)"
    )
    user_doc = {
        "id": f"USR_{uuid.uuid4().hex[:8].upper()}",
        "email": email_clean,
        "password": hash_password(payload.password),
        "fullName": payload.fullName.strip(),
        "role": payload.role,
        "organization": payload.organization.strip() if payload.organization else "Doanh Nghiệp Bán Lẻ",
        "roleTitle": role_title,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "avatarUrl": payload.avatarUrl,
        "phone": payload.phone,
        "address": payload.address,
        "taxCode": payload.taxCode,
        "industry": payload.industry,
        "storeCount": payload.storeCount,
        "website": payload.website,
    }

    await db_manager.create_user(dict(user_doc))
    FALLBACK_USERS.append(user_doc)

    return _token_response(user_doc)


@router.post("/login", response_model=AuthTokenResponse)
async def login_user(payload: UserLoginRequest):
    """
    Đăng nhập: kiểm tra mật khẩu bằng bcrypt và trả về JWT access_token.
    """
    email_clean = normalize_email(payload.email)
    db_user = await db_manager.get_user_by_email(email_clean)
    fallback_user = find_fallback_user(email_clean)
    user = db_user or fallback_user
    if not user:
        raise _INVALID_CREDENTIALS

    stored = user.get("password")
    if not stored and fallback_user:
        # Bản ghi Mongo cũ không có password (tạo từ PUT /profile trước đây) -> dùng hash của fallback
        stored = fallback_user.get("password")

    if verify_password(payload.password, stored):
        pass
    elif verify_legacy_plaintext(payload.password, stored):
        # Tài khoản cũ lưu plaintext trong MongoDB: nâng cấp sang bcrypt ngay khi đăng nhập thành công
        await db_manager.update_user_profile(email_clean, {"password": hash_password(payload.password)})
    else:
        raise _INVALID_CREDENTIALS

    return _token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Thông tin tài khoản của token hiện tại."""
    return UserResponse(**to_public(current_user))


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Cập nhật hồ sơ của CHÍNH người dùng sở hữu token. Sửa hồ sơ email khác -> 403.
    """
    owner_email = normalize_email(current_user["email"])
    if payload.email and normalize_email(payload.email) != owner_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ được phép cập nhật hồ sơ của chính mình.",
        )

    update_data = {
        "fullName": payload.fullName,
        "organization": payload.organization,
        "avatarUrl": payload.avatarUrl,
        "phone": payload.phone,
        "address": payload.address,
        "taxCode": payload.taxCode,
        "industry": payload.industry,
        "storeCount": payload.storeCount,
        "website": payload.website,
    }
    clean_dict = {k: v for k, v in update_data.items() if v is not None}

    # Ghi toàn bộ bản ghi (kể cả password hash) để tài khoản fallback được lưu đầy đủ vào MongoDB
    merged = {**current_user, **clean_dict, "email": owner_email}
    updated_user = await db_manager.update_user_profile(owner_email, merged)

    fb = find_fallback_user(owner_email)
    if fb:
        fb.update(clean_dict)

    return UserResponse(**to_public(updated_user or merged))


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(_admin: Dict[str, Any] = Depends(require_admin)):
    """
    Danh sách tài khoản (chỉ Quản trị viên).
    """
    users = await db_manager.get_all_users()
    if not users:
        users = FALLBACK_USERS
    return [UserResponse(**to_public(u)) for u in users]
