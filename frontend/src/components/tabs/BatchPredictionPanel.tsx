import React, { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertTriangle, Play } from 'lucide-react';
import { predictChurnBatch, getApiErrorMessage } from '../../services/api';
import { BatchPredictionResponse } from '../../types/customer';
import { HBarChart } from '../charts/Charts';

const REQUIRED = ['customer_id', 'order_id', 'inserted_at', 'updated_at', 'status_group', 'total_price_cleaned'];
const OPTIONAL = ['channel_group', 'region_type', 'cod_cleaned', 'is_from_ad', 'categories_name', 'source'];
const ALERT_LABEL: Record<string, string> = { CRITICAL: 'Khẩn cấp', HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' };
const ALERT_BADGE: Record<string, string> = { CRITICAL: 'badge-high', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
const ALERT_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const PIPELINE = [
  ['1. Kiểm tra dữ liệu', 'Bắt buộc 6 cột; bỏ dòng hỏng; gộp kênh/vùng lạ'],
  ['2. Đặc trưng point-in-time', 'Chỉ dùng đơn & trạng thái đã biết trước mốc as-of'],
  ['3. Mô hình churn + SHAP', 'Cùng mô hình & hàm đặc trưng lúc huấn luyện'],
  ['4. K-Means RFM + DSS', 'Phân khúc và khuyến nghị theo bảng luật'],
];

const csvEscape = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const BatchPredictionPanel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [asOf, setAsOf] = useState('');
  const [maxItems, setMaxItems] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<BatchPredictionResponse | null>(null);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setRes(await predictChurnBatch(file, { asOf: asOf || undefined, maxItems }));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không chấm điểm được file.'));
      setRes(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!res) return;
    const header = ['display_id', 'churn_probability_pct', 'alert_level', 'rfm_segment', 'recency_days', 'total_orders',
      'completed_orders', 'monetary', 'primary_channel', 'region', 'recommendation', 'top_factors'];
    const lines = res.items.map((it) => [
      it.display_id, it.churn_probability_pct, it.alert_level, it.rfm_segment, it.recency_days, it.total_orders,
      it.completed_orders, it.monetary, it.primary_channel, it.region, it.recommendation,
      it.top_factors.map((f) => `${f.label} (${f.shap_value > 0 ? '+' : ''}${f.shap_value.toFixed(3)})`).join('; '),
    ].map(csvEscape).join(','));
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `churn_batch_${res.summary.as_of.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = res?.summary;
  const alertTotal = s ? Object.values(s.alert_distribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <FileSpreadsheet style={{ color: '#10b981' }} size={22} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dự Đoán Churn Hàng Loạt Từ File Đơn Hàng</h3>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: 14 }}>
        Tải lên file CSV đơn hàng đa kênh (cùng định dạng <code>orders_cleaned.csv</code>). Hệ thống chạy đúng pipeline lúc huấn luyện.
        File không được lưu lại trên máy chủ; kết quả chỉ hiển thị ID khách đã che.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        {PIPELINE.map(([t, d]) => (
          <div key={t} style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">File CSV (≤ 20 MB)</label>
          <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setRes(null); setError(null); }} />
          <button type="button" className="adminator-btn-secondary" onClick={() => inputRef.current?.click()}>
            <Upload size={15} /> {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'Chọn file...'}
          </button>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Mốc as-of (tùy chọn)</label>
          <input type="datetime-local" className="form-input" value={asOf} onChange={(e) => setAsOf(e.target.value)} style={{ margin: 0 }} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Số khách hiển thị</label>
          <select className="form-input" value={maxItems} onChange={(e) => setMaxItems(Number(e.target.value))} style={{ margin: 0 }}>
            {[50, 200, 500, 1000].map((n) => <option key={n} value={n}>{n} ưu tiên cao nhất</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={!file || loading} onClick={run}
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <Play size={15} /> {loading ? 'Đang chấm điểm...' : 'Chạy dự đoán'}
        </button>
      </div>
      <details className="viz-table" style={{ marginTop: 10 }}>
        <summary>Định dạng cột yêu cầu</summary>
        <div style={{ marginTop: 6, lineHeight: 1.7 }}>
          <div><strong>Bắt buộc:</strong> {REQUIRED.map((c) => <code key={c} style={{ marginRight: 8 }}>{c}</code>)}</div>
          <div><strong>Tùy chọn:</strong> {OPTIONAL.map((c) => <code key={c} style={{ marginRight: 8 }}>{c}</code>)}</div>
          <div><code>status_group</code> ∈ Completed / Returned / Cancelled / In_Progress. Mốc as-of mặc định là ngay sau đơn cuối cùng trong file.</div>
        </div>
      </details>

      {error && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', fontSize: '0.9rem' }}>
          <AlertTriangle size={15} style={{ verticalAlign: -2, marginRight: 6 }} /> {error}
        </div>
      )}

      {/* Kết quả */}
      {res && s && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Stat label="Khách hàng được chấm" value={s.n_customers.toLocaleString('vi-VN')} sub={`${s.n_orders.toLocaleString('vi-VN')} đơn trước mốc as-of`} />
            <Stat label="Mốc as-of" value={s.as_of.slice(0, 16)} sub={`Từ ${s.first_order_at.slice(0, 10)}`} />
            <Stat label="Xác suất churn TB" value={`${s.mean_churn_probability_pct.toFixed(1)}%`} sub={`Mô hình ${res.model_name}`} />
            <Stat label="Dòng hợp lệ" value={`${s.n_valid_rows.toLocaleString('vi-VN')} / ${s.n_rows.toLocaleString('vi-VN')}`} sub={`Bỏ ${s.n_dropped_rows.toLocaleString('vi-VN')} dòng hỏng`} />
          </div>

          {s.warnings.length > 0 && (
            <div style={{ marginTop: 12, fontSize: '0.84rem', color: '#f59e0b' }}>
              {s.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
            </div>
          )}

          <div style={{ marginTop: 16, maxWidth: 640 }}>
            <div className="bi-card-tag" style={{ marginBottom: 6 }}>Phân bố mức cảnh báo DSS</div>
            <HBarChart labelWidth={110} items={ALERT_ORDER.filter((l) => l in s.alert_distribution).map((l) => ({
              label: ALERT_LABEL[l], value: s.alert_distribution[l],
              valueLabel: `${s.alert_distribution[l].toLocaleString('vi-VN')} · ${((s.alert_distribution[l] / alertTotal) * 100).toFixed(1)}%`,
              tooltip: [ALERT_LABEL[l], `${s.alert_distribution[l].toLocaleString('vi-VN')} khách`],
            }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 8px' }}>
            <div style={{ fontWeight: 600 }}>
              {res.items.length.toLocaleString('vi-VN')} khách ưu tiên cao nhất{res.items_truncated ? ` (trên ${s.n_customers.toLocaleString('vi-VN')})` : ''}
            </div>
            <button className="adminator-btn-secondary" onClick={downloadCsv}><Download size={15} /> Tải kết quả CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="batch-table">
              <thead>
                <tr><th>Khách</th><th>Churn</th><th>Cảnh báo</th><th>Phân khúc</th><th>Đơn (TC)</th><th>Recency</th><th>Kênh · Vùng</th><th>Lý do chính (SHAP)</th><th>Khuyến nghị DSS</th></tr>
              </thead>
              <tbody>
                {res.items.map((it, i) => (
                  <tr key={`${it.display_id}-${i}`}>
                    <td style={{ fontFamily: 'monospace' }}>{it.display_id}</td>
                    <td style={{ fontWeight: 700 }}>{it.churn_probability_pct.toFixed(1)}%</td>
                    <td><span className={`badge ${ALERT_BADGE[it.alert_level] ?? 'badge-low'}`}>{ALERT_LABEL[it.alert_level] ?? it.alert_level}</span></td>
                    <td>{it.rfm_segment}</td>
                    <td>{it.total_orders} ({it.completed_orders})</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{it.recency_days.toFixed(1)} ngày</td>
                    <td>{it.primary_channel} · {it.region}</td>
                    <td>{it.top_factors.slice(0, 2).map((f) => (
                      <div key={f.feature} style={{ color: f.shap_value > 0 ? '#e66767' : '#3987e5' }}>{f.shap_value > 0 ? '▲' : '▼'} {f.label}</div>
                    ))}</td>
                    <td style={{ minWidth: 220 }}>{it.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 10 }}>
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>{value}</div>
    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{sub}</div>
  </div>
);
