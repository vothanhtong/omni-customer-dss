import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  BrainCircuit,
  PieChart,
  ShieldCheck,
  Building,
  ArrowRight,
  Database,
  Layers,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Users,
  Award,
  Globe,
  Sliders,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Target,
  Cpu,
  GraduationCap
} from 'lucide-react';

interface HomeWelcomeTabProps {
  setActiveTab: (tab: string) => void;
}

export const HomeWelcomeTab: React.FC<HomeWelcomeTabProps> = ({ setActiveTab }) => {
  const { currentUser, openProfileModal, openAuthPage } = useAuth();

  const handleDownloadReport = () => {
    alert('Đang tạo và tải về tệp Báo Cáo Nghiên Cứu Khoa Học Tóm Tắt (Định dạng PDF)...');
  };

  return (
    <div className="home-welcome-page hero-fade-in">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER CHÀO MỪNG ĐỒNG BỘ SAPPHIRE GRADIENT                        */}
      {/* ========================================================================= */}
      <section className="welcome-hero-banner">
        {/* Floating Glowing Orbs */}
        <div className="hero-glow-orb orb-1"></div>
        <div className="hero-glow-orb orb-2"></div>

        <div className="welcome-hero-content">
          {/* Top Trust Badge */}
          <div className="welcome-badge-row">
            <span className="welcome-trust-badge float-pill">
              <Sparkles size={14} color="#f59e0b" />
              <span>★ 5.0 GIẢI PHÁP NCKH DOANH NGHIỆP 2026 · V3.1 ENTERPRISE COCKPIT</span>
            </span>
            <span className="welcome-tag-pill">
              <ShieldCheck size={14} color="#60a5fa" />
              <span>BẢO MẬT DỮ LIỆU ĐA KÊNH</span>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="welcome-hero-title">
            Nền Tảng Hỗ Trợ Ra Quyết Định Phân Tích & Giữ Chân Khách Hàng
            <span className="highlight-gradient-text"> Bán Hàng Đa Kênh</span>
          </h1>

          {/* Subtitle */}
          <p className="welcome-hero-desc">
            Hệ thống <strong>Omni Customer DSS</strong> tích hợp phân cụm thông minh <strong>K-Means RFM</strong>, mô hình học máy <strong>XGBoost</strong> dự báo rủi ro rời bỏ khách hàng (Churn Risk) đạt độ chính xác <strong>91.50%</strong>, kết hợp động cơ luật ra quyết định tự động hóa tiếp thị cá nhân hóa theo thời gian thực.
          </p>

          {/* Action Buttons Row */}
          <div className="welcome-cta-buttons">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="welcome-btn-primary hover-lift"
              title="Truy cập Bảng điều khiển Quản trị Dashboard"
            >
              <Zap size={18} />
              <span>Khám Phá Dashboard Ngay</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('proposal')}
              className="welcome-btn-glass hover-scale"
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              title="Xem toàn văn Thuyết Minh Đề Tài NCKH Sinh Viên Đại Học Nha Trang"
            >
              <GraduationCap size={18} />
              <span>Thuyết Minh NCKH (ĐH Nha Trang)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rfm')}
              className="welcome-btn-glass hover-scale"
              title="Khám phá phân cụm khách hàng RFM"
            >
              <PieChart size={18} />
              <span>Phân Cụm RFM ($K=4$)</span>
            </button>

            <button
              type="button"
              onClick={openProfileModal}
              className="welcome-btn-glass hover-scale"
              title="Xem và chỉnh sửa hồ sơ doanh nghiệp"
            >
              <Building size={18} />
              <span>Hồ Sơ Doanh Nghiệp</span>
            </button>
          </div>

          {/* 4 KPI Experimental Metric Cards */}
          <div className="welcome-kpi-strip">
            <div className="welcome-kpi-box">
              <div className="kpi-box-icon"><Zap size={20} color="#60a5fa" /></div>
              <div className="kpi-box-val">&lt; 14ms</div>
              <div className="kpi-box-lbl">Tốc Độ Ra Quyết Định DSS</div>
            </div>

            <div className="welcome-kpi-box">
              <div className="kpi-box-icon"><BrainCircuit size={20} color="#10b981" /></div>
              <div className="kpi-box-val">91.50%</div>
              <div className="kpi-box-lbl">Độ Chính Xác XGBoost Churn</div>
            </div>

            <div className="welcome-kpi-box">
              <div className="kpi-box-icon"><TrendingUp size={20} color="#f59e0b" /></div>
              <div className="kpi-box-val">0.9575</div>
              <div className="kpi-box-lbl">ROC-AUC Score Thực Nghiệm</div>
            </div>

            <div className="welcome-kpi-box">
              <div className="kpi-box-icon"><Database size={20} color="#a855f7" /></div>
              <div className="kpi-box-val">+ 34%</div>
              <div className="kpi-box-lbl">Tăng Tỷ Lệ Giữ Chân VIP</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SÁU ƯU ĐIỂM & GIÁ TRỊ VƯỢT TRỘI CỦA DỰ ÁN (CORE VALUE PILLARS)          */}
      {/* ========================================================================= */}
      <section className="welcome-section">
        <div className="section-header-center">
          <span className="section-tag-badge">GIÁ TRỊ CỐT LÕI & NĂNG LỰC NCKH</span>
          <h2 className="section-main-title">6 Ưu Điểm Đột Phá Của Hệ Thống Omni DSS</h2>
          <p className="section-sub-title">
            Giải pháp toàn diện giúp doanh nghiệp bán lẻ chuyển dịch từ quản trị cảm tính sang ra quyết định tự động dựa trên dữ liệu.
          </p>
        </div>

        <div className="features-grid-6">
          {/* Card 1 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-blue">
              <Layers size={24} color="#2563eb" />
            </div>
            <h3 className="pillar-title">1. Hợp Nhất Dữ Liệu Đa Kênh</h3>
            <p className="pillar-desc">
              Tích hợp đồng nhất dữ liệu giao dịch từ <strong>POS Cửa hàng vật lý</strong>, <strong>Website E-commerce</strong> và <strong>Sàn TMĐT (Shopee/Lazada)</strong> thành một định dạng chuẩn hóa, loại bỏ hoàn toàn tình trạng phân mảnh dữ liệu.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#2563eb" /> Chuẩn hóa dữ liệu đa nguồn
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-emerald">
              <PieChart size={24} color="#10b981" />
            </div>
            <h3 className="pillar-title">2. Phân Cụm RFM Thông Minh ($K=4$)</h3>
            <p className="pillar-desc">
              Ứng dụng thuật toán <strong>K-Means Clustering</strong> tối ưu hóa bằng phương pháp Elbow & Silhouette, tự động phân nhóm khách hàng thành 4 cụm: <em>Khách hàng VIP</em>, <em>Tiềm năng phát triển</em>, <em>Cần chăm sóc</em> và <em>Rủi ro rời bỏ</em>.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#10b981" /> 4 Phân khúc hành vi RFM
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-amber">
              <Target size={24} color="#f59e0b" />
            </div>
            <h3 className="pillar-title">3. Động Cơ Dự Báo Churn XGBoost</h3>
            <p className="pillar-desc">
              Mô hình học máy <strong>XGBoost Classifier</strong> được tinh chỉnh siêu tham số bằng Optuna, cho phép nhận diện sớm nguy cơ khách hàng ngừng mua sắm trước 30-60 ngày với độ chính xác đạt <strong>91.50%</strong> và ROC-AUC <strong>0.9575</strong>.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#f59e0b" /> Nhận diện sớm rủi ro Churn
            </div>
          </div>

          {/* Card 4 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-purple">
              <Sliders size={24} color="#a855f7" />
            </div>
            <h3 className="pillar-title">4. Động Cơ Luật Ra Quyết Định (DSS)</h3>
            <p className="pillar-desc">
              Cơ chế động cơ quy tắc (Rule-based Engine) tự động phân tầng mức độ cảnh báo (<strong>HIGH / MEDIUM / LOW</strong>) và đề xuất chính xác 5 kịch bản Marketing cá nhân hóa: Tặng Voucher cứu vãn, Miễn phí vận chuyển, Tri ân VIP, Flash-sale kích hoạt lại.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#a855f7" /> 5 Kịch bản giữ chân tự động
            </div>
          </div>

          {/* Card 5 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-cyan">
              <Database size={24} color="#06b6d4" />
            </div>
            <h3 className="pillar-title">5. Cơ Sở Dữ Liệu Cloud MongoDB Atlas</h3>
            <p className="pillar-desc">
              Hạ tầng lưu trữ phi cấu trúc NoSQL hiệu năng cao trên Cloud MongoDB Atlas, tích hợp cơ chế Offline Fallback đồng bộ bộ nhớ cục bộ giúp hệ thống hoạt động liên tục 24/7 không bị gián đoạn.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#06b6d4" /> Đồng bộ Cloud & Offline Fallback
            </div>
          </div>

          {/* Card 6 */}
          <div className="feature-pillar-card hover-lift">
            <div className="pillar-icon-box bg-rose">
              <MessageSquare size={24} color="#f43f5e" />
            </div>
            <h3 className="pillar-title">6. Trợ Lý AI DSS Copilot & Live Chat</h3>
            <p className="pillar-desc">
              Tích hợp module cố vấn chiến lược CSKH tự động và Live Chat tương tác thời gian thực, hỗ trợ các chuyên viên phân tích và nhân viên Marketing tra cứu chỉ số khách hàng tức thời.
            </p>
            <div className="pillar-footer-tag">
              <CheckCircle2 size={14} color="#f43f5e" /> Cố vấn chiến lược CSKH 24/7
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SƠ ĐỒ KIẾN TRÚC QUY TRÌNH 3 TẦNG (INTERACTIVE PIPELINE)                */}
      {/* ========================================================================= */}
      <section className="welcome-section welcome-architecture-section">
        <div className="section-header-center">
          <span className="section-tag-badge">KIẾN TRÚC HỆ THỐNG</span>
          <h2 className="section-main-title">Quy Trình Xử Lý Dữ Liệu & Ra Quyết Định Khép Kín</h2>
          <p className="section-sub-title">
            Từ dữ liệu thô đa kênh đến kịch bản hành động được kích hoạt tự động theo thời gian thực.
          </p>
        </div>

        <div className="pipeline-steps-container">
          {/* Step 1 */}
          <div className="pipeline-step-card">
            <div className="step-number-badge">TẦNG 1</div>
            <div className="step-icon-wrapper"><FileSpreadsheet size={24} color="#2563eb" /></div>
            <h4 className="step-title">Thu Thập & Hợp Nhất</h4>
            <p className="step-desc">
              Thu thập dữ liệu giao dịch từ Cửa hàng POS, Web E-com và Shopee/Lazada. Làm sạch ngoại lai và tính toán bộ chỉ số RFM (Recency, Frequency, Monetary).
            </p>
            <div className="step-tech-tag">MongoDB Atlas · Pandas</div>
          </div>

          <div className="pipeline-arrow-divider">→</div>

          {/* Step 2 */}
          <div className="pipeline-step-card active-pulse">
            <div className="step-number-badge">TẦNG 2</div>
            <div className="step-icon-wrapper"><BrainCircuit size={24} color="#10b981" /></div>
            <h4 className="step-title">Phân Tích AI & Học Máy</h4>
            <p className="step-desc">
              Phân cụm khách hàng K-Means ($K=4$). Mô hình XGBoost tính toán xác suất rời bỏ (Churn Probability) và phân cấp nguy cơ rủi ro.
            </p>
            <div className="step-tech-tag">Scikit-Learn · XGBoost · FastAPI</div>
          </div>

          <div className="pipeline-arrow-divider">→</div>

          {/* Step 3 */}
          <div className="pipeline-step-card">
            <div className="step-number-badge">TẦNG 3</div>
            <div className="step-icon-wrapper"><BarChart3 size={24} color="#f59e0b" /></div>
            <h4 className="step-title">Hỗ Trợ Ra Quyết Định (DSS)</h4>
            <p className="step-desc">
              Động cơ quy tắc kích hoạt 5 kịch bản chăm sóc khách hàng tự động, trực quan hóa toàn diện trên Bảng điều khiển Cockpit Adminator.
            </p>
            <div className="step-tech-tag">React · Vite · TypeScript</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SO SÁNH ĐỐI CHIẾU HIỆU QUẢ TRƯỚC VÀ SAU KHI ỨNG DỤNG DSS              */}
      {/* ========================================================================= */}
      <section className="welcome-section">
        <div className="section-header-center">
          <span className="section-tag-badge">ĐỐI CHIẾU THỰC NGHIỆM</span>
          <h2 className="section-main-title">So Sánh Hiệu Quả Trước & Sau Khi Ứng Dụng</h2>
          <p className="section-sub-title">
            Bảng đối chiếu sự chuyển biến rõ rệt về thời gian phản hồi, độ chính xác và hiệu quả giữ chân khách hàng.
          </p>
        </div>

        <div className="welcome-comparison-table-wrapper">
          <table className="welcome-comparison-table">
            <thead>
              <tr>
                <th>Tiêu Chí Đánh Giá</th>
                <th>Phương Pháp Truyền Thống (Trước)</th>
                <th className="highlight-column">Ứng Dụng Omni Customer DSS (Sau)</th>
                <th>Mức Độ Cải Thiện</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Thời gian phân tích khách hàng</td>
                <td>2 - 3 ngày (Xuất Excel thủ công)</td>
                <td className="highlight-column font-bold color-blue">&lt; 14 mili-giây (Thời gian thực)</td>
                <td><span className="badge-gain">Nhanh hơn 99%</span></td>
              </tr>
              <tr>
                <td className="font-bold">Độ chính xác dự báo rời bỏ</td>
                <td>45% - 55% (Dựa trên cảm tính)</td>
                <td className="highlight-column font-bold color-emerald">91.50% (Mô hình XGBoost)</td>
                <td><span className="badge-gain">+ 36.5% Chính xác</span></td>
              </tr>
              <tr>
                <td className="font-bold">Phân bổ kịch bản Marketing</td>
                <td>Đại trà, không phân khúc cá nhân</td>
                <td className="highlight-column font-bold color-purple">Tự động hóa theo 4 cụm RFM</td>
                <td><span className="badge-gain">Cá nhân hóa 100%</span></td>
              </tr>
              <tr>
                <td className="font-bold">Tỷ lệ giữ chân khách hàng VIP</td>
                <td>62%</td>
                <td className="highlight-column font-bold color-amber">83.2% (+34% tăng trưởng)</td>
                <td><span className="badge-gain">+ 34% Giữ chân</span></td>
              </tr>
              <tr>
                <td className="font-bold">Lưu trữ & Khả năng mở rộng</td>
                <td>Rời rạc trên từng chi nhánh/kênh</td>
                <td className="highlight-column font-bold color-cyan">Hợp nhất MongoDB Atlas Cloud</td>
                <td><span className="badge-gain">Đồng bộ 24/7</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BOTTOM CTA BANNER & THÔNG TIN ĐỀ TÀI NCKH                              */}
      {/* ========================================================================= */}
      <section className="welcome-bottom-cta">
        <div className="bottom-cta-box">
          <div className="bottom-cta-glow"></div>
          <h3 className="bottom-cta-title">Sẵn Sàng Nâng Tầm Quản Trị Khách Hàng Đa Kênh?</h3>
          <p className="bottom-cta-desc">
            Trải nghiệm ngay không gian làm việc chuyên sâu với đầy đủ mô hình phân cụm RFM, dự báo rủi ro rời bỏ và công cụ quản trị chiến dịch.
          </p>

          <div className="bottom-cta-btn-row">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="welcome-btn-primary hover-lift"
            >
              <Zap size={18} />
              <span>Vào Bảng Điều Khiển Dashboard</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dss')}
              className="welcome-btn-glass hover-scale"
            >
              <BrainCircuit size={18} />
              <span>Thử Nghiệm Động Cơ DSS</span>
            </button>
          </div>

          <div className="bottom-cta-meta" style={{ flexDirection: 'column', gap: '6px' }}>
            <span>© 2026 · Đề Tài Nghiên Cứu Khoa Học Sinh Viên: <strong>Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong bán hàng đa kênh</strong></span>
            <span>Chủ nhiệm đề tài: <strong>Hoàng Lê Thảo Nhi</strong> · Thành viên chính: <strong>Võ Hoài Buýt, Võ Thanh Tòng</strong> · GVHD: <strong>ThS. Nguyễn Thị Hương Lý</strong> (Khoa CNTT - Trường Đại học Nha Trang)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
