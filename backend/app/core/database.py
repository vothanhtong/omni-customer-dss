"""
MongoDB Database Manager
Tích hợp MongoDB cho FastAPI với cơ chế tự động phát hiện Driver (Motor / PyMongo),
bảo mật ẩn mật khẩu khi in log và tự động Fallback linh hoạt nếu MongoDB chưa được bật.
"""

import inspect
import logging
import re
from typing import Any, Callable, Dict, List, Optional
from backend.app.core.config import MONGODB_URL, MONGODB_DB_NAME

logger = logging.getLogger("backend.database")

# Try Async Motor Driver first, fallback to PyMongo
MOTOR_AVAILABLE = False
PYMONGO_AVAILABLE = False

try:
    # pyrefly: ignore [missing-import]
    from motor.motor_asyncio import AsyncIOMotorClient
    MOTOR_AVAILABLE = True
except ImportError:
    try:
        # pyrefly: ignore [missing-import]
        from pymongo import MongoClient
        PYMONGO_AVAILABLE = True
    except ImportError:
        pass


def _mask_uri_password(uri: str) -> str:
    """Che mật khẩu trong chuỗi kết nối MongoDB trước khi in ra log."""
    return re.sub(r":([^@]+)@", ":****@", uri)


class MongoDBManager:
    def __init__(self):
        self.motor_client = None
        self.pymongo_client = None
        self.db = None
        self.is_connected: bool = False
        self.driver_type: str = "None"

    async def connect(self):
        """Khởi tạo kết nối MongoDB kết hợp timeout kiểm tra kết nối."""
        masked_uri = _mask_uri_password(MONGODB_URL)
        
        if MOTOR_AVAILABLE:
            try:
                self.motor_client = AsyncIOMotorClient(
                    MONGODB_URL,
                    serverSelectionTimeoutMS=5000
                )
                self.db = self.motor_client[MONGODB_DB_NAME]
                await self.motor_client.admin.command('ping')
                self.is_connected = True
                self.driver_type = "Motor (Async)"
                print(f"🍃 Kết nối MongoDB Async thành công: {masked_uri}/{MONGODB_DB_NAME}")
                return
            except Exception as e:
                self.is_connected = False

        if PYMONGO_AVAILABLE:
            try:
                self.pymongo_client = MongoClient(
                    MONGODB_URL,
                    serverSelectionTimeoutMS=5000
                )
                self.db = self.pymongo_client[MONGODB_DB_NAME]
                self.pymongo_client.admin.command('ping')
                self.is_connected = True
                self.driver_type = "PyMongo (Sync)"
                print(f"🍃 Kết nối MongoDB Sync thành công: {masked_uri}/{MONGODB_DB_NAME}")
                return
            except Exception as e:
                self.is_connected = False

        self.is_connected = False
        self.driver_type = "Offline Memory Fallback"
        print(f"⚠️ Không thể kết nối đến MongoDB tại {masked_uri}. Hệ thống chạy ở chế độ Offline Fallback.")

    async def close(self):
        """Đóng kết nối MongoDB."""
        if self.motor_client:
            self.motor_client.close()
        if self.pymongo_client:
            self.pymongo_client.close()
        print("🍃 Đã giải phóng kết nối MongoDB.")

    # --- Database Operations ---
    # Motor (async) và PyMongo (sync) có cùng API, chỉ khác là Motor trả về awaitable.
    # _run gom phần lặp lại: kiểm tra kết nối, await nếu cần, bắt lỗi & ghi log, trả giá trị mặc định.

    @staticmethod
    async def _resolve(value: Any) -> Any:
        return await value if inspect.isawaitable(value) else value

    async def _run(self, what: str, default: Any, op: Callable[[Any], Any]) -> Any:
        if not self.is_connected or self.db is None:
            return default
        try:
            return await self._resolve(op(self.db))
        except Exception as e:
            logger.error(f"Lỗi MongoDB khi {what}: {e}")
            return default

    async def _to_list(self, cursor: Any, length: Optional[int] = None) -> List[Dict[str, Any]]:
        return await cursor.to_list(length=length) if self.driver_type == "Motor (Async)" else list(cursor)

    async def _insert_one(self, collection: str, record: Dict[str, Any]) -> bool:
        async def op(db):
            await self._resolve(db[collection].insert_one(dict(record)))  # copy: không gắn _id vào dict của caller
            return True
        return await self._run(f"lưu vào '{collection}'", False, op)

    async def save_rfm_prediction(self, record: Dict[str, Any]) -> bool:
        return await self._insert_one("rfm_predictions", record)

    async def save_churn_prediction(self, record: Dict[str, Any]) -> bool:
        return await self._insert_one("churn_predictions", record)

    async def save_dss_log(self, record: Dict[str, Any]) -> bool:
        return await self._insert_one("dss_logs", record)

    async def save_batch_job(self, record: Dict[str, Any]) -> bool:
        """Nhật ký dự đoán hàng loạt (chỉ số liệu tổng hợp)."""
        return await self._insert_one("batch_jobs", record)

    async def save_customer_action(self, record: Dict[str, Any]) -> bool:
        """Hành động CSKH (chỉ lưu ref mờ, không lưu customer_id gốc)."""
        return await self._insert_one("customer_actions", record)

    async def save_dss_logs(self, records: List[Dict[str, Any]]) -> bool:
        """Lưu nhiều nhật ký DSS trong MỘT lệnh insert_many."""
        if not records:
            return False

        async def op(db):
            await self._resolve(db["dss_logs"].insert_many([dict(r) for r in records], ordered=False))
            return True
        return await self._run("lưu batch DSS logs", False, op)

    async def get_recent_dss_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return await self._run("lấy DSS logs", [], lambda db: self._to_list(
            db["dss_logs"].find({}, {"_id": 0}).sort("_id", -1).limit(limit), limit))

    async def get_customer_actions(self, refs: List[str]) -> Dict[str, Dict[str, Any]]:
        """Hành động MỚI NHẤT theo từng ref."""
        if not refs:
            return {}

        async def op(db):
            docs = await self._to_list(db["customer_actions"].find({"ref": {"$in": list(refs)}}, {"_id": 0}).sort("triggered_at", 1))
            return {d["ref"]: d for d in docs}  # sort tăng dần -> bản ghi sau ghi đè -> mới nhất
        return await self._run("lấy customer actions", {}, op)

    # --- User Management ---

    async def create_user(self, user_data: Dict[str, Any]) -> bool:
        async def op(db):
            await self._resolve(db["users"].update_one({"email": user_data["email"]}, {"$set": user_data}, upsert=True))
            return True
        return await self._run("lưu tài khoản user", False, op)

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self._run("tìm tài khoản user", None, lambda db: db["users"].find_one({"email": email}, {"_id": 0}))

    async def update_user_profile(self, email: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật hồ sơ doanh nghiệp & avatar."""
        key = email.lower().strip()
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        clean_update["email"] = key

        async def op(db):
            await self._resolve(db["users"].update_one({"email": key}, {"$set": clean_update}, upsert=True))
            return await self._resolve(db["users"].find_one({"email": key}, {"_id": 0}))
        return await self._run("cập nhật hồ sơ user", None, op)

    async def get_all_users(self) -> List[Dict[str, Any]]:
        return await self._run("lấy danh sách users", [], lambda db: self._to_list(
            db["users"].find({}, {"_id": 0}).sort("_id", -1), 100))


db_manager = MongoDBManager()



