"""
Đọc các artefact JSON do train_pipeline.py sinh ra (model_metrics, analytics_summary, dss_evaluation).
Cache theo mtime: chỉ parse lại khi file thay đổi (huấn luyện lại), thay vì đọc đĩa ở mỗi request.
Giá trị trả về dùng chung giữa các request — chỉ đọc, KHÔNG sửa.
"""

import json
import os
import threading
from typing import Any, Dict, Optional, Tuple

try:
    from backend.app.core.config import SAVED_MODELS_DIR
except ImportError:
    from app.core.config import SAVED_MODELS_DIR

_cache: Dict[str, Tuple[float, Any]] = {}
_lock = threading.Lock()


def artifact_path(name: str) -> str:
    return os.path.join(SAVED_MODELS_DIR, name)


def load_json_artifact(name: str) -> Optional[Dict[str, Any]]:
    path = artifact_path(name)
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return None
    hit = _cache.get(path)
    if hit and hit[0] == mtime:
        return hit[1]
    with _lock:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _cache[path] = (mtime, data)
    return data
