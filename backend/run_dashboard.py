import sys
import os
import subprocess

# Cấu hình UTF-8 cho console Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_PATH = os.path.join(BASE_DIR, "backend", "dashboard", "app.py")

if __name__ == "__main__":
    print("🚀 Đang khởi chạy Streamlit Web Dashboard Bán Hàng Đa Kênh...")
    subprocess.run([sys.executable, "-m", "streamlit", "run", APP_PATH, "--server.port=8501"])
