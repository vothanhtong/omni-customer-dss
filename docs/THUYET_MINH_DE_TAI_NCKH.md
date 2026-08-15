# BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG ĐẠI HỌC NHA TRANG
## KHOA CÔNG NGHỆ THÔNG TIN

---

# THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC CỦA SINH VIÊN

---

## 1. THÔNG TIN CHUNG VỀ ĐỀ TÀI

* **Tên đề tài:** Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong bán hàng đa kênh *(Omnichannel Customer Decision Support System - Omni Customer DSS)*
* **Lĩnh vực nghiên cứu:** Khoa học kỹ thuật và công nghệ (☒)
* **Loại hình nghiên cứu:** Ứng dụng (☒)
* **Thời gian thực hiện:** 13 tháng (Từ tháng 07/2026 đến tháng 07/2027)
* **Đơn vị chủ trì đề tài:** Khoa Công nghệ thông tin - Trường Đại học Nha Trang
  * *Điện thoại:* 0901905679 | *Email:* kcntt@ntu.edu.vn
  * *Trưởng đơn vị:* **TS. Phạm Thị Thu Thúy**
* **Cán bộ hướng dẫn khoa học:**
  * *Họ và tên:* **ThS. Nguyễn Thị Hương Lý**
  * *Chức danh khoa học:* Giảng viên | *Học vị:* Thạc sĩ
  * *Điện thoại:* 0966883889 | *Email:* lynth@ntu.edu.vn
  * *Địa chỉ:* 33 hẻm 1, Nguyễn Chích, P. Vĩnh Hòa, TP. Nha Trang, Tỉnh Khánh Hòa

---

## 2. DANH SÁCH THÀNH VIÊN THỰC HIỆN ĐỀ TÀI

| STT | Họ và Tên | Lớp & Đơn Vị | Vai Trò | Nhiệm Vụ Nghiên Cứu Cụ Thể |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Hoàng Lê Thảo Nhi** | 66.TTQL-1, Khoa CNTT, ĐH Nha Trang<br>SĐT: 0857300027<br>Email: nhi.hlt.66ttql@ntu.edu.vn | **Chủ nhiệm đề tài** | • **Thành viên chính:** Công việc 1.2, 2.5, 3.3, 3.5, 3.6, 4.1, 4.3, 4.4, 5.1, 5.4.<br>• **Quản lý chung:** Xây dựng thuyết minh, viết bài báo Hội thảo, báo cáo tổng kết, nghiệm thu kinh phí. |
| **2** | **Võ Hoài Buýt** | 65.TTQL-2, Khoa CNTT, ĐH Nha Trang | **Thành viên chính nghiên cứu** | • **Thành viên chính:** Công việc 1.4, 2.2, 2.4, 3.2, 4.2, 5.2, 5.3, 6.1.<br>• **Thành viên nghiên cứu:** Công việc 1.3, 3.4, 4.3, 4.4, 5.4. |
| **3** | **Võ Thanh Tòng** | 65.TTQL-2, Khoa CNTT, ĐH Nha Trang | **Thành viên chính nghiên cứu** | • **Thành viên chính:** Công việc 1.1, 1.3, 2.1, 2.3, 3.1, 3.4, 6.2.<br>• **Thành viên nghiên cứu:** Công việc 2.2, 4.3, 4.4, 5.1, 5.2, 5.4. |

---

## 3. TỔNG QUAN TÌNH HÌNH NGHIÊN CỨU THUỘC LĨNH VỰC ĐỀ TÀI

### 3.1. Tình hình nghiên cứu ngoài nước
* **Thực tế:** Chuyển đổi số bán lẻ đa kênh phát triển mạnh mẽ khiến dữ liệu khách hàng phân tán trên nhiều kênh (Website, Mobile App, POS, Mạng xã hội). Báo cáo của McKinsey (2021) nhấn mạnh vai trò quyết định của dữ liệu trong việc giữ chân khách hàng.
* **Nghiên cứu khoa học:**
  1. *Chen, Cheung & Tan (2018):* Thách thức và cơ hội trong nghiên cứu kinh doanh đa kênh (Omnichannel).
  2. *Mirsch, Lehrer & Jung (2016):* Tích hợp kênh trong quản lý bán lẻ đa kênh.
  3. *Han, Kamber & Pei (2011):* Khai phá dữ liệu ứng dụng trong phân tích hành vi người tiêu dùng.
  4. *Lundberg & Lee (2017):* Phương pháp giải thích mô hình SHAP trong học máy.
  5. *Chen, Chiang & Storey (2012):* Hệ thống phân tích thông minh và Business Analytics trong hỗ trợ ra quyết định.
