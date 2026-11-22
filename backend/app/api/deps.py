"""
FastAPI dependencies cho xác thực JWT & phân quyền.
"""

from typing import Any, Dict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from backend.app.core.artifacts import load_json_artifact
    from backend.app.core.security import decode_access_token
    from backend.app.core.user_store import find_user
except ImportError:
    from app.core.artifacts import load_json_artifact
    from app.core.security import decode_access_token
    from app.core.user_store import find_user

_bearer = HTTPBearer(auto_error=False)

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _UNAUTHORIZED
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise _UNAUTHORIZED

    user = await find_user(str(payload.get("sub", "")))
    if not user:
        raise _UNAUTHORIZED
    return user


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên mới có quyền thực hiện thao tác này.")
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    """Trả về user nếu có token hợp lệ, ngược lại None (không ném lỗi)."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def artifact_or_503(name: str) -> Dict[str, Any]:
    """Artefact JSON do train_pipeline.py sinh ra; chưa có -> 503 kèm hướng dẫn."""
    data = load_json_artifact(name)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Chưa có {name}. Hãy chạy: python backend/train_pipeline.py",
        )
    return data
