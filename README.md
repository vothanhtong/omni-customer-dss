# 📊 Omni Customer DSS & Analytics Platform
> **Đề tài Nghiên cứu Khoa học:** *"Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong môi trường bán hàng đa kênh (Omnichannel Retail DSS)"*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![XGBoost](https://img.shields.io/badge/Models-LR%20%7C%20DT%20%7C%20RF%20%7C%20XGBoost-EB5424?style=flat&logo=scikit-learn&logoColor=white)](https://xgboost.readthedocs.io)

---

## 📖 1. Tổng Quan Hệ Thống

**Omni Customer DSS** là nền tảng **Hỗ trợ ra Quyết định (Decision Support System - DSS)** toàn diện cho doanh nghiệp bán lẻ đa kênh (POS Cửa hàng, Website E-commerce, Sàn TMĐT Shopee/Lazada). Hệ thống kết hợp giữa **Khoa học Dữ liệu (Machine Learning)** và **Động cơ Quy tắc Nghiệp vụ Đa Tầng (Rule-based Engine)** nhằm nhận diện phân khúc khách hàng, dự đoán sớm nguy cơ rời bỏ (Churn Risk) và tự động đề xuất các chiến lược Marketing giữ chân cá nhân hóa theo thời gian thực.

---

## 🌟 2. Tính Năng Cốt Lõi (Key Features)

### 🎨 Giao Diện Doanh Nghiệp (Adminator Imperial Design)
* **Bảng Điều Khiển Dashboard Toàn Diện:**
  * **4 KPI Cards Adminator:** Theo dõi Tổng doanh thu (`Total visits`), Lượt tương tác (`Page views`), Khách hàng duy nhất (`Unique visitors`) và Tỷ lệ rời bỏ (`Bounce rate / Churn rate`).
  * **Phân Bổ Kênh Bán Hàng & Địa Lý:** 4 Progress Bars trực quan (`POS Store`, `Website`, `Sàn TMĐT`, `Kênh Khác`).
  * **3 Vòng Tròn Chỉ Số SVG Donut:** `75% New users`, `50% Retain purchases`, `Bounce rate`.
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
   * K-Means $K=4$ (kèm Elbow/SSE & Silhouette) trên dữ liệu RFM thật; nhãn **VIP**, **Tiềm năng**, **Cần chăm sóc**, **Rủi ro** được gán theo điểm tổng hợp R/F/M của tâm cụm.
2. **Dự Đoán Rủi Ro Rời Bỏ Churn (so sánh 4 mô hình):**
   * Logistic Regression, Decision Tree, Random Forest, XGBoost — tối ưu bằng **GridSearchCV 5-fold** trên tập train và kiểm định **out-of-time**; kết quả thực tế xem Mục 6.
3. **Động Cơ Luật Ra Quyết Định Đa Tầng (Rule-based DSS Engine):**
   * Bảng luật có trọng số ưu tiên (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`): mức cảnh báo = mức cao nhất trong các luật khớp; nhóm **Rủi ro** tối thiểu `MEDIUM`.
   * 10 luật đề xuất kịch bản Marketing cá nhân hóa: Voucher 10–20%, Freeship, win-back, Tri ân VIP, Tích điểm kép.
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

# 3. Huấn luyện mô hình từ Cleaned_data/ (sinh saved_models/*.pkl & model_metrics.json)
.\.venv\Scripts\python.exe backend\train_pipeline.py

# 4. (Tuỳ chọn) Chạy unit test
.\.venv\Scripts\pip.exe install -r backend\requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest backend\tests -q

# 5. Khởi chạy Server FastAPI REST API
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
| **Churn** | `POST` | `/api/churn/predict` | Dự đoán xác suất rời bỏ bằng mô hình tốt nhất (xem `/api/metrics`) |
| **DSS** | `POST` | `/api/dss/evaluate` | Đánh giá quy tắc DSS cho 1 khách hàng & lưu log |
| **DSS** | `POST` | `/api/dss/evaluate-batch` | Đánh giá quy tắc DSS cho danh sách nhiều khách hàng |
| **DSS** | `GET` | `/api/dss/logs` | Truy vấn lịch sử nhật ký quyết định từ MongoDB |

---

## 📊 6. Kết Quả Thực Nghiệm Machine Learning

> Sinh tự động bởi `python backend/train_pipeline.py` (chi tiết đầy đủ: `backend/saved_models/model_metrics.json`, API `GET /api/metrics`).
> Dữ liệu: đơn hàng đa kênh thực tế 06–11/2022 (`Cleaned_data/`). Churn out-of-time: train **10,893** KH, test **2,724** KH;
> `target = 1` nếu khách **không** phát sinh đơn mới trong cửa sổ kết quả **8.6 ngày** sau mốc cutoff.
> Tỷ lệ churn test = **96.22%** → baseline đoán toàn bộ "churn" đạt accuracy 0.9622, vì vậy ROC-AUC / Balanced Accuracy / Recall lớp "quay lại" mới là thước đo có ý nghĩa.

| Mô hình | CV ROC-AUC (train, 5-fold) | Accuracy | Bal. Acc | Precision | Recall | F1 | ROC-AUC (test) | Recall lớp quay lại |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (được chọn)** | 0.6576 ± 0.0206 | 0.6050 | 0.6175 | 0.9766 | 0.6040 | 0.7463 | **0.6362** | 0.6311 |
| Decision Tree | 0.6199 ± 0.0161 | 0.6949 | 0.5990 | 0.9725 | 0.7028 | 0.8159 | 0.6000 | 0.4951 |
| Random Forest | 0.6413 ± 0.0270 | 0.7221 | 0.5991 | 0.9721 | 0.7322 | 0.8353 | 0.6229 | 0.4660 |
| XGBoost | 0.6394 ± 0.0254 | 0.6825 | 0.6111 | 0.9741 | 0.6883 | 0.8066 | 0.6253 | 0.5340 |

Mô hình được chọn theo CV ROC-AUC trên tập train (không nhìn tập test), ngưỡng quyết định 0.5. Các mô hình dùng `class_weight='balanced'` / `scale_pos_weight` nên xác suất đầu ra **chưa được hiệu chỉnh (calibrated)**.

**RFM K-Means (K=4)** trên 19,100 khách hàng, gán nhãn theo điểm tổng hợp tâm cụm `-R + log F + log M` (đã chuẩn hóa):

| Phân khúc | Số KH | Tỷ lệ | R TB (ngày) | F TB | M TB (VNĐ) |
| :--- | ---: | ---: | ---: | ---: | ---: |
| VIP | 1,791 | 9.4% | 11.4 | 2.2 | 527,003 |
| Tiềm năng | 7,394 | 38.7% | 10.4 | 1.0 | 313,111 |
| Cần chăm sóc | 6,052 | 31.7% | 26.6 | 1.0 | 315,104 |
| Rủi ro | 3,863 | 20.2% | 11.1 | 1.0 | 0 |

> 📌 Toàn văn báo cáo khoa học 5 chương với phân tích chi tiết toán học, ma trận nhầm lẫn (Confusion Matrix) và đường cong ROC được lưu tại: [`BAO_CAO_NGHIEN_CUU_KHOA_HOC.md`](file:///c:/Users/votha/omni-customer-dss/BAO_CAO_NGHIEN_CUU_KHOA_HOC.md).

---

## 👥 7. Thông Tin Đề Tài & Nhóm Nghiên Cứu (NCKH Sinh Viên)

* **Tên đề tài:** *"Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong bán hàng đa kênh"*
* **Đơn vị chủ trì:** Khoa Công nghệ thông tin – Trường Đại học Nha Trang *(Trưởng đơn vị: TS. Phạm Thị Thu Thúy)*
* **Thời gian thực hiện:** 13 tháng (07/2026 – 07/2027)
* **Cán bộ hướng dẫn khoa học:** **ThS. Nguyễn Thị Hương Lý** *(Giảng viên Khoa CNTT – ĐH Nha Trang)*
* **Thành viên nhóm nghiên cứu sinh viên:**
  1. 👑 **Hoàng Lê Thảo Nhi** – *Chủ nhiệm đề tài* (Lớp: 66.TTQL-1, Khoa CNTT, ĐH Nha Trang)
  2. 💻 **Võ Hoài Buýt** – *Thành viên chính nghiên cứu* (Lớp: 65.TTQL-2, Khoa CNTT, ĐH Nha Trang)
  3. 💻 **Võ Thanh Tòng** – *Thành viên chính nghiên cứu* (Lớp: 65.TTQL-2, Khoa CNTT, ĐH Nha Trang)

> 📑 Xem toàn văn Thuyết minh đề tài NCKH tại: [`docs/THUYET_MINH_DE_TAI_NCKH.md`](file:///c:/Users/votha/omni-customer-dss/docs/THUYET_MINH_DE_TAI_NCKH.md) hoặc trực tiếp tại Tab **Thuyết Minh NCKH** trên Web Dashboard.
