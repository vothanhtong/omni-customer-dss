# 📊 Customer Analytics & Decision Support System (DSS) in Multichannel Retail
> **Đề tài Nghiên cứu Khoa học:** *"Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong bán hàng đa kênh"*

---

## 📋 Bảng Đối Chiếu Tuân Thủ 6 Nội Dung Nghiên Cứu (NCKH)

| Nội Dung NCKH Theo Đề Cương | Nội Dung Chi Tiết | Trạng Thái | File Mã Nguồn / Báo Cáo Tương Ứng |
| :--- | :--- | :---: | :--- |
| **Nội dung 1: Khảo sát & Phân tích** | Khảo sát bán hàng đa kênh (POS/Web/TMĐT), 5 thuật toán ML và kiến trúc DSS | **100%** | 📄 [bao_cao_tong_quan_tai_lieu.md](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/bao_cao_tong_quan_tai_lieu.md) |
| **Nội dung 2: Thu thập & Tiền xử lý** | Làm sạch, loại outlier, chuẩn hóa `StandardScaler`, tạo thuộc tính RFM & lưu MongoDB Atlas | **100%** | 🐍 `backend/app/core/train.py`<br>🍃 `backend/app/core/database.py` |
| **Nội dung 3: Mô hình ML & Đánh giá** | K-Means (Elbow $K=4$), LR, DT, RF, XGBoost + Tuning GridSearchCV + 5-Fold Cross Validation | **100%** | 🐍 `backend/app/core/evaluate_ml_experiments.py`<br>📄 [bao_cao_thuc_nghiem_ml.md](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/bao_cao_thuc_nghiem_ml.md) |
| **Nội dung 4: Động cơ DSS Engine** | Luật DSS IF-THEN, cảnh báo 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW và đề xuất chiến lược Marketing | **100%** | 🐍 `backend/app/core/dss_engine.py`<br>🔌 `backend/app/api/dss.py` |
| **Nội dung 5: Trực quan hóa & Hệ thống** | Streamlit Web Dashboard + React TypeScript SPA, biểu đồ Plotly tương tác & nút kích hoạt CSKH | **100%** | 📊 `backend/dashboard/app.py`<br>💻 `frontend/src/` |
| **Nội dung 6: Đánh giá hệ thống** | Đánh giá hiệu năng ML (F1, ROC-AUC) & Đánh giá DSS giảm thời gian ra quyết định (< 5 phút) | **100%** | 📄 [chuong_danh_gia_he_thong_va_ket_luan.md](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/chuong_danh_gia_he_thong_va_ket_luan.md) |

---

## 🌟 Tính Năng Nổi Bật (Key Features)

1. **Phân Cụm Khách Hàng RFM (K-Means + Elbow Method):**
   - Áp dụng phương pháp **Elbow (SSE)** xác định $K=4$ cụm tối ưu: *VIP, Tiềm năng, Cần chăm sóc, Rủi ro*.
2. **Mô Hình Dự Đoán Churn (Machine Learning Ensemble):**
   - So sánh 4 mô hình: *Logistic Regression, Decision Tree, Random Forest (Tuned), XGBoost (Tuned)*.
   - Sử dụng **GridSearchCV** tối ưu siêu tham số và đánh giá qua **5-Fold Cross Validation**.
3. **Động Cơ Quyết Định Nghiệp Vụ (DSS Engine Rules):**
   - Phân cấp cảnh báo rủi ro (🔴 HIGH / 🟡 MEDIUM / 🟢 LOW) và đề xuất kịch bản Marketing cá nhân hóa tự động.
4. **Cơ Sở Dữ Liệu MongoDB Atlas Cloud:**
   - Sử dụng **Async Motor Driver** lưu nhật ký và kết quả dự đoán vào 3 MongoDB Collections (`rfm_predictions`, `churn_predictions`, `dss_logs`).
5. **Giao Diện Đa Nền Tảng (Dual Dashboards):**
   - **Streamlit Dashboard (Python):** Bộ lọc đa kênh, KPI Cards, biểu đồ Plotly tương tác và bảng đề xuất DSS.
   - **React SPA (TypeScript):** Giao diện Dark-mode Glassmorphic hiện đại.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Hierarchy)