* **Khoảng trống nghiên cứu:** Các nghiên cứu hiện tại thường tiếp cận riêng lẻ từng khía cạnh (chỉ phân tích hành vi hoặc chỉ xây dựng mô hình dự đoán rời rạc). Việc tích hợp toàn diện các mô hình học máy vào một hệ thống DSS hoàn chỉnh cho bán hàng đa kênh vẫn còn hạn chế.

### 3.2. Tình hình nghiên cứu trong nước
* **Thực tế tại Việt Nam:** Thị trường TMĐT và bán lẻ đa kênh tăng trưởng nhanh (Báo cáo Bộ Công Thương 2025, Decision Lab 2025). Tuy nhiên, khai thác dữ liệu để ra quyết định giữ chân khách hàng vẫn còn nhiều rào cản do dữ liệu phân mảnh.
* **Nghiên cứu khoa học:**
  1. *Bùi Thanh Tráng & Hồ Xuân Tiến (2019):* Hành vi mua sắm trực tuyến của người tiêu dùng Việt Nam.
  2. *Phạm Thị Liên et al. (2022):* Phân tích và gán nhãn dữ liệu khách hàng trong CRM.
  3. *Nguyễn Thị Khanh Chi (2022):* Tác động của CRM dựa trên công nghệ đến đổi mới Marketing.
  4. *Trần Thị Mai & Nguyễn Quỳnh Hoa (2025):* Ứng dụng RFM và K-Means phân khúc khách hàng bán lẻ.
  5. *Nguyễn Thanh Sơn (2025):* Tác động của truyền thông mạng xã hội đến quyết định mua hàng.

---

## 4. TÍNH CẤP THIẾT & MỤC TIÊU CỦA ĐỀ TÀI

### 4.1. Tính cấp thiết
Trong bối cảnh dữ liệu khách hàng đa kênh phân tán, việc ra quyết định thủ công mang tính cảm tính gây tổn thất doanh thu và mất khách hàng VIP. Xây dựng một hệ thống DSS tích hợp dữ liệu đa nguồn kết hợp khai phá dữ liệu và Machine Learning là giải pháp công nghệ tất yếu và cấp thiết.

### 4.2. Mục tiêu nghiên cứu
1. Thu thập, làm sạch và chuẩn hóa dữ liệu khách hàng từ hệ thống POS, Website E-commerce và Sàn TMĐT.
2. Phân tích hành vi tiêu dùng và phân cụm khách hàng thông minh bằng **K-Means RFM ($K=4$)**.
3. Xây dựng mô hình học máy **XGBoost Classifier** dự báo rủi ro rời bỏ khách hàng (Churn Risk) đạt độ chính xác cao ($\ge 90\%$).
4. Phát triển động cơ luật ra quyết định **Rule-based DSS Engine** tự động đề xuất 5 kịch bản tiếp thị giữ chân khách hàng cá nhân hóa theo thời gian thực.
5. Thiết kế và triển khai bảng điều khiển tương tác trực quan (**Adminator Enterprise Cockpit**) hỗ trợ nhà quản trị ra quyết định tức thì.

---

## 5. NỘI DUNG NGHIÊN CỨU & TIẾN ĐỘ THỰC HIỆN CHI TIẾT (13 THÁNG)

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ NỘI DUNG 1: Phân tích bài toán & Khảo sát phương pháp        (07/2026 - 09/2026)│
│ NỘI DUNG 2: Thu thập & Tiền xử lý dữ liệu đa kênh             (08/2026 - 11/2026)│
│ NỘI DUNG 3: Xây dựng & Đánh giá mô hình dự đoán học máy       (11/2026 - 02/2027)│
│ NỘI DUNG 4: Xây dựng hệ hỗ trợ ra quyết định (DSS Engine)     (02/2027 - 04/2027)│
│ NỘI DUNG 5: Xây dựng hệ thống & Bảng điều khiển trực quan    (04/2027 - 05/2027)│
│ NỘI DUNG 6: Đánh giá hệ thống & Viết báo cáo tổng kết         (05/2027 - 07/2027)│
└───────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết 18 công việc thành phần:

