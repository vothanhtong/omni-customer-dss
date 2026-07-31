import sys
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_PATH = os.path.join(BASE_DIR, "backend", "dashboard", "app.py")

if __name__ == "__main__":
    print("🚀 Đang khởi chạy Streamlit Web Dashboard Bán Hàng Đa Kênh...")
    subprocess.run([sys.executable, "-m", "streamlit", "run", APP_PATH, "--server.port=8501"])
