import os
import sys

import pytest

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from backend.app.core.ml_models import _ARTIFACTS  # noqa: E402
from backend.app.core.config import SAVED_MODELS_DIR  # noqa: E402

MODELS_READY = all(os.path.exists(os.path.join(SAVED_MODELS_DIR, f)) for f in _ARTIFACTS.values())
requires_models = pytest.mark.skipif(not MODELS_READY, reason="Chưa huấn luyện mô hình (python backend/train_pipeline.py)")


@pytest.fixture(scope="session")
def client():
    """TestClient chạy offline: không kết nối MongoDB thật."""
    from fastapi.testclient import TestClient
    from backend.app.core.database import db_manager
    from backend.app.main import app

    async def _offline_connect():
        db_manager.is_connected = False
        db_manager.driver_type = "Offline Memory Fallback"

    db_manager.connect = _offline_connect
    with TestClient(app) as c:
        yield c
