import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModelMetrics, fmt, pct } from '../../context/MetricsContext';
import {
  Eye,
  FileText,
  Users,
  BarChart2,
  TrendingUp,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  ArrowRight
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { metrics, error: metricsError } = useModelMetrics();
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Gửi Voucher giảm giá 20% cho 142 khách hàng rủi ro cao (Churn > 70%)', done: false },
    { id: 2, text: 'Phân bổ chuyên viên CSKH hỗ trợ trực tiếp 28 tài khoản VIP đang sụt giảm tương tác', done: true },
    { id: 3, text: 'Đồng bộ dữ liệu giao dịch mới từ POS Cửa hàng & Sàn TMĐT vào MongoDB Atlas', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="adminator-overview-page">
      {/* ========================================================================= */}
      {/* 1. GREETING & EXPORT HEADER                                               */}
      {/* ========================================================================= */}
      <div className="overview-header-row">
        <div>
          <div className="overview-date-tag">MONDAY · AUGUST 15 · 2026</div>
          <h1 className="overview-welcome-title">
            Welcome back, <span className="highlight-blue">{currentUser?.fullName?.split(' ')[0] || 'John'}</span>
          </h1>
          <p className="overview-welcome-desc">
            Total visits are <span className="highlight-green">+10%</span> week over week, unique visitors steady, and bounce rate holding at 33%. Two new regions came online overnight.
          </p>
        </div>

        <div className="overview-action-buttons">
          <button className="adminator-btn-secondary" title="Xuất báo cáo PDF/Excel">
            <Download size={16} /> Export
          </button>
          <button className="adminator-btn-primary" title="Tạo báo cáo hoặc kích hoạt chiến dịch CSKH">
            <Plus size={16} /> New report
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HÀNG 4 KPI CARDS ADMINATOR                                            */}
      {/* ========================================================================= */}
      <div className="overview-kpi-grid">
        {/* Card 1: Total visits */}
        <div className="adminator-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-label">
              <Eye size={18} color="#10b981" />
              <span>Total visits</span>
            </div>
            <span className="kpi-pill pill-green">
              <ArrowUpRight size={13} /> +10%
            </span>
          </div>
          <div className="kpi-big-value">
            1.24<span className="kpi-unit">M</span>
          </div>
          <div className="kpi-footer-text text-green">
            ↗ up from <strong>1.12M</strong> last week
          </div>
        </div>

        {/* Card 2: Page views */}
        <div className="adminator-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-label">
              <FileText size={18} color="#f43f5e" />
              <span>Page views</span>
            </div>
            <span className="kpi-pill pill-red">
              <ArrowDownRight size={13} /> -7%
            </span>
          </div>
          <div className="kpi-big-value">
            4.08<span className="kpi-unit">M</span>
          </div>
          <div className="kpi-footer-text text-red">
            ↘ down from <strong>4.39M</strong> last week
          </div>
        </div>

        {/* Card 3: Unique visitors */}
        <div className="adminator-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-label">
              <Users size={18} color="#8b5cf6" />
              <span>Unique visitors</span>
            </div>
            <span className="kpi-pill pill-purple">
              <Minus size={13} /> ~12%
            </span>
          </div>
          <div className="kpi-big-value">
            842<span className="kpi-unit">K</span>
          </div>
          <div className="kpi-footer-text text-purple">
            ─ holding around <strong>835K</strong> last week
          </div>
        </div>

        {/* Card 4: Bounce rate */}
        <div className="adminator-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-label">
              <BarChart2 size={18} color="#3b82f6" />
              <span>Bounce rate</span>
            </div>
            <span className="kpi-pill pill-blue">
              ─ steady
            </span>
          </div>
          <div className="kpi-big-value">
            33<span className="kpi-unit">%</span>
          </div>
          <div className="kpi-footer-text text-blue">
            ─ matching <strong>33%</strong> last week
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KHUNG PHÂN TÍCH THEO KÊNH BÁN HÀNG & TIẾN ĐỘ VÒNG TRÒN                */}
      {/* ========================================================================= */}
      <div className="adminator-large-panel">
        <div className="panel-header-row">
          <div>
            <div className="panel-subtitle-tag">GEOGRAPHY · OMNICHANNEL DISTRIBUTION</div>
            <h3 className="panel-main-title">Site visits & Channel Performance</h3>
          </div>
          <a href="#view-report" onClick={(e) => e.preventDefault()} className="panel-link-action">
            View report <ArrowRight size={14} />
          </a>
        </div>

        {/* 4 Progress Bars */}
        <div className="geography-metrics-row">
          {/* Item 1 */}
          <div className="geo-metric-item">
            <div className="geo-metric-header">
              <div className="geo-bullet-label">
                <span className="bullet-dot dot-purple"></span> United States (POS)
              </div>
            </div>
            <div className="geo-metric-value-row">
              <span className="geo-main-val">100K</span>
              <span className="geo-sub-pct">50%</span>
            </div>
            <div className="geo-progress-track">
              <div className="geo-progress-bar bar-purple" style={{ width: '50%' }}></div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="geo-metric-item">
            <div className="geo-metric-header">
              <div className="geo-bullet-label">
                <span className="bullet-dot dot-green"></span> Europe (Website)
              </div>
            </div>
            <div className="geo-metric-value-row">
              <span className="geo-main-val">1M</span>
              <span className="geo-sub-pct">80%</span>
            </div>
            <div className="geo-progress-track">
              <div className="geo-progress-bar bar-green" style={{ width: '80%' }}></div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="geo-metric-item">
            <div className="geo-metric-header">
              <div className="geo-bullet-label">
                <span className="bullet-dot dot-blue"></span> Australia (Shopee/TMĐT)
              </div>
            </div>
            <div className="geo-metric-value-row">
              <span className="geo-main-val">450K</span>
              <span className="geo-sub-pct">40%</span>
            </div>
            <div className="geo-progress-track">
              <div className="geo-progress-bar bar-blue" style={{ width: '40%' }}></div>
            </div>
          </div>

          {/* Item 4 */}
          <div className="geo-metric-item">
            <div className="geo-metric-header">
              <div className="geo-bullet-label">
                <span className="bullet-dot dot-gray"></span> India (Direct/Khác)
              </div>
            </div>
            <div className="geo-metric-value-row">
              <span className="geo-main-val">1B</span>
              <span className="geo-sub-pct">90%</span>
            </div>
            <div className="geo-progress-track">
              <div className="geo-progress-bar bar-gray" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>

        {/* 3 Circular Donut Progress Rings */}
        <div className="circular-rings-container">
          {/* Ring 1: 75% New Users */}
          <div className="circular-ring-item">
            <div className="donut-wrapper">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="donut-fill ring-orange"
                  strokeDasharray="75, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-text">75%</div>
            </div>
            <div className="donut-label-box">
              <div className="donut-title">New users</div>
              <div className="donut-sub">first-time visitors</div>
            </div>
          </div>

          {/* Ring 2: 50% New Purchases */}
          <div className="circular-ring-item">
            <div className="donut-wrapper">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="donut-fill ring-cyan"
                  strokeDasharray="50, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-text">50%</div>
            </div>
            <div className="donut-label-box">
              <div className="donut-title">New purchases</div>
              <div className="donut-sub">from new visits</div>
            </div>
          </div>

          {/* Ring 3: 90% Bounce Rate / Accuracy */}
          <div className="circular-ring-item">
            <div className="donut-wrapper">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="donut-fill ring-yellow"
                  strokeDasharray="90, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-text">90%</div>
            </div>
            <div className="donut-label-box">
              <div className="donut-title">Bounce rate</div>
              <div className="donut-sub">avg engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HÀNG DƯỚI: MONTHLY STATS & TODO LIST (NHƯ ẢNH MẪU)                     */}
      {/* ========================================================================= */}
      <div className="overview-bottom-grid">
        {/* Left Card: Performance Monthly Stats */}
        <div className="adminator-bottom-card">
          <div className="bottom-card-header">
            <div>
              <div className="bottom-card-tag">PERFORMANCE</div>
              <h4 className="bottom-card-title">Monthly stats</h4>
            </div>
            <span className="bottom-card-date">April 2026</span>
          </div>

          <div className="monthly-stats-body">
            <div className="stat-row">
              <span className="stat-label">Doanh thu bán hàng tích lũy</span>
              <span className="stat-val highlight-green">18.4 Tỷ VNĐ (+14.2%)</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Tổng khách hàng phân cụm (RFM)</span>
              <span className="stat-val">
                {metrics ? `${metrics.rfm.n_customers.toLocaleString('vi-VN')} Khách hàng` : '—'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">
                Mô hình Churn ({metrics?.churn.best_model ?? '—'}) — test OOT {metrics ? `n=${metrics.churn.n_test.toLocaleString('vi-VN')}` : ''}
              </span>
              <span className="stat-val highlight-blue">
                {metrics
                  ? `ROC-AUC ${fmt(metrics.churn.best_model_test.roc_auc)} · Bal.Acc ${pct(metrics.churn.best_model_test.balanced_accuracy)}`
                  : metricsError ?? 'Đang tải...'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Độ trễ phản hồi quyết định DSS</span>
              <span className="stat-val text-green">&lt; 14ms (Async Real-time)</span>
            </div>
          </div>
        </div>

        {/* Right Card: Personal Todo List / DSS Action Triggers */}
        <div className="adminator-bottom-card">
          <div className="bottom-card-header">
            <div>
              <div className="bottom-card-tag">PERSONAL / DSS ACTIONS</div>
              <h4 className="bottom-card-title">Todo list</h4>
            </div>
            <button className="add-task-btn" onClick={() => alert('Thêm công việc hoặc chiến dịch tiếp thị mới!')}>
              Add task +
            </button>
          </div>

          <div className="todo-list-body">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`todo-item ${task.done ? 'done' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  className="todo-checkbox"
                />
                <span className="todo-text">{task.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
