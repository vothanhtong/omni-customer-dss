"""
Security helpers: password hashing (bcrypt via passlib) and JWT access tokens (PyJWT).
"""

import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from passlib.context import CryptContext

try:
    from backend.app.core.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
except ImportError:
    from app.core.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

if JWT_SECRET:
    _SECRET = JWT_SECRET
else:
    # Không có JWT_SECRET trong .env: sinh khóa ngẫu nhiên cho phiên chạy này.
    # Mọi token sẽ mất hiệu lực khi khởi động lại server.
    _SECRET = secrets.token_urlsafe(64)
    print("⚠️ JWT_SECRET chưa được cấu hình trong .env — đang dùng khóa tạm thời (token sẽ mất hiệu lực khi restart).")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def is_password_hash(value: Optional[str]) -> bool:
    return bool(value) and pwd_context.identify(value) is not None


def verify_password(plain: str, stored: Optional[str]) -> bool:
    """Kiểm tra mật khẩu với hash bcrypt đã lưu."""
    if not stored or not is_password_hash(stored):
        return False
    try:
        return pwd_context.verify(plain, stored)
    except (ValueError, TypeError):
        return False


def verify_legacy_plaintext(plain: str, stored: Optional[str]) -> bool:
    """So khớp mật khẩu dạng plaintext cũ (tài khoản tạo trước khi có bcrypt) — chỉ dùng để nâng cấp hash."""
    if not stored or is_password_hash(stored):
        return False
    return hmac.compare_digest(plain.encode("utf-8"), stored.encode("utf-8"))


def create_access_token(email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Giải mã token; ném jwt.PyJWTError nếu token không hợp lệ hoặc hết hạn."""
    return jwt.decode(token, _SECRET, algorithms=[JWT_ALGORITHM], options={"require": ["sub", "exp"]})
