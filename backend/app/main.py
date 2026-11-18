"""
FastAPI Backend REST API Application Entrypoint with MongoDB Integration
"""

import sys
import os
from contextlib import asynccontextmanager
# pyrefly: ignore 
from fastapi import FastAPI
# pyrefly: ignore
from fastapi.middleware.cors import CORSMiddleware

# Đảm bảo đường dẫn gốc dự án luôn có trong sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from backend.app.core.ml_models import ml_manager
    from backend.app.core.database import db_manager
    from backend.app.core.config import ALLOWED_ORIGINS
    from backend.app.api.rfm import router as rfm_router
    from backend.app.api.churn import router as churn_router
    from backend.app.api.dss import router as dss_router
    from backend.app.api.auth import router as auth_router
    from backend.app.api.metrics import router as metrics_router
except ImportError:
    from app.core.ml_models import ml_manager
    from app.core.database import db_manager
    from app.core.config import ALLOWED_ORIGINS
    from app.api.rfm import router as rfm_router
    from app.api.churn import router as churn_router
    from app.api.dss import router as dss_router
    from app.api.auth import router as auth_router
    from app.api.metrics import router as metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("🚀 Đang khởi chạy FastAPI Engine & Nạp các mô hình ML...")
    ml_manager.load_models()
    
    print("🍃 Đang khởi tạo kết nối MongoDB...")
    await db_manager.connect()
    
    yield
    
    # Shutdown logic
    print("🛑 Đang đóng ứng dụng FastAPI...")
    await db_manager.close()


app = FastAPI(
    title="Customer Analytics & Churn Prediction API",
    description="REST API tích hợp K-Means RFM Segmentation, Churn Prediction (LR/DT/RF/XGBoost), DSS Engine và MongoDB Database",
    version="1.2.0",
    lifespan=lifespan
)

# Cấu hình CORS Middleware: chỉ cho phép các origin khai báo trong ALLOWED_ORIGINS.
# Không bao giờ kết hợp wildcard "*" với allow_credentials=True.
_allow_all = "*" in ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else ALLOWED_ORIGINS,
    allow_credentials=not _allow_all,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(rfm_router)
app.include_router(churn_router)
app.include_router(dss_router)
app.include_router(metrics_router)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "message": "Customer Analytics & DSS API Backend is running",
        "mongodb_connected": db_manager.is_connected,
        "docs_url": "/docs"
    }


@app.get("/api/db/status", tags=["Database"])
def db_status():
    """Kiểm tra trạng thái kết nối MongoDB (không trả về chuỗi kết nối)."""
    return {"status": "connected" if db_manager.is_connected else "offline"}