| Mã CV | Nội Dung Công Việc Nghiên Cứu | Sản Phẩm Đầu Ra | Thời Gian | Người Thực Hiện Chính |
| :---: | :--- | :--- | :---: | :--- |
| **CV 1.1** | Tìm hiểu mô hình bán hàng đa kênh & hành vi khách hàng số | Báo cáo tổng quan bài toán | 07/2026 - 08/2026 | **Võ Thanh Tòng** |
| **CV 1.2** | Khảo sát các thuật toán ML (Logistic, DT, RF, XGBoost, K-Means) | Báo cáo khảo sát phương pháp | 07/2026 - 08/2026 | **Hoàng Lê Thảo Nhi** |
| **CV 1.3** | Nghiên cứu phương pháp khai phá dữ liệu & học máy | Báo cáo quy trình phân tích | 07/2026 - 08/2026 | **Võ Thanh Tòng**, Võ Hoài Buýt |
| **CV 1.4** | Khảo sát hệ hỗ trợ ra quyết định (DSS) và Analytics thông minh | Báo cáo tổng hợp hệ DSS | 08/2026 - 09/2026 | **Võ Hoài Buýt** |
| **CV 2.1** | Thu thập & tổng hợp dữ liệu khách hàng từ POS, Web, TMĐT | Bộ dữ liệu thô đa nguồn | 08/2026 - 10/2026 | **Võ Thanh Tòng** |
| **CV 2.2** | Làm sạch dữ liệu (xử lý missing data, nhiễu, outlier) | Bộ dữ liệu sạch chuẩn hóa | 08/2026 - 10/2026 | **Võ Hoài Buýt**, Võ Thanh Tòng |
| **CV 2.3** | Chuẩn hóa & đồng bộ dữ liệu giữa các kênh | Bộ dữ liệu đã chuẩn hóa | 10/2026 - 11/2026 | **Võ Thanh Tòng** |
| **CV 2.4** | Xây dựng đặc trưng (Feature Engineering) cho mô hình | Dataset hoàn chỉnh | 10/2026 - 11/2026 | **Võ Hoài Buýt** |
| **CV 2.5** | Chia tập dữ liệu Train / Test phục vụ huấn luyện và đánh giá | Dataset huấn luyện & kiểm thử | 10/2026 - 11/2026 | **Hoàng Lê Thảo Nhi** |
| **CV 3.1** | Xây dựng mô hình cơ bản (Logistic Regression, Decision Tree) | Mô hình cơ bản baseline | 11/2026 - 12/2026 | **Võ Thanh Tòng** |
| **CV 3.2** | Xây dựng mô hình học máy nâng cao (Random Forest, XGBoost) | Mô hình nâng cao | 12/2026 - 01/2027 | **Võ Hoài Buýt** |
| **CV 3.3** | Áp dụng thuật toán K-Means phân khúc khách hàng RFM | Kết quả 4 cụm phân khúc | 12/2026 - 01/2027 | **Hoàng Lê Thảo Nhi** |
| **CV 3.4** | Tuning và tối ưu hóa siêu tham số mô hình | Mô hình tối ưu hóa | 01/2027 - 02/2027 | **Võ Thanh Tòng**, Võ Hoài Buýt |
| **CV 3.5** | Đánh giá mô hình bằng các chỉ số (Accuracy, Precision, Recall, F1) | Báo cáo đánh giá mô hình | 01/2027 - 02/2027 | **Hoàng Lê Thảo Nhi** |
| **CV 3.6** | So sánh đối chiếu và lựa chọn mô hình tối ưu nhất | Mô hình tốt nhất (XGBoost) | 01/2027 - 02/2027 | **Hoàng Lê Thảo Nhi** |
| **CV 4.1** | Xây dựng tiêu chí & bộ luật hỗ trợ ra quyết định DSS | Bộ luật và tiêu chí DSS | 02/2027 - 03/2027 | **Hoàng Lê Thảo Nhi** |
| **CV 4.2** | Phát triển chức năng dự đoán hành vi khách hàng (Churn, xu hướng) | Module dự đoán tích hợp | 02/2027 - 03/2027 | **Võ Hoài Buýt** |
| **CV 4.3** | Đề xuất các chiến lược Marketing & CSKH cá nhân hóa | Bộ gợi ý quyết định (5 kịch bản) | 03/2027 - 04/2027 | **Hoàng Lê Thảo Nhi**, Tòng, Buýt |
| **CV 4.4** | Xây dựng cơ chế cảnh báo sớm nguy cơ rời bỏ | Module cảnh báo tự động | 03/2027 - 04/2027 | **Hoàng Lê Thảo Nhi**, Tòng, Buýt |
| **CV 5.1** | Thiết kế kiến trúc hệ thống tổng thể 3 tầng | Sơ đồ kiến trúc hệ thống | 04/2027 - 05/2027 | **Hoàng Lê Thảo Nhi**, Võ Thanh Tòng |
| **CV 5.2** | Xây dựng giao diện bảng điều khiển trực quan (Dashboard) | Bảng điều khiển trực quan | 04/2027 - 05/2027 | **Võ Hoài Buýt**, Võ Thanh Tòng |
| **CV 5.3** | Trực quan hóa dữ liệu (hành vi, phân khúc, dự đoán Churn) | Bộ biểu đồ và báo cáo | 04/2027 - 05/2027 | **Võ Hoài Buýt** |
| **CV 5.4** | Tích hợp hệ hỗ trợ ra quyết định vào Bảng điều khiển Cockpit | Hệ thống DSS hoàn chỉnh | 04/2027 - 05/2027 | **Hoàng Lê Thảo Nhi**, Tòng, Buýt |
| **CV 6.1** | Đánh giá hiệu quả mô hình dự đoán trong môi trường thực nghiệm | Báo cáo đánh giá mô hình | 05/2027 - 07/2027 | **Võ Hoài Buýt** |
| **CV 6.2** | Đánh giá hiệu quả hỗ trợ ra quyết định của hệ thống DSS | Báo cáo đánh giá hệ DSS | 05/2027 - 07/2027 | **Võ Thanh Tòng** |
| **CV 7** | Viết báo cáo tổng kết đề tài NCKH | Báo cáo tổng kết hoàn chỉnh | 02/2027 - 07/2027 | **Hoàng Lê Thảo Nhi** |
| **CV 8** | Viết bài báo cáo tại Hội thảo khoa học | 01 Bài báo khoa học cấp Khoa trở lên | 02/2027 - 07/2027 | Nhóm nghiên cứu & GVHD |
| **CV 9** | Nghiệm thu và quyết toán kinh phí đề tài | Báo cáo nghiệm thu Hội đồng | 07/2027 | **Hoàng Lê Thảo Nhi** |