```text
Nghiên cứu khoa học dự án/
├── backend/                             # BỘ MÃ NGUỒN BACKEND & DASHBOARD
│   ├── app/
│   │   ├── main.py                      # FastAPI Application entrypoint & CORS setup
│   │   ├── api/                         # REST API Routers (/api/rfm, /api/churn, /api/dss)
│   │   ├── core/                        # Core ML, DSS Engine & MongoDB Database
│   │   │   ├── config.py                # Cấu hình biến môi trường & .env loader
│   │   │   ├── database.py              # Quản lý kết nối Async MongoDB Atlas Driver
│   │   │   ├── dss_engine.py            # Động cơ quy tắc hỗ trợ ra quyết định (DSS Rules)
│   │   │   ├── ml_models.py             # Quản lý nạp & dự đoán mô hình ML
│   │   │   ├── train.py                 # Script huấn luyện K-Means & XGBoost
│   │   │   └── evaluate_ml_experiments.py # Kịch bản thực nghiệm Tuning & 5-Fold CV
│   │   └── schemas/                     # Pydantic Schemas validate dữ liệu vào/ra
│   ├── dashboard/                       # ỨNG DỤNG STREAMLIT WEB DASHBOARD
│   │   └── app.py                       # Dashboard phân tích hành vi bán hàng đa kênh
│   ├── .env                             # Cấu hình chuỗi kết nối MongoDB Atlas Cloud
│   ├── requirements.txt                 # Danh sách thư viện Python phụ thuộc
│   ├── run.py                           # Script khởi chạy FastAPI Server
│   └── run_dashboard.py                 # Script khởi chạy Streamlit Dashboard
│
├── frontend/                            # GIAO DIỆN REACT + TYPESCRIPT WEB APP
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── components/                  # Navbar & Tabs (Overview, RFM, DSS, Alerts)
│       ├── services/api.ts              # Axios REST API Client
│       └── types/customer.ts            # TypeScript Interfaces
│
└── saved_models/                        # File mô hình (.pkl), CSV & Biểu đồ PNG
    └── plots/                           # Biểu đồ Elbow, Confusion Matrix, ROC Curves
```

---

## 🚀 Hướng Dẫn Khởi Chạy Hệ Thống (Quick Start Guide)

### 1. Khởi Chạy Streamlit Web Dashboard (Giao Diện DSS Bán Hàng Đa Kênh)
```bash
python3 backend/run_dashboard.py
```
> 📊 **Streamlit Dashboard UI:** `http://localhost:8501`

---

### 2. Khởi Chạy FastAPI REST API Server (Backend)
```bash
python3 backend/run.py
```
> 🌐 **FastAPI REST API:** `http://localhost:8000`  
> 📑 **Swagger API Docs:** `http://localhost:8000/docs`

---

### 3. Khởi Chạy React Web App (Frontend)
```bash
cd frontend
npm install
npm run dev
```
> 💻 **React Web App:** `http://localhost:5173`

---

### 4. Chạy Kịch Bản Thực Nghiệm Huấn Luyện & Tuning ML
```bash
python3 -m backend.app.core.evaluate_ml_experiments
```
> 📈 Kịch bản sẽ tự động chạy GridSearchCV, đánh giá 5-Fold Cross Validation và xuất các biểu đồ PNG vào `backend/saved_models/plots/`.

---

## 🔌 Danh Sách REST API Endpoints

| Phương Thức | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `GET` | `/` | Health check trạng thái hoạt động & MongoDB Atlas Status |
| `GET` | `/api/db/status` | Kiểm tra chi tiết kết nối MongoDB Atlas Cloud |
| `GET` | `/api/dss/logs` | Truy vấn danh sách nhật ký DSS từ MongoDB Cloud |
| `POST` | `/api/rfm/predict` | Phân cụm khách hàng RFM bằng K-Means & lưu MongoDB |
| `POST` | `/api/churn/predict` | Dự đoán xác suất Churn bằng XGBoost & lưu MongoDB |
| `POST` | `/api/dss/evaluate` | Đánh giá quy tắc DSS & lưu log vào MongoDB |
| `POST` | `/api/dss/evaluate-batch` | Đánh giá quy tắc DSS hàng loạt & lưu MongoDB |

---

## 📄 Danh Sách Báo Cáo NCKH Đi Kèm (Research Artifacts)

1. **[Báo cáo Tổng quan tài liệu (bao_cao_tong_quan_tai_lieu.md)](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/bao_cao_tong_quan_tai_lieu.md):** Tổng quan đa kênh, khảo sát 5 thuật toán ML và kiến trúc DSS.
2. **[Báo cáo Thực nghiệm ML (bao_cao_thuc_nghiem_ml.md)](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/bao_cao_thuc_nghiem_ml.md):** Kịch bản thực nghiệm, Elbow method, GridSearchCV, bảng so sánh 5-Fold CV và biểu đồ.
3. **[Chương Đánh giá Hệ thống & Kết luận (chuong_danh_gia_he_thong_va_ket_luan.md)](file:///Users/vothanhtong/.gemini/antigravity-ide/brain/428136ca-c1f4-4c84-935a-4ad0f5f4ec9e/chuong_danh_gia_he_thong_va_ket_luan.md):** Chương đánh giá hiệu quả ML, hệ DSS và hướng phát triển tương lai.
