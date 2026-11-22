"""
User store: MongoDB làm nguồn chính, danh sách FALLBACK_USERS trong bộ nhớ khi DB offline.
Mật khẩu trong fallback được hash bằng bcrypt ngay khi nạp module.
"""

from typing import Any, Dict, Optional

try:
    from backend.app.core.database import db_manager
    from backend.app.core.security import hash_password
except ImportError:
    from app.core.database import db_manager
    from app.core.security import hash_password


_MOCK_PHONE = "0900000000"
_MOCK_ADDRESS = "Nha Trang, Khánh Hòa"

# Tài khoản mẫu cho chế độ demo / offline. Thông tin liên hệ là dữ liệu giả lập.
_SEED_USERS = [
    {
        "id": "USR_ADMIN_01",
        "email": "admin@omni-dss.vn",
        "password": "admin123",
        "fullName": "Võ Thành Tòng",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (65.TTQL-2)",
        "roleTitle": "👑 Thành Viên Chính NCKH & System Admin",
        "industry": "Hệ Thống Thông Tin & Phân Tích DSS Bán Lẻ",
        "storeCount": "20+ Chuỗi siêu thị toàn quốc",
        "website": "https://omni-dss.vn",
    },
    {
        "id": "USR_LEADER_02",
        "email": "nhi.hlt.66ttql@ntu.edu.vn",
        "password": "nhi123",
        "fullName": "Hoàng Lê Thảo Nhi",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (66.TTQL-1)",
        "roleTitle": "👑 Chủ Nhiệm Đề Tài NCKH Sinh Viên",
        "industry": "Khai Phá Dữ Liệu & Học Máy Bán Lẻ Đa Kênh",
        "storeCount": "Hệ thống Bán lẻ Đa kênh Toàn quốc",
        "website": "https://ntu.edu.vn",
    },
    {
        "id": "USR_MEMBER_03",
        "email": "buyt.vh.65ttql@ntu.edu.vn",
        "password": "buyt123",
        "fullName": "Võ Hoài Buýt",
        "role": "admin",
        "organization": "Khoa CNTT - Trường Đại Học Nha Trang (65.TTQL-2)",
        "roleTitle": "💻 Thành Viên Chính Nghiên Cứu & ML Engineer",
        "industry": "Mô Hình Học Máy XGBoost & Trực Quan Hóa",
        "storeCount": "Chuỗi Bán lẻ Đa kênh",
        "website": "https://ntu.edu.vn",
    },
    {
        "id": "USR_ADVISOR_04",
        "email": "lynth@ntu.edu.vn",
        "password": "ly123",
        "fullName": "ThS. Nguyễn Thị Hương Lý",
        "role": "admin",
        "organization": "Giảng Viên Khoa CNTT - Trường Đại Học Nha Trang",
        "roleTitle": "🎓 Cán Bộ Hướng Dẫn Khoa Học",
        "industry": "Khoa Học Dữ Liệu & Hệ Hỗ Trợ Ra Quyết Định",
        "storeCount": "Hội đồng Khoa học Khoa CNTT",
        "website": "https://kcntt.ntu.edu.vn",
    },
    {
        "id": "USR_BIZ_05",
        "email": "business@retail.vn",
        "password": "user123",
        "fullName": "Chuyên Viên Marketing & CSKH",
        "role": "business_user",
        "organization": "Tập Đoàn Bán Lẻ Đa Kênh OmniRetail Corp",
        "roleTitle": "🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)",
        "industry": "Thời trang & Phụ kiện Đa Kênh",
        "storeCount": "6 - 20 Chi nhánh cửa hàng",
        "website": "https://omniretail.vn",
    },
]

FALLBACK_USERS = [
    {
        **u,
        "password": hash_password(u["password"]),
        "createdAt": "2026-08-15",
        "avatarUrl": None,
        "phone": _MOCK_PHONE,
        "address": _MOCK_ADDRESS,
        "taxCode": "0000000000",
    }
    for u in _SEED_USERS
]


def normalize_email(email: str) -> str:
    return (email or "").lower().strip()


def find_fallback_user(email: str) -> Optional[Dict[str, Any]]:
    email_clean = normalize_email(email)
    for u in FALLBACK_USERS:
        if u["email"].lower() == email_clean:
            return u
    return None


async def find_user(email: str) -> Optional[Dict[str, Any]]:
    """Tìm user trong MongoDB trước, sau đó trong fallback."""
    email_clean = normalize_email(email)
    if not email_clean:
        return None
    user = await db_manager.get_user_by_email(email_clean)
    return user or find_fallback_user(email_clean)


def to_public(user: Dict[str, Any]) -> Dict[str, Any]:
    """Loại bỏ trường nhạy cảm (password) trước khi trả về client."""
    return {
        "id": user.get("id", "USR_DEFAULT"),
        "email": user["email"],
        "fullName": user.get("fullName", ""),
        "role": user.get("role", "business_user"),
        "organization": user.get("organization", "Doanh Nghiệp Bán Lẻ"),
        "roleTitle": user.get("roleTitle", "Thành viên"),
        "createdAt": user.get("createdAt", "2026-08-15"),
        "avatarUrl": user.get("avatarUrl"),
        "phone": user.get("phone"),
        "address": user.get("address"),
        "taxCode": user.get("taxCode"),
        "industry": user.get("industry"),
        "storeCount": user.get("storeCount"),
        "website": user.get("website"),
    }