---

## 6. SẢN PHẨM DỰ KIẾN CỦA ĐỀ TÀI

1. **Phần mềm Hệ thống DSS:** Hệ thống hỗ trợ ra quyết định phân tích & dự đoán hành vi khách hàng trong bán hàng đa kênh *(FastAPI, Scikit-Learn, XGBoost, MongoDB Atlas, React Vite)*.
2. **Bảng tổng hợp & Trực quan hóa:** Giao diện Dashboard Cockpit tương tác thời gian thực, trực quan hóa phân cụm RFM và cảnh báo Churn.
3. **Tài liệu hướng dẫn sử dụng hệ thống:** Hướng dẫn vận hành đầy đủ các chức năng phân tích và ra quyết định.
4. **Bài báo khoa học:** 01 bài báo cáo tại Hội thảo Khoa học cấp Khoa trở lên.
5. **Báo cáo tổng kết đề tài:** Báo cáo nghiệm thu khoa học đầy đủ theo quy định của Trường Đại học Nha Trang.

---

## 7. ĐỊA CHỈ ỨNG DỤNG & CHUYỂN GIAO KẾT QUẢ

* **Địa chỉ ứng dụng:** Khoa Công nghệ Thông tin, Trường Đại học Nha Trang.
* **Khả năng ứng dụng thực tiễn:** Triển khai thử nghiệm cho các doanh nghiệp, chuỗi cửa hàng bán lẻ và thương mại điện tử đa kênh tại Việt Nam.
