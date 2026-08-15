import React, { useState } from 'react';
import {
  FileText,
  GraduationCap,
  Users,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Layers,
  BrainCircuit,
  PieChart,
  ShieldCheck,
  Award,
  Download,
  BookOpen,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface TaskItem {
  id: string;
  phaseId: number;
  phaseName: string;
  code: string;
  name: string;
  deliverable: string;
  timeline: string;
  assignees: { name: string; role: 'lead' | 'support' }[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  linkedFeature?: string;
}

const RESEARCH_TASKS: TaskItem[] = [
  // Nội dung 1
  { id: 't1_1', phaseId: 1, phaseName: 'Nội dung 1: Khảo sát & Phân tích', code: 'CV 1.1', name: 'Tìm hiểu mô hình bán hàng đa kênh & đặc điểm hành vi khách hàng', deliverable: 'Báo cáo tổng quan bài toán', timeline: '07/2026 - 08/2026', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }], status: 'COMPLETED' },
  { id: 't1_2', phaseId: 1, phaseName: 'Nội dung 1: Khảo sát & Phân tích', code: 'CV 1.2', name: 'Khảo sát các phương pháp ML (Logistic, DT, RF, XGBoost, K-Means)', deliverable: 'Báo cáo khảo sát phương pháp', timeline: '07/2026 - 08/2026', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED' },
  { id: 't1_3', phaseId: 1, phaseName: 'Nội dung 1: Khảo sát & Phân tích', code: 'CV 1.3', name: 'Nghiên cứu phương pháp khai phá dữ liệu & học máy', deliverable: 'Báo cáo quy trình phân tích', timeline: '07/2026 - 08/2026', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'COMPLETED' },
  { id: 't1_4', phaseId: 1, phaseName: 'Nội dung 1: Khảo sát & Phân tích', code: 'CV 1.4', name: 'Khảo sát các hệ hỗ trợ ra quyết định (DSS) và Analytics', deliverable: 'Báo cáo tổng hợp hệ DSS', timeline: '08/2026 - 09/2026', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED' },

  // Nội dung 2
  { id: 't2_1', phaseId: 2, phaseName: 'Nội dung 2: Thu thập & Tiền xử lý', code: 'CV 2.1', name: 'Thu thập & tổng hợp dữ liệu khách hàng từ POS, Web, TMĐT', deliverable: 'Bộ dữ liệu thô đa nguồn', timeline: '08/2026 - 10/2026', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }], status: 'COMPLETED', linkedFeature: 'MongoDB Atlas Ingestion' },
  { id: 't2_2', phaseId: 2, phaseName: 'Nội dung 2: Thu thập & Tiền xử lý', code: 'CV 2.2', name: 'Làm sạch dữ liệu (xử lý thiếu dữ liệu, nhiễu, outlier)', deliverable: 'Bộ dữ liệu sạch chuẩn hóa', timeline: '08/2026 - 10/2026', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }], status: 'COMPLETED' },
  { id: 't2_3', phaseId: 2, phaseName: 'Nội dung 2: Thu thập & Tiền xử lý', code: 'CV 2.3', name: 'Chuẩn hóa và đồng bộ dữ liệu giữa các kênh', deliverable: 'Bộ dữ liệu đã chuẩn hóa', timeline: '10/2026 - 11/2026', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }], status: 'COMPLETED' },
  { id: 't2_4', phaseId: 2, phaseName: 'Nội dung 2: Thu thập & Tiền xử lý', code: 'CV 2.4', name: 'Xây dựng đặc trưng (Feature Engineering) cho mô hình', deliverable: 'Dataset hoàn chỉnh', timeline: '10/2026 - 11/2026', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED' },
  { id: 't2_5', phaseId: 2, phaseName: 'Nội dung 2: Thu thập & Tiền xử lý', code: 'CV 2.5', name: 'Chia tập dữ liệu (train/test) phục vụ huấn luyện và đánh giá', deliverable: 'Dataset train & test', timeline: '10/2026 - 11/2026', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED' },

  // Nội dung 3
  { id: 't3_1', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.1', name: 'Xây dựng các mô hình cơ bản (Logistic Regression, Decision Tree)', deliverable: 'Mô hình cơ bản baseline', timeline: '11/2026 - 12/2026', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }], status: 'COMPLETED' },
  { id: 't3_2', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.2', name: 'Xây dựng các mô hình học máy nâng cao (Random Forest, XGBoost)', deliverable: 'Mô hình nâng cao', timeline: '12/2026 - 01/2027', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED', linkedFeature: 'XGBoost Churn Prediction' },
  { id: 't3_3', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.3', name: 'Áp dụng K-Means để phân khúc khách hàng (RFM Clustering)', deliverable: 'Kết quả 4 cụm RFM', timeline: '12/2026 - 01/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED', linkedFeature: 'RFM Segmentation' },
  { id: 't3_4', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.4', name: 'Tuning và tối ưu siêu tham số mô hình (Optuna)', deliverable: 'Mô hình tối ưu', timeline: '01/2027 - 02/2027', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'COMPLETED' },
  { id: 't3_5', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.5', name: 'Đánh giá mô hình bằng các chỉ số (Accuracy, Precision, Recall, F1)', deliverable: 'Báo cáo đánh giá mô hình', timeline: '01/2027 - 02/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED' },
  { id: 't3_6', phaseId: 3, phaseName: 'Nội dung 3: Mô hình ML & Phân cụm', code: 'CV 3.6', name: 'So sánh và lựa chọn mô hình tối ưu nhất (XGBoost 91.50%)', deliverable: 'Mô hình tốt nhất', timeline: '01/2027 - 02/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED' },

  // Nội dung 4
  { id: 't4_1', phaseId: 4, phaseName: 'Nội dung 4: Động cơ DSS & Cảnh báo', code: 'CV 4.1', name: 'Xây dựng các tiêu chí và luật hỗ trợ ra quyết định DSS', deliverable: 'Bộ luật và tiêu chí DSS', timeline: '02/2027 - 03/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'COMPLETED', linkedFeature: 'Rule-based DSS Engine' },
  { id: 't4_2', phaseId: 4, phaseName: 'Nội dung 4: Động cơ DSS & Cảnh báo', code: 'CV 4.2', name: 'Phát triển chức năng dự đoán hành vi khách hàng (Churn & Xu hướng)', deliverable: 'Module dự đoán tích hợp', timeline: '02/2027 - 03/2027', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED' },
  { id: 't4_3', phaseId: 4, phaseName: 'Nội dung 4: Động cơ DSS & Cảnh báo', code: 'CV 4.3', name: 'Đề xuất 5 chiến lược Marketing và chăm sóc khách hàng cá nhân hóa', deliverable: 'Bộ gợi ý quyết định', timeline: '03/2027 - 04/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'COMPLETED' },
  { id: 't4_4', phaseId: 4, phaseName: 'Nội dung 4: Động cơ DSS & Cảnh báo', code: 'CV 4.4', name: 'Xây dựng cơ chế cảnh báo (Khách hàng có nguy cơ rời bỏ, VIP)', deliverable: 'Module cảnh báo tự động', timeline: '03/2027 - 04/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'COMPLETED', linkedFeature: 'High Risk Alerts' },

  // Nội dung 5
  { id: 't5_1', phaseId: 5, phaseName: 'Nội dung 5: Xây dựng Dashboard & Hệ thống', code: 'CV 5.1', name: 'Thiết kế kiến trúc hệ thống tổng thể 3 tầng', deliverable: 'Sơ đồ kiến trúc hệ thống', timeline: '04/2027 - 05/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }], status: 'COMPLETED' },
  { id: 't5_2', phaseId: 5, phaseName: 'Nội dung 5: Xây dựng Dashboard & Hệ thống', code: 'CV 5.2', name: 'Xây dựng giao diện bảng điều khiển trực quan (Cockpit Dashboard)', deliverable: 'Giao diện Dashboard', timeline: '04/2027 - 05/2027', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }], status: 'COMPLETED', linkedFeature: 'Adminator Dashboard' },
  { id: 't5_3', phaseId: 5, phaseName: 'Nội dung 5: Xây dựng Dashboard & Hệ thống', code: 'CV 5.3', name: 'Trực quan hóa dữ liệu (hành vi khách hàng, phân khúc, dự đoán)', deliverable: 'Bộ biểu đồ trực quan', timeline: '04/2027 - 05/2027', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED' },
  { id: 't5_4', phaseId: 5, phaseName: 'Nội dung 5: Xây dựng Dashboard & Hệ thống', code: 'CV 5.4', name: 'Tích hợp hệ DSS vào bảng tổng hợp nhằm hỗ trợ phân tích và ra quyết định', deliverable: 'Hệ thống DSS hoàn chỉnh', timeline: '04/2027 - 05/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'COMPLETED' },

  // Nội dung 6 & Báo cáo
  { id: 't6_1', phaseId: 6, phaseName: 'Nội dung 6: Đánh giá & Báo cáo', code: 'CV 6.1', name: 'Đánh giá hiệu quả mô hình dự đoán trong môi trường thực tế', deliverable: 'Báo cáo đánh giá mô hình', timeline: '05/2027 - 07/2027', assignees: [{ name: 'Võ Hoài Buýt', role: 'lead' }], status: 'COMPLETED' },
  { id: 't6_2', phaseId: 6, phaseName: 'Nội dung 6: Đánh giá & Báo cáo', code: 'CV 6.2', name: 'Đánh giá hiệu quả hệ thống DSS trong hỗ trợ ra quyết định doanh nghiệp', deliverable: 'Báo cáo đánh giá hệ thống', timeline: '05/2027 - 07/2027', assignees: [{ name: 'Võ Thanh Tòng', role: 'lead' }], status: 'COMPLETED' },
  { id: 't7', phaseId: 6, phaseName: 'Nội dung 6: Đánh giá & Báo cáo', code: 'CV 7.0', name: 'Viết báo cáo tổng kết đề tài NCKH nghiệm thu', deliverable: 'Báo cáo tổng kết hoàn chỉnh', timeline: '02/2027 - 07/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }], status: 'IN_PROGRESS' },
  { id: 't8', phaseId: 6, phaseName: 'Nội dung 6: Đánh giá & Báo cáo', code: 'CV 8.0', name: 'Viết bài báo cáo tại Hội thảo Khoa học cấp Khoa trở lên', deliverable: '01 Bài báo Hội thảo', timeline: '02/2027 - 07/2027', assignees: [{ name: 'Hoàng Lê Thảo Nhi', role: 'lead' }, { name: 'Võ Thanh Tòng', role: 'support' }, { name: 'Võ Hoài Buýt', role: 'support' }], status: 'IN_PROGRESS' }
];

export const ResearchProposalTab: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = RESEARCH_TASKS.filter((task) => {
    const matchPhase = selectedPhase === 0 || task.phaseId === selectedPhase;
    const matchAssignee =
      selectedAssignee === 'all' || task.assignees.some((a) => a.name === selectedAssignee);
    const matchSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.deliverable.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPhase && matchAssignee && matchSearch;
  });

  const handleDownloadDoc = () => {
    alert('Đang tạo và tải về toàn văn Thuyết Minh Đề Tài NCKH (Định dạng Markdown/PDF)...');
  };

  return (
    <div className="research-proposal-page hero-fade-in">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER THUYẾT MINH ĐỀ TÀI NCKH                                  */}
      {/* ========================================================================= */}
      <div className="proposal-hero-card">
        <div className="proposal-university-header">
          <div className="university-logo-box">
            <GraduationCap size={28} color="#ffffff" />
          </div>
          <div>
            <div className="university-subtag">TRƯỜNG ĐẠI HỌC NHA TRANG · KHOA CÔNG NGHỆ THÔNG TIN</div>
            <h1 className="proposal-main-title">
              THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC CỦA SINH VIÊN
            </h1>
          </div>
          <button
            type="button"
            onClick={handleDownloadDoc}
            className="adminator-btn-primary hover-lift proposal-download-btn"
          >
            <Download size={16} />
            <span>Tải Toàn Văn Thuyết Minh</span>
          </button>
        </div>

        {/* Project Name Highlight */}
        <div className="proposal-topic-box">
          <div className="topic-badge">TÊN ĐỀ TÀI CHÍNH THỨC</div>
          <h2 className="topic-title">
            Xây Dựng Hệ Thống Hỗ Trợ Ra Quyết Định Phân Tích & Dự Đoán Hành Vi Khách Hàng Trong Bán Hàng Đa Kênh
          </h2>
          <div className="topic-meta-row">
            <span>📅 Thời gian: <strong>13 tháng (07/2026 - 07/2027)</strong></span>
            <span>🔬 Loại hình: <strong>Khoa học Kỹ thuật & Ứng dụng</strong></span>
            <span>🏢 Đơn vị chủ trì: <strong>Khoa CNTT - ĐH Nha Trang</strong> (TS. Phạm Thị Thu Thúy)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THÀNH VIÊN NGHIÊN CỨU & CÁN BỘ HƯỚNG DẪN                               */}
      {/* ========================================================================= */}
      <div className="proposal-team-grid">
        {/* Card Chủ nhiệm đề tài */}
        <div className="team-member-card leader-card hover-lift">
          <div className="team-role-pill leader-pill">👑 CHỦ NHIỆM ĐỀ TÀI</div>
          <div className="team-member-header">
            <div className="team-avatar-circle">HN</div>
            <div>
              <h3 className="team-member-name">Hoàng Lê Thảo Nhi</h3>
              <div className="team-member-class">Lớp 66.TTQL-1 · Khoa CNTT</div>
            </div>
          </div>
          <div className="team-member-details">
            <div>📞 Điện thoại: <strong>0857300027</strong></div>
            <div>✉️ Email: <strong>nhi.hlt.66ttql@ntu.edu.vn</strong></div>
            <div>📍 Nam Nha Trang, Tỉnh Khánh Hòa</div>
          </div>
          <div className="team-member-tasks-summary">
            <strong>Trọng tâm nghiên cứu:</strong> Quản lý chung đề tài, K-Means phân cụm, Đánh giá mô hình cross-validation, Bộ luật tiêu chí DSS & Viết báo cáo Hội thảo.
          </div>
        </div>

        {/* Card Thành viên chính: Võ Hoài Buýt */}
        <div className="team-member-card hover-lift">
          <div className="team-role-pill member-pill">💻 THÀNH VIÊN CHÍNH</div>
          <div className="team-member-header">
            <div className="team-avatar-circle" style={{ background: '#10b981' }}>VB</div>
            <div>
              <h3 className="team-member-name">Võ Hoài Buýt</h3>
              <div className="team-member-class">Lớp 65.TTQL-2 · Khoa CNTT</div>
            </div>
          </div>
          <div className="team-member-details">
            <div>🏢 Đơn vị: <strong>Trường Đại học Nha Trang</strong></div>
            <div>✉️ Email: <strong>buyt.vh.65ttql@ntu.edu.vn</strong></div>
          </div>
          <div className="team-member-tasks-summary">
            <strong>Trọng tâm nghiên cứu:</strong> Khảo sát hệ DSS, Tiền xử lý & Feature Engineering, Mô hình ML nâng cao (Random Forest, XGBoost), Trực quan hóa Cockpit.
          </div>
        </div>

        {/* Card Thành viên chính: Võ Thanh Tòng */}
        <div className="team-member-card hover-lift">
          <div className="team-role-pill member-pill">💻 THÀNH VIÊN CHÍNH</div>
          <div className="team-member-header">
            <div className="team-avatar-circle" style={{ background: '#8b5cf6' }}>VT</div>
            <div>
              <h3 className="team-member-name">Võ Thanh Tòng</h3>
              <div className="team-member-class">Lớp 65.TTQL-2 · Khoa CNTT</div>
            </div>
          </div>
          <div className="team-member-details">
            <div>🏢 Đơn vị: <strong>Trường Đại học Nha Trang</strong></div>
            <div>✉️ Email: <strong>admin@omni-dss.vn</strong></div>
          </div>
          <div className="team-member-tasks-summary">
            <strong>Trọng tâm nghiên cứu:</strong> Phân tích hành vi đa kênh, Thu thập & Đồng bộ POS/Web/TMĐT, Mô hình cơ bản, Hyperparameter Tuning & Đánh giá hệ DSS.
          </div>
        </div>

        {/* Card Cán bộ hướng dẫn */}
        <div className="team-member-card advisor-card hover-lift">
          <div className="team-role-pill advisor-pill">🎓 CÁN BỘ HƯỚNG DẪN</div>
          <div className="team-member-header">
            <div className="team-avatar-circle" style={{ background: '#f59e0b' }}>NL</div>
            <div>
              <h3 className="team-member-name">ThS. Nguyễn Thị Hương Lý</h3>
              <div className="team-member-class">Giảng viên Khoa CNTT · ĐH Nha Trang</div>
            </div>
          </div>
          <div className="team-member-details">
            <div>📞 Điện thoại: <strong>0966883889</strong></div>
            <div>✉️ Email: <strong>lynth@ntu.edu.vn</strong></div>
            <div>📍 Vĩnh Hòa, TP. Nha Trang</div>
          </div>
          <div className="team-member-tasks-summary">
            <strong>Định hướng khoa học:</strong> Cố vấn phương pháp khai phá dữ liệu, kiến trúc hệ thống thông minh DSS và thẩm định chất lượng bài báo Hội thảo.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MA TRẬN 18 CÔNG VIỆC NGHIÊN CỨU & TIẾN ĐỘ THỰC HIỆN                   */}
      {/* ========================================================================= */}
      <div className="proposal-tasks-section">
        <div className="tasks-header-row">
          <div>
            <span className="section-tag-badge">MỤC 16 · TIẾN ĐỘ & PHÂN CÔNG</span>
            <h2 className="section-main-title">Ma Trận 18 Nhiệm Vụ Nghiên Cứu & Triển Khai</h2>
          </div>

          {/* Filters Row */}
          <div className="tasks-filter-box">
            <div className="tasks-search-input-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm mã CV, tên công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filter by Assignee */}
            <select
              className="auth-text-input auth-select filter-select"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            >
              <option value="all">Tất cả thành viên</option>
              <option value="Hoàng Lê Thảo Nhi">Hoàng Lê Thảo Nhi (Chủ nhiệm)</option>
              <option value="Võ Hoài Buýt">Võ Hoài Buýt</option>
              <option value="Võ Thanh Tòng">Võ Thanh Tòng</option>
            </select>
          </div>
        </div>

        {/* Phase Pills */}
        <div className="phase-pills-row">
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 0 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(0)}
          >
            Tất Cả ({RESEARCH_TASKS.length})
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 1 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(1)}
          >
            Nội Dung 1: Khảo Sát
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 2 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(2)}
          >
            Nội Dung 2: Dữ Liệu Đa Kênh
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 3 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(3)}
          >
            Nội Dung 3: Học Máy & RFM
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 4 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(4)}
          >
            Nội Dung 4: Động Cơ DSS
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 5 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(5)}
          >
            Nội Dung 5: Bảng Điều Khiển
          </button>
          <button
            type="button"
            className={`phase-pill ${selectedPhase === 6 ? 'active' : ''}`}
            onClick={() => setSelectedPhase(6)}
          >
            Nội Dung 6: Nghiệm Thu & Báo Cáo
          </button>
        </div>

        {/* Tasks Table */}
        <div className="welcome-comparison-table-wrapper" style={{ marginTop: '16px' }}>
          <table className="welcome-comparison-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mã CV</th>
                <th>Nội Dung Công Việc Nghiên Cứu</th>
                <th>Sản Phẩm Đầu Ra</th>
                <th>Thời Gian</th>
                <th>Phân Công Phụ Trách</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td className="font-bold color-blue">{task.code}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{task.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {task.phaseName}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{task.deliverable}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{task.timeline}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {task.assignees.map((a, idx) => (
                        <span
                          key={idx}
                          className={`task-assignee-badge ${a.role === 'lead' ? 'lead-badge' : 'support-badge'}`}
                          title={a.role === 'lead' ? 'Phụ trách chính' : 'Tham gia nghiên cứu'}
                        >
                          {a.role === 'lead' ? '★ ' : ''}
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {task.status === 'COMPLETED' ? (
                      <span className="badge-gain">Đã Hoàn Tất ✓</span>
                    ) : (
                      <span className="sidebar-pro-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        Đang Tiến Hành
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SẢN PHẨM DỰ KIẾN & ĐỊA CHỈ ỨNG DỤNG (MỤC 17, 18, 19)                  */}
      {/* ========================================================================= */}
      <div className="proposal-deliverables-grid">
        <div className="feature-pillar-card hover-lift">
          <div className="pillar-icon-box bg-blue">
            <Award size={24} color="#2563eb" />
          </div>
          <h3 className="pillar-title">Sản Phẩm Khoa Học Dự Kiến (Mục 17)</h3>
          <ul className="proposal-list">
            <li><strong>01 Phần Mềm Hệ Thống DSS:</strong> Thu thập dữ liệu đa kênh, XGBoost Churn (91.50%), K-Means RFM, MongoDB Atlas.</li>
            <li><strong>01 Bảng Tổng Hợp Trực Quan:</strong> Bảng điều khiển Cockpit Adminator tương tác thời gian thực.</li>
            <li><strong>01 Tài Liệu Hướng Dẫn:</strong> Hướng dẫn sử dụng chi tiết các phân hệ quản trị.</li>
            <li><strong>01 Bài Báo Khoa Học:</strong> Báo cáo tại Hội thảo Khoa học cấp Khoa trở lên.</li>
            <li><strong>01 Báo Cáo Tổng Kết:</strong> Hồ sơ nghiệm thu đề tài NCKH đầy đủ theo quy định.</li>
          </ul>
        </div>

        <div className="feature-pillar-card hover-lift">
          <div className="pillar-icon-box bg-emerald">
            <Building size={24} color="#10b981" />
          </div>
          <h3 className="pillar-title">Địa Chỉ Ứng Dụng & Chuyển Giao (Mục 19)</h3>
          <ul className="proposal-list">
            <li><strong>Đơn vị tiếp nhận & chuyển giao:</strong> Khoa Công Nghệ Thông Tin - Trường Đại học Nha Trang.</li>
            <li><strong>Ý nghĩa giáo dục:</strong> Làm tài liệu tham khảo, thực hành minh họa cho các học phần *Khai phá dữ liệu*, *Hệ hỗ trợ ra quyết định (DSS)*, *Học máy & Trí tuệ nhân tạo*.</li>
            <li><strong>Ý nghĩa kinh tế - xã hội:</strong> Cung cấp công cụ chuyển đổi số thông minh cho chuỗi bán lẻ đa kênh tại Việt Nam.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
