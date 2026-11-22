import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModelMetrics, fmt, pct } from '../../context/MetricsContext';
import { getAnalyticsOverview, getApiErrorMessage } from '../../services/api';
import { AnalyticsOverview, ChurnGroupRow, DistributionRow } from '../../types/metrics';
import {
  DataTable, HBarChart, Legend, LineChart, StackedColumnChart,
  fmtInt, fmtPct, fmtVnd, seriesColor,
} from '../charts/Charts';
import {
  ShoppingCart, Users, Wallet, Layers, RefreshCw, AlertTriangle, AlertCircle, CheckCircle2,
} from 'lucide-react';

/** Thứ tự kênh cố định -> màu theo kênh không đổi giữa các biểu đồ (màu theo thực thể, không theo thứ hạng) */
const CHANNEL_ORDER = ['Facebook Fanpage', 'Website', 'TikTok Shop', 'Shopee', 'Unknown/Other'];
const channelColor = (name: string) => seriesColor(Math.max(CHANNEL_ORDER.indexOf(name), 0));
const byChannelOrder = <T extends { name: string }>(rows: T[]) =>
  [...rows].sort((a, b) => CHANNEL_ORDER.indexOf(a.name) - CHANNEL_ORDER.indexOf(b.name));

const distTooltip = (r: DistributionRow) => [
  <strong>{r.name}</strong>,
  `Đơn hàng: ${fmtInt(r.orders)} (${fmtPct(r.order_share)})`,
  `Khách hàng: ${fmtInt(r.customers)}`,
  `Doanh thu: ${fmtVnd(r.revenue_vnd)} VNĐ`,
  `Tỷ lệ hoàn: ${fmtPct(r.return_rate)} · Hủy: ${fmtPct(r.cancel_rate)}`,
];

const churnItems = (rows: ChurnGroupRow[], minN: number, colorOf?: (n: string) => string) =>
  rows.map((r) => ({
    label: r.name,
    value: r.churn_rate ?? 0,
    valueLabel: r.churn_rate === null ? `— (n<${minN})` : fmtPct(r.churn_rate),
    color: colorOf?.(r.name),
    tooltip: [<strong>{r.name}</strong>, `Khách tại mốc cutoff: ${fmtInt(r.customers)}`, `Tỷ lệ churn: ${fmtPct(r.churn_rate)}`],
  }));

