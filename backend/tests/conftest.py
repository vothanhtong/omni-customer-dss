import os
import sys

import pytest

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)


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
