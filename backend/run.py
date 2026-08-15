import sys
import os

# Cấu hình UTF-8 cho console Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Thêm thư mục gốc dự án vào python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# pyrefly: ignore
import uvicorn
from backend.app.core.config import API_HOST, API_PORT

if __name__ == "__main__":
    print(f"🌟 Đang khởi chạy Server Backend trên http://{API_HOST}:{API_PORT}...")
    uvicorn.run("backend.app.main:app", host=API_HOST, port=API_PORT, reload=True)