export const OverviewTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { metrics, error: metricsError } = useModelMetrics();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getAnalyticsOverview());
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không tải được số liệu BI.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const trend = useMemo(
    () => (data ? data.churn.weekly_trend.filter((w) => w.churn_rate !== null && w.active_customers >= data.min_group_size_for_rates) : []),
    [data],
  );

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const firstName = currentUser?.fullName?.trim().split(' ').pop() || 'bạn';

  return (
    <div className="adminator-overview-page">
      {/* 1. HEADER */}
      <div className="overview-header-row">
        <div>
          <div className="overview-date-tag">{today.toUpperCase()}</div>
          <h1 className="overview-welcome-title">
            Xin chào, <span className="highlight-blue">{firstName}</span>
          </h1>
          <p className="overview-welcome-desc">
            {data ? (
              <>
                Dữ liệu đa kênh từ <strong>{data.period.start.slice(0, 10)}</strong> đến <strong>{data.period.end.slice(0, 10)}</strong>.
                Tỷ lệ rời bỏ tại mốc {data.churn.cutoff.slice(0, 10)}: <span className="highlight-green">{fmtPct(data.churn.overall_rate)}</span> ({data.churn.definition.toLowerCase()}).
              </>
            ) : loading ? 'Đang tải số liệu BI...' : 'Chưa có số liệu BI.'}
          </p>
        </div>
        <div className="overview-action-buttons">
          <button className="adminator-btn-secondary" onClick={load} disabled={loading} title="Tải lại số liệu">
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      </div>

      {error && (
        <div className="bi-card" style={{ marginBottom: 20, color: '#f43f5e' }}>
          <AlertTriangle size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
          {error}
        </div>
      )}

      {data && (
        <>
          {/* 2. KPI */}
          <div className="overview-kpi-grid">
            <KpiCard icon={<ShoppingCart size={18} color="#10b981" />} label="Tổng đơn hàng" value={fmtInt(data.totals.orders)}
              foot={`${data.channel_distribution.length} kênh bán hàng`} />
            <KpiCard icon={<Users size={18} color="#8b5cf6" />} label="Khách hàng" value={fmtInt(data.totals.customers)}
              foot={`TB ${(data.totals.orders / Math.max(data.totals.customers, 1)).toFixed(2)} đơn/khách`} />
            <KpiCard icon={<Wallet size={18} color="#3b82f6" />} label="Doanh thu đơn thành công" value={fmtVnd(data.totals.revenue_vnd)} unit="VNĐ"
              foot={`Tổng giá trị các đơn giao thành công`} />
            <KpiCard icon={<Layers size={18} color="#f59e0b" />} label="Khách đa kênh (≥ 2 kênh)" value={fmtInt(data.totals.omnichannel_customers)}
              foot={`${fmtPct(data.totals.omnichannel_customers / Math.max(data.totals.customers, 1), 2)} tổng khách`} />
          </div>

          {/* 3. PHÂN BỔ KÊNH & VÙNG MIỀN */}
          <div className="bi-grid">
            <div className="bi-card">
              <div className="bi-card-tag">Omnichannel · Phân bổ đơn hàng</div>
              <h3 className="bi-card-title">Đơn hàng theo kênh bán hàng</h3>
              <HBarChart items={byChannelOrder(data.channel_distribution).map((r) => ({
                label: r.name, value: r.orders, color: channelColor(r.name),
                valueLabel: `${fmtInt(r.orders)} · ${fmtPct(r.order_share)}`, tooltip: distTooltip(r),
              }))} />
              <DistTable rows={byChannelOrder(data.channel_distribution)} />
            </div>
            <div className="bi-card">
              <div className="bi-card-tag">Địa lý · Bắc / Trung / Nam</div>
              <h3 className="bi-card-title">Đơn hàng theo vùng miền</h3>
              <HBarChart items={data.region_distribution.map((r) => ({
                label: r.name, value: r.orders,
                valueLabel: `${fmtInt(r.orders)} · ${fmtPct(r.order_share)}`, tooltip: distTooltip(r),
              }))} />
              <DistTable rows={data.region_distribution} />
            </div>
          </div>

          {/* 4. XU HƯỚNG THEO THÁNG & CHURN THEO TUẦN */}
          <div className="bi-grid">
            <div className="bi-card">
              <div className="bi-card-tag">Xu hướng · theo tháng</div>
              <h3 className="bi-card-title">Số đơn hàng theo tháng và kênh</h3>
              <StackedColumnChart
                categories={data.monthly_orders_by_channel.map((m) => m.month)}
                series={CHANNEL_ORDER}
                values={data.monthly_orders_by_channel.map((m) => CHANNEL_ORDER.map((c) => Number(m[c] ?? 0)))}
              />
              <DataTable
                headers={['Tháng', ...CHANNEL_ORDER, 'Tổng']}
                rows={data.monthly_orders_by_channel.map((m) => [m.month, ...CHANNEL_ORDER.map((c) => fmtInt(Number(m[c] ?? 0))), fmtInt(m.total)])}
              />
            </div>
            <div className="bi-card">
              <div className="bi-card-tag">Churn · theo mốc cutoff hằng tuần</div>
              <h3 className="bi-card-title">Xu hướng tỷ lệ rời bỏ</h3>
              {trend.length > 0 ? (
                <LineChart
                  points={trend.map((w) => ({ x: w.cutoff, y: w.churn_rate as number, extra: `Khách đang hoạt động: ${fmtInt(w.active_customers)}` }))}
                  yLabel={(v) => fmtPct(v, 1)}
                  yMin={Math.floor(Math.min(...trend.map((w) => w.churn_rate as number)) * 20) / 20}
                  yMax={1}
                />
              ) : <div className="viz-note">Chưa đủ dữ liệu.</div>}
              <div className="viz-note">
                Chỉ hiển thị các tuần có ≥ {data.min_group_size_for_rates} khách hoạt động, vì tuần quá ít khách cho tỷ lệ không ổn định. Trục tung không bắt đầu từ 0.
              </div>
              <DataTable headers={['Mốc cutoff', 'Khách hoạt động', 'Tỷ lệ churn']}
                rows={data.churn.weekly_trend.map((w) => [w.cutoff, fmtInt(w.active_customers), fmtPct(w.churn_rate)])} />
            </div>
          </div>

          {/* 5. CHURN THEO KÊNH / VÙNG */}
          <div className="bi-grid">
            <div className="bi-card">
              <div className="bi-card-tag">Churn · theo kênh chính</div>
              <h3 className="bi-card-title">Tỷ lệ rời bỏ theo kênh</h3>
              <HBarChart max={1} items={churnItems(byChannelOrder(data.churn.by_channel), data.min_group_size_for_rates, channelColor)} />
              <div className="viz-note">Định nghĩa: {data.churn.definition}. Quần thể: {fmtInt(data.churn.population)} khách.</div>
            </div>
            <div className="bi-card">
              <div className="bi-card-tag">Churn · theo vùng miền</div>
              <h3 className="bi-card-title">Tỷ lệ rời bỏ theo vùng</h3>
              <HBarChart max={1} items={churnItems(data.churn.by_region, data.min_group_size_for_rates)} />
              <div className="viz-note">Nhóm có dưới {data.min_group_size_for_rates} khách không tính tỷ lệ.</div>
            </div>
          </div>

          {/* 6. MÔ HÌNH: PHÂN BỐ RỦI RO & SHAP */}
          <div className="bi-grid">
            <div className="bi-card">
              <div className="bi-card-tag">Mô hình {data.prediction.model} · tập kiểm tra</div>
              <h3 className="bi-card-title">Phân bố rủi ro dự đoán ({fmtInt(data.prediction.test_customers)} khách)</h3>
              <div className="bi-risk-row">
                <RiskTile icon={<AlertCircle size={14} color="#d03b3b" />} label="Rủi ro cao" n={data.prediction.risk_distribution.High} total={data.prediction.test_customers} />
                <RiskTile icon={<AlertTriangle size={14} color="#fab219" />} label="Trung bình" n={data.prediction.risk_distribution.Medium} total={data.prediction.test_customers} />
                <RiskTile icon={<CheckCircle2 size={14} color="#0ca30c" />} label="Rủi ro thấp" n={data.prediction.risk_distribution.Low} total={data.prediction.test_customers} />
              </div>
              <div className="bi-card-tag" style={{ marginBottom: 6 }}>Phân bố xác suất churn</div>
              <HBarChart labelWidth={90} items={data.prediction.probability_histogram.map((b) => ({
                label: `${b.from.toFixed(1)}–${b.to.toFixed(1)}`, value: b.count, valueLabel: fmtInt(b.count),
                tooltip: [`Xác suất ${b.from.toFixed(1)}–${b.to.toFixed(1)}`, `${fmtInt(b.count)} khách`],
              }))} />
            </div>
            <div className="bi-card">
              <div className="bi-card-tag">Giải thích mô hình · SHAP</div>
              <h3 className="bi-card-title">Mức độ quan trọng của đặc trưng</h3>
              <Legend items={[{ label: 'Giá trị cao → tăng rủi ro', color: 'var(--risk-up)' }, { label: 'Giá trị cao → giảm rủi ro', color: 'var(--risk-down)' }]} />
              <HBarChart labelWidth={230} items={data.feature_importance.slice(0, 12).map((f) => ({
                label: f.label.length > 34 ? f.label.slice(0, 33) + '…' : f.label,
                value: f.importance,
                valueLabel: f.importance.toFixed(3),
                color: f.direction.startsWith('tăng') ? 'var(--risk-up)' : 'var(--risk-down)',
                tooltip: [<strong>{f.label}</strong>, `mean |SHAP| = ${f.importance.toFixed(4)}`, `Xu hướng: ${f.direction}`, <code>{f.feature}</code>],
              }))} />
              <div className="viz-note">Giá trị là trung bình |SHAP| trên tập kiểm tra, tức mức đóng góp trung bình của đặc trưng vào dự đoán.</div>
              <DataTable headers={['Đặc trưng', 'mean |SHAP|', 'Xu hướng']}
                rows={data.feature_importance.map((f) => [f.label, f.importance.toFixed(4), f.direction])} />
            </div>
          </div>
        </>
      )}

      {/* 7. CHẤT LƯỢNG MÔ HÌNH */}
      <div className="bi-card">
        <div className="bi-card-tag">Hiệu năng mô hình (Out-of-time test)</div>
        <h3 className="bi-card-title">Chỉ số mô hình Churn & RFM</h3>
        <div className="monthly-stats-body">
          <div className="stat-row">
            <span className="stat-label">Mô hình tốt nhất</span>
            <span className="stat-val highlight-blue">{metrics?.churn.best_model ?? metricsError ?? 'Đang tải...'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">ROC-AUC · Balanced accuracy {metrics ? `(n=${fmtInt(metrics.churn.n_test)})` : ''}</span>
            <span className="stat-val">{metrics ? `${fmt(metrics.churn.best_model_test.roc_auc)} · ${pct(metrics.churn.best_model_test.balanced_accuracy)}` : '—'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Precision · Recall (lớp churn)</span>
            <span className="stat-val">{metrics ? `${pct(metrics.churn.best_model_test.precision)} · ${pct(metrics.churn.best_model_test.recall)}` : '—'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Khách hàng phân cụm RFM (K = {metrics?.rfm.k ?? '—'})</span>
            <span className="stat-val">{metrics ? fmtInt(metrics.rfm.n_customers) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string; unit?: string; foot: string }> = ({ icon, label, value, unit, foot }) => (
  <div className="adminator-kpi-card">
    <div className="kpi-card-header">
      <div className="kpi-icon-label">{icon}<span>{label}</span></div>
    </div>
    <div className="kpi-big-value">{value}{unit && <span className="kpi-unit"> {unit}</span>}</div>
    <div className="kpi-footer-text" style={{ color: 'var(--text-muted)' }}>{foot}</div>
  </div>
);

const RiskTile: React.FC<{ icon: React.ReactNode; label: string; n: number; total: number }> = ({ icon, label, n, total }) => (
  <div className="bi-risk-tile">
    <div className="lbl">{icon}{label}</div>
    <div className="val">{fmtInt(n)}</div>
    <div className="sub">{fmtPct(n / Math.max(total, 1))}</div>
  </div>
);

const DistTable: React.FC<{ rows: DistributionRow[] }> = ({ rows }) => (
  <DataTable
    headers={['Nhóm', 'Đơn', 'Khách', 'Doanh thu (VNĐ)', 'Hoàn', 'Hủy']}
    rows={rows.map((r) => [r.name, fmtInt(r.orders), fmtInt(r.customers), fmtVnd(r.revenue_vnd), fmtPct(r.return_rate), fmtPct(r.cancel_rate)])}
  />
);
