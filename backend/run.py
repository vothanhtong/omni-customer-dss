import sys
import os
import uvicorn

# Thêm thư mục gốc dự án vào python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.config import API_HOST, API_PORT

if __name__ == "__main__":
    print(f"🌟 Đang khởi chạy Server Backend trên http://{API_HOST}:{API_PORT}...")
    uvicorn.run("backend.app.main:app", host=API_HOST, port=API_PORT, reload=True)
