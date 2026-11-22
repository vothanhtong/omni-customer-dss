import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, Send, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getHighRiskCustomers, triggerCustomerAction, getApiErrorMessage } from '../../services/api';
import { AlertLevel, HighRiskCustomer, HighRiskPage } from '../../types/customer';

const LEVELS: { id: AlertLevel; label: string; badge: string; icon: React.ReactNode }[] = [
  { id: 'CRITICAL', label: 'Khẩn cấp', badge: 'badge-high', icon: <AlertCircle size={14} /> },
  { id: 'HIGH', label: 'Cao', badge: 'badge-high', icon: <AlertTriangle size={14} /> },
  { id: 'MEDIUM', label: 'Trung bình', badge: 'badge-medium', icon: <Info size={14} /> },
  { id: 'LOW', label: 'Thấp', badge: 'badge-low', icon: <CheckCircle2 size={14} /> },
];
const levelMeta = (l: string) => LEVELS.find((x) => x.id === l) ?? LEVELS[3];
const PAGE_SIZE = 10;

const fmtVnd = (v: number) => `${Math.round(v).toLocaleString('vi-VN')} đ`;
const fmtTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const HighRiskAlertsTab: React.FC = () => {
  const [levels, setLevels] = useState<AlertLevel[]>(['CRITICAL', 'HIGH']);
  const [segment, setSegment] = useState('');
  const [channel, setChannel] = useState('');
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<HighRiskPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ ref: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getHighRiskCustomers({
        alert_level: levels, segment: segment || undefined, channel: channel || undefined,
        region: region || undefined, page, page_size: PAGE_SIZE,
      }));
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không tải được danh sách cảnh báo.'));
    } finally {
      setLoading(false);
    }
  }, [levels, segment, channel, region, page]);

  useEffect(() => { load(); }, [load]);

  // Đổi bộ lọc -> về trang 1
  const withReset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const toggleLevel = (l: AlertLevel) => {
    const next = levels.includes(l) ? levels.filter((x) => x !== l) : [...levels, l];
    if (next.length === 0) return; // luôn giữ ít nhất 1 mức
    setLevels(next);
    setPage(1);
  };

  const handleTrigger = async (c: HighRiskCustomer, action: string) => {
    setBusyRef(c.ref);
    setActionError(null);
    try {
      const res = await triggerCustomerAction(c.ref, action);
      setData((d) => d && { ...d, items: d.items.map((it) => (it.ref === c.ref ? { ...it, last_action: res } : it)) });
    } catch (e) {
      setActionError({ ref: c.ref, msg: getApiErrorMessage(e, 'Không ghi nhận được hành động.') });
    } finally {
      setBusyRef(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header + bộ lọc */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ color: '#f43f5e' }} size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Cảnh Báo Khách Hàng Rủi Ro Rời Bỏ</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              {data?.data_note ?? 'Danh sách khách đã chấm điểm bằng mô hình churn và đánh giá qua bảng luật DSS.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {data && (
              <span className="badge badge-high" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                {data.total.toLocaleString('vi-VN')} / {data.population.toLocaleString('vi-VN')} khách
              </span>
            )}
            <button className="adminator-btn-secondary" onClick={load} disabled={loading} title="Tải lại">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16, alignItems: 'center' }}>
          {LEVELS.map((l) => {
            const on = levels.includes(l.id);
            return (
              <button key={l.id} type="button" onClick={() => toggleLevel(l.id)} aria-pressed={on}
                className={`badge ${on ? l.badge : ''}`}
                style={{ cursor: 'pointer', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: on ? 1 : 0.55, border: '1px solid var(--border-color)', background: on ? undefined : 'transparent',
                  color: on ? undefined : 'var(--text-muted)' }}>
                {l.icon} {l.label} · {data ? (data.alert_counts[l.id] ?? 0).toLocaleString('vi-VN') : '…'}
              </button>
            );
          })}
          <FilterSelect label="Phân khúc" value={segment} options={data?.facets.segments ?? []} onChange={withReset(setSegment)} />
          <FilterSelect label="Kênh" value={channel} options={data?.facets.channels ?? []} onChange={withReset(setChannel)} />
          <FilterSelect label="Vùng" value={region} options={data?.facets.regions ?? []} onChange={withReset(setRegion)} />
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ color: '#f43f5e' }}>
          <AlertTriangle size={16} style={{ verticalAlign: -3, marginRight: 6 }} /> {error}
        </div>
      )}

      {/* Danh sách */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', opacity: loading ? 0.6 : 1 }}>
        {data && data.items.length === 0 && !loading && (
          <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Không có khách hàng nào khớp bộ lọc.</div>
        )}
        {data?.items.map((c) => {
          const meta = levelMeta(c.alert_level);
          return (
            <div key={c.ref} className="glass-card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 12,
                padding: '12px 16px', textAlign: 'center', minWidth: 110 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Xác suất churn</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>{c.churn_prob_pct.toFixed(1)}%</div>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'monospace' }}>{c.display_id}</span>
                  <span className={`badge ${meta.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="badge badge-medium">{c.segment}</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {c.recency_days.toFixed(1)} ngày từ đơn gần nhất · {c.frequency} đơn · {fmtVnd(c.monetary)} · {c.channel} · {c.region}
                </div>
                {c.warnings.length > 0 && (
                  <div style={{ fontSize: '0.86rem', color: '#f59e0b', marginTop: 8 }}>⚠ {c.warnings.join(' · ')}</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {c.recommendations.map((rec) => {
                    const done = c.last_action?.action === rec;
                    return (
                      <div key={rec} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        background: 'var(--bg-input)', borderLeft: `3px solid ${done ? '#10b981' : '#64748b'}`, padding: '8px 12px', borderRadius: 6 }}>
                        <span style={{ fontSize: '0.88rem' }}><strong>DSS đề xuất:</strong> {rec}</span>
                        {done ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            <CheckCircle2 size={16} /> Đã kích hoạt
                          </span>
                        ) : (
                          <button onClick={() => handleTrigger(c, rec)} disabled={busyRef === c.ref} className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap',
                              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}>
                            <Send size={14} /> {busyRef === c.ref ? 'Đang gửi...' : 'Kích hoạt'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {c.last_action && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
                    Kích hoạt bởi {c.last_action.triggered_by} lúc {fmtTime(c.last_action.triggered_at)}
                    {!c.last_action.persisted && ' · chưa lưu MongoDB (máy chủ đang offline, chỉ lưu tạm)'}
                  </div>
                )}
                {actionError?.ref === c.ref && (
                  <div style={{ fontSize: '0.82rem', color: '#f43f5e', marginTop: 6 }}>{actionError.msg}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phân trang */}
      {data && data.total > data.page_size && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button className="adminator-btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} /> Trước
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trang {page} / {totalPages}</span>
          <button className="adminator-btn-secondary" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
            Sau <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
    style={{ width: 'auto', minWidth: 140, padding: '6px 10px', margin: 0 }}>
    <option value="">{label}: Tất cả</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);
