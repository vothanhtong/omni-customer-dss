# 📊 Omni Customer DSS & Analytics Platform
> **Đề tài Nghiên cứu Khoa học:** *"Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong môi trường bán hàng đa kênh (Omnichannel Retail DSS)"*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![XGBoost](https://img.shields.io/badge/XGBoost-Tuned_0.9575_AUC-EB5424?style=flat&logo=scikit-learn&logoColor=white)](https://xgboost.readthedocs.io)

---

## 📖 1. Tổng Quan Hệ Thống

**Omni Customer DSS** là nền tảng **Hỗ trợ ra Quyết định (Decision Support System - DSS)** toàn diện cho doanh nghiệp bán lẻ đa kênh (POS Cửa hàng, Website E-commerce, Sàn TMĐT Shopee/Lazada). Hệ thống kết hợp giữa **Khoa học Dữ liệu (Machine Learning)** và **Động cơ Quy tắc Nghiệp vụ Đa Tầng (Rule-based Engine)** nhằm nhận diện phân khúc khách hàng, dự đoán sớm nguy cơ rời bỏ (Churn Risk) và tự động đề xuất các chiến lược Marketing giữ chân cá nhân hóa theo thời gian thực.

---

## 🌟 2. Tính Năng Cốt Lõi (Key Features)

### 🎨 Giao Diện Doanh Nghiệp (Adminator Imperial Design)
* **Bảng Điều Khiển Dashboard Toàn Diện:**
  * **4 KPI Cards Adminator:** Theo dõi Tổng doanh thu (`Total visits`), Lượt tương tác (`Page views`), Khách hàng duy nhất (`Unique visitors`) và Tỷ lệ rời bỏ (`Bounce rate / Churn rate`).
  * **Phân Bổ Kênh Bán Hàng & Địa Lý:** 4 Progress Bars trực quan (`POS Store`, `Website`, `Sàn TMĐT`, `Kênh Khác`).
  * **3 Vòng Tròn Chỉ Số SVG Donut:** `75% New users`, `50% Retain purchases`, `91.5% ML Accuracy`.
  * **Monthly Performance & Todo List:** Thống kê hiệu năng mô hình theo tháng và danh sách công việc CSKH có checkbox tương tác tức thời.
* **Trang Đăng Ký / Đăng Nhập Split-Screen:** Bố cục 2 cột sang trọng với Hero gradient tím xanh bên trái và form xác thực nhanh bên phải (có nút đăng nhập Demo 1-chạm `👑 Admin` / `🏢 Doanh Nghiệp`).
* **Hệ Thống Thông Báo Thời Gian Thực (Notification Drawer):** Ngăn kéo trượt mở từ bên phải hiển thị cảnh báo Churn khẩn cấp (>70%), VIP giảm tương tác và cập nhật mô hình ML.
* **Ứng Dụng Live Chat Realtime (Chat Drawer):**
  * 🤖 **Trợ Lý AI DSS Copilot:** Hỏi đáp thông minh, tư vấn giải pháp giữ chân khách hàng và phân tích dữ liệu.
  * 👥 **Kênh Trao Đổi CSKH Nội Bộ:** Gửi nhận tin nhắn tức thời giữa Quản trị viên và Chuyên viên CSKH.
* **Chế Độ Sáng / Tối (Light & Dark Theme Switcher):** Chuyển đổi giao diện linh hoạt giữa Dark Navy `#070b14` và Clean Light `#f1f5f9`, tự động lưu trạng thái vào `localStorage`.

---

### 🧠 Động Cơ Học Máy & DSS Engine
1. **Phân Cụm Khách Hàng RFM (K-Means Clustering):**
   * Sử dụng phương pháp **Elbow Curve (SSE)** xác định $K=4$ cụm khách hàng tối ưu: **VIP**, **Tiềm năng**, **Cần chăm sóc**, **Rủi ro**.
2. **Dự Đoán Rủi Ro Rời Bỏ Churn (XGBoost Ensemble Tuned):**
   * Mô hình XGBoost được tối ưu bằng **GridSearchCV** và kiểm định **5-Fold Cross Validation** trên 10,480 bản ghi, đạt độ chính xác **91.50%** và **ROC-AUC = 0.9575**.
3. **Động Cơ Luật Ra Quyết Định Đa Tầng (Rule-based DSS Engine):**
   * Tự động phân cấp nguy cơ: 🔴 **HIGH** (>70%), 🟡 **MEDIUM** (40–70%), 🟢 **LOW** (<40%).
   * Đề xuất chính xác 5 kịch bản Marketing cá nhân hóa: Voucher 15–20%, Freeship, Tri ân VIP, Tích điểm kép.
4. **Cơ Sở Dữ Liệu Cloud MongoDB Atlas:**
   * Kết nối phi đồng bộ (Motor Async Driver) lưu trữ bền vững 4 collections: `users`, `rfm_predictions`, `churn_predictions`, `dss_logs` (có cơ chế Offline Fallback an toàn).

---

## 📁 3. Cấu Trúc Thư Mục Dự Án (Project Hierarchy)

```text
omni-customer-dss/
├── BAO_CAO_NGHIEN_CUU_KHOA_HOC.md     # 📄 Báo cáo toàn văn NCKH 5 chương chuẩn học thuật
├── README.md                          # 📑 Tài liệu tổng quan & hướng dẫn triển khai
├── pyrightconfig.json                 # ⚙️ Cấu hình IDE resolve Python packages
├── .vscode/                           # ⚙️ Cấu hình VSCode & Python Interpreter
│   └── settings.json
├── .venv/                             # 🐍 Môi trường ảo Python độc lập
│
├── backend/                           # 🧠 PHÂN HỆ BACKEND REST API & MACHINE LEARNING
│   ├── .env                           # Chuỗi kết nối Cloud MongoDB Atlas & Port API
│   ├── requirements.txt               # Danh mục thư viện Python phụ thuộc
│   ├── run.py                         # File khởi chạy Server FastAPI REST API
│   ├── run_dashboard.py               # File khởi chạy Streamlit Web Dashboard
│   ├── app/
│   │   ├── main.py                    # FastAPI Entrypoint & CORS Middleware
│   │   ├── api/                       # API Routers (auth.py, churn.py, dss.py, rfm.py)
│   │   ├── core/                      # Core Modules (ml_models.py, dss_engine.py, database.py, config.py)
│   │   └── schemas/                   # Pydantic Schemas & Data Transfer Objects
│   ├── dashboard/
│   │   └── app.py                     # Giao diện phụ Streamlit Analytics Dashboard
│   └── saved_models/                  # File mô hình (.pkl), Dataset CSV & Biểu đồ PNG
│
└── frontend/                          # 🎨 PHÂN HỆ FRONTEND (REACT 18 + TYPESCRIPT + VITE)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx                    # Main Layout, Providers & Dynamic Router
        ├── main.tsx                   # React DOM Entrypoint
        ├── assets/                    # Styling CSS (Dark & Light Adminator Theme)
        ├── components/
        │   ├── auth/                  # Trang Đăng Ký / Đăng Nhập Split-Screen
        │   ├── chat/                  # Live Chat CSKH & AI DSS Copilot
        │   ├── layout/                # Adminator Sidebar & TopHeader Bar
        │   ├── notifications/         # Ngăn kéo thông báo cảnh báo Churn
        │   └── tabs/                  # 6 Tabs chức năng nghiệp vụ (Overview, RFM, DSS, Churn, Admin, Business)
        ├── context/                   # Contexts (AuthContext, ThemeContext, NotificationChatContext)
        ├── services/                  # Axios REST API Client
        └── types/                     # Kiểu dữ liệu TypeScript
```

---

## 🚀 4. Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### Yêu Cầu Môi Trường
* **Python:** `>= 3.10` (Khuyên dùng Python 3.11 – 3.14)
* **Node.js:** `>= 18.0.0` (Khuyên dùng Node.js 20+)

---

### Bước 1: Khởi Tạo Môi Trường & Cài Đặt Backend

Mở terminal tại thư mục gốc dự án `omni-customer-dss`:

```powershell
# 1. Khởi tạo môi trường ảo Python
python -m venv .venv

# 2. Cài đặt các thư viện phụ thuộc
.\.venv\Scripts\pip.exe install -r backend\requirements.txt

# 3. Khởi chạy Server FastAPI REST API
.\.venv\Scripts\python.exe backend\run.py
```

* 🌐 **Swagger UI (Tài liệu API tương tác):** [http://localhost:8000/docs](http://localhost:8000/docs)
* 🌐 **API Status Endpoint:** [http://localhost:8000/](http://localhost:8000/)

---

### Bước 2: Cài Đặt & Khởi Chạy Frontend Dashboard

Mở một **Terminal thứ hai** tại thư mục gốc:

```powershell
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói Node.js (nếu chưa cài)
npm install

# 3. Khởi chạy giao diện nhà phát triển
npm run dev
```

* 💻 **Giao Diện Bảng Điều Khiển Doanh Nghiệp:** [http://localhost:5173](http://localhost:5173)

---

### Bước 3: Khởi Chạy Dashboard Streamlit (Tùy Chọn)

Nếu bạn muốn sử dụng giao diện phân tích đồ thị Python phụ trợ:

```powershell
.\.venv\Scripts\python.exe backend\run_dashboard.py
```

* 📊 **Streamlit UI:** [http://localhost:8501](http://localhost:8501)

---

## 🔌 5. Danh Sách REST API Endpoints

| Nhóm API | Phương Thức | Endpoint | Mô Tả Chức Năng |
| :--- | :---: | :--- | :--- |
| **System** | `GET` | `/` | Kiểm tra trạng thái máy chủ Backend & MongoDB |
| **System** | `GET` | `/api/db/status` | Kiểm tra chi tiết kết nối Cloud MongoDB Atlas |
| **Auth** | `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng / doanh nghiệp mới |
| **Auth** | `POST` | `/api/auth/login` | Xác thực đăng nhập từ Database MongoDB |
| **Auth** | `GET` | `/api/auth/users` | Lấy danh sách tất cả tài khoản người dùng |
| **RFM** | `POST` | `/api/rfm/predict` | Phân cụm khách hàng RFM bằng thuật toán K-Means |
| **Churn** | `POST` | `/api/churn/predict` | Dự đoán xác suất rời bỏ bằng mô hình XGBoost |
| **DSS** | `POST` | `/api/dss/evaluate` | Đánh giá quy tắc DSS cho 1 khách hàng & lưu log |
| **DSS** | `POST` | `/api/dss/evaluate-batch` | Đánh giá quy tắc DSS cho danh sách nhiều khách hàng |
| **DSS** | `GET` | `/api/dss/logs` | Truy vấn lịch sử nhật ký quyết định từ MongoDB |

---

## 📊 6. Kết Quả Thực Nghiệm Machine Learning

| Thuật Toán | Giai Đoạn Huấn Luyện | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | Baseline | 82.35% | 76.40% | 68.20% | 0.7207 | 0.8842 |
| **Decision Tree** | Baseline | 84.10% | 78.50% | 74.30% | 0.7634 | 0.8520 |
| **Random Forest** | GridSearchCV Tuned | 89.80% | 86.45% | 83.10% | 0.8474 | 0.9412 |
| **XGBoost (Đề Xuất)** | **GridSearchCV Tuned** | **91.50%** | **88.20%** | **85.90%** | **0.8703** | **0.9575** |

> 📌 Toàn văn báo cáo khoa học 5 chương với phân tích chi tiết toán học, ma trận nhầm lẫn (Confusion Matrix) và đường cong ROC được lưu tại: [`BAO_CAO_NGHIEN_CUU_KHOA_HOC.md`](file:///c:/Users/votha/omni-customer-dss/BAO_CAO_NGHIEN_CUU_KHOA_HOC.md).

---

## 👥 7. Tác Giả & Bản Quyền

* **Chủ nhiệm đề tài / Tác giả:** Võ Thành Tống
* **Đơn vị:** Nhóm Nghiên Cứu Khoa Học & Phân Tích Dữ Liệu Khách Hàng Đa Kênh
* **Năm thực hiện:** 2026
