"""
MongoDB Database Manager
Tích hợp MongoDB cho FastAPI với cơ chế tự động phát hiện Driver (Motor / PyMongo),
bảo mật ẩn mật khẩu khi in log và tự động Fallback linh hoạt nếu MongoDB chưa được bật.
"""

import logging
import re
from typing import Optional, Dict, Any, List
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

    async def save_rfm_prediction(self, record: Dict[str, Any]) -> bool:
        """Lưu dự đoán RFM vào MongoDB collection 'rfm_predictions'"""
        if not self.is_connected or self.db is None:
            return False
        try:
            if self.driver_type == "Motor (Async)":
                await self.db["rfm_predictions"].insert_one(record)
            else:
                self.db["rfm_predictions"].insert_one(record)
            return True
        except Exception as e:
            logger.error(f"Lỗi khi lưu RFM prediction vào MongoDB: {e}")
            return False

    async def save_churn_prediction(self, record: Dict[str, Any]) -> bool:
        """Lưu dự đoán Churn vào MongoDB collection 'churn_predictions'"""
        if not self.is_connected or self.db is None:
            return False
        try:
            if self.driver_type == "Motor (Async)":
                await self.db["churn_predictions"].insert_one(record)
            else:
                self.db["churn_predictions"].insert_one(record)
            return True
        except Exception as e:
            logger.error(f"Lỗi khi lưu Churn prediction vào MongoDB: {e}")
            return False

    async def save_dss_log(self, record: Dict[str, Any]) -> bool:
        """Lưu nhật ký DSS vào MongoDB collection 'dss_logs'"""
        if not self.is_connected or self.db is None:
            return False
        try:
            if self.driver_type == "Motor (Async)":
                await self.db["dss_logs"].insert_one(record)
            else:
                self.db["dss_logs"].insert_one(record)
            return True
        except Exception as e:
            logger.error(f"Lỗi khi lưu DSS log vào MongoDB: {e}")
            return False

    async def get_recent_dss_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy danh sách nhật ký DSS từ MongoDB"""
        if not self.is_connected or self.db is None:
            return []
        try:
            if self.driver_type == "Motor (Async)":
                cursor = self.db["dss_logs"].find({}, {"_id": 0}).sort("_id", -1).limit(limit)
                return await cursor.to_list(length=limit)
            else:
                cursor = self.db["dss_logs"].find({}, {"_id": 0}).sort("_id", -1).limit(limit)
                return list(cursor)
        except Exception as e:
            logger.error(f"Lỗi khi lấy DSS logs từ MongoDB: {e}")
            return []


db_manager = MongoDBManager()
