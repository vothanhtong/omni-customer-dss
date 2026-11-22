import React, { useState } from 'react';
import { predictChurn, predictRFM, evaluateDSS, getApiErrorMessage } from '../../services/api';
import { ChurnResponse, DSSResponse, SalesChannel, Region } from '../../types/customer';
import { BrainCircuit, Send, AlertTriangle, Lightbulb } from 'lucide-react';

const AUTO_SEGMENT = '__auto__';
const CHANNELS: SalesChannel[] = ['Facebook Fanpage', 'Website', 'TikTok Shop', 'Shopee', 'Unknown/Other'];
const REGIONS: Region[] = ['Miền Nam', 'Miền Bắc', 'Miền Trung', 'Chưa xác định'];

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }> = ({
  label, value, onChange, min = 0, step = 1
}) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input type="number" className="form-input" value={value} min={min} step={step} onChange={(e) => onChange(Number(e.target.value))} required />
  </div>
);

export const DSSPredictionTab: React.FC = () => {
  // Đặc trưng hành vi trong cửa sổ quan sát (khớp dữ liệu huấn luyện)
  const [recencyDays, setRecencyDays] = useState<number>(20);
  const [totalOrders, setTotalOrders] = useState<number>(2);
  const [completedOrders, setCompletedOrders] = useState<number>(1);
  const [monetary, setMonetary] = useState<number>(350000);
  const [returnedOrders, setReturnedOrders] = useState<number>(1);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);
  const [adOrders, setAdOrders] = useState<number>(1);
  const [ordersLast30d, setOrdersLast30d] = useState<number>(2);
  const [ordersLast7d, setOrdersLast7d] = useState<number>(0);
  const [tenureDays, setTenureDays] = useState<number>(15);
  const [channel, setChannel] = useState<SalesChannel>('Facebook Fanpage');
  const [region, setRegion] = useState<Region>('Miền Nam');
  const [segment, setSegment] = useState<string>(AUTO_SEGMENT);

  const [loading, setLoading] = useState<boolean>(false);
  const [churnRes, setChurnRes] = useState<ChurnResponse | null>(null);
  const [dssRes, setDssRes] = useState<DSSResponse | null>(null);
  const [usedSegment, setUsedSegment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredictAndEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Dự đoán Churn và (tuỳ chọn) phân cụm RFM song song
      const [churnData, rfmData] = await Promise.all([
        predictChurn({
          recency_days: recencyDays,
          total_orders: totalOrders,
          completed_orders: completedOrders,
          monetary,
          returned_orders: returnedOrders,
          cancelled_orders: cancelledOrders,
          ad_orders: adOrders,
          orders_last_30d: ordersLast30d,
          orders_last_7d: ordersLast7d,
          tenure_days: tenureDays,
          primary_channel: channel,
          region,
        }),
        segment === AUTO_SEGMENT
          ? predictRFM({ recency: recencyDays, frequency: completedOrders, monetary })
          : Promise.resolve(null),
      ]);
      setChurnRes(churnData);
      const rfmSegment = rfmData ? rfmData.segment_name : segment;
      setUsedSegment(rfmSegment);

      // 2. Đánh giá bảng luật DSS
      const dssData = await evaluateDSS({
        customer_id: 'CUST_DEMO',
        rfm_segment: rfmSegment,
        churn_risk: churnData.churn_probability,
        recency: recencyDays,
        frequency: completedOrders,
        monetary,
      });
      setDssRes(dssData);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể kết nối đến Backend API.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
      {/* Form Input */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BrainCircuit style={{ color: '#a855f7' }} size={22} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Dự Đoán Churn & Đánh Giá DSS Engine</h3>
        </div>

        <form onSubmit={handlePredictAndEvaluate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <NumberField label="Recency (ngày từ đơn gần nhất):" value={recencyDays} onChange={setRecencyDays} step={0.5} />
            <NumberField label="Tổng số đơn:" value={totalOrders} onChange={setTotalOrders} min={1} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <NumberField label="Số đơn thành công:" value={completedOrders} onChange={setCompletedOrders} />
            <NumberField label="Giá trị đơn thành công (VNĐ):" value={monetary} onChange={setMonetary} step={1000} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <NumberField label="Đơn hoàn trả:" value={returnedOrders} onChange={setReturnedOrders} />
            <NumberField label="Đơn bị hủy:" value={cancelledOrders} onChange={setCancelledOrders} />
            <NumberField label="Đơn từ quảng cáo:" value={adOrders} onChange={setAdOrders} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <NumberField label="Đơn trong 30 ngày:" value={ordersLast30d} onChange={setOrdersLast30d} />
            <NumberField label="Đơn trong 7 ngày:" value={ordersLast7d} onChange={setOrdersLast7d} />
            <NumberField label="Tenure (ngày đơn đầu → gần nhất):" value={tenureDays} onChange={setTenureDays} step={0.5} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Kênh mua chính:</label>
              <select className="form-input" value={channel} onChange={(e) => setChannel(e.target.value as SalesChannel)}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vùng miền:</label>
              <select className="form-input" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phân Khúc RFM:</label>
              <select className="form-input" value={segment} onChange={(e) => setSegment(e.target.value)}>
                <option value={AUTO_SEGMENT}>Tự động (K-Means)</option>
                <option value="VIP">VIP</option>
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="Cần chăm sóc">Cần chăm sóc</option>
                <option value="Rủi ro">Rủi ro</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
            <Send size={18} />
            {loading ? 'Đang phân tích Churn & DSS...' : 'Chạy Mô Hình & Đánh Giá DSS'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* XGBoost Churn Result */}
        <div className="glass-card">
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#9ca3af', marginBottom: '12px' }}>Dự Đoán Churn ({churnRes?.model_name ?? 'mô hình tốt nhất'})</h4>
          {churnRes ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Mức Độ Rủi Ro</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: churnRes.churn_probability_pct > 70 ? '#f43f5e' : '#10b981' }}>
                  {churnRes.risk_level}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Xác Suất Churn</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7' }}>
                  {churnRes.churn_probability_pct}%
                </div>
                <div style={{ fontSize: '0.82rem', color: '#10b981' }}>
                  Xu hướng mua lại: <strong>{churnRes.repurchase_probability_pct}%</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Chưa có kết quả dự đoán Churn.</div>
          )}
          {churnRes && churnRes.top_factors?.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Lý do ảnh hưởng chính (SHAP):</div>
              <div className="shap-factor-list">
                {churnRes.top_factors.map((f) => (
                  <div key={f.feature} className={`shap-factor ${f.shap_value > 0 ? 'up' : 'down'}`}>
                    <span>
                      <strong>{f.shap_value > 0 ? '▲' : '▼'} {f.label}</strong>
                      <span style={{ color: '#9ca3af' }}> = {Number.isInteger(f.value) ? f.value : f.value.toFixed(2)}</span>
                    </span>
                    <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>{f.effect} ({f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DSS Engine Rules Output */}
        <div className="glass-card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#9ca3af', marginBottom: '12px' }}>Khuyến Nghị Tự Động từ DSS Engine</h4>
          {dssRes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alert Level Badge */}
              <div>
                <span className={`badge ${dssRes.alert_level === 'CRITICAL' || dssRes.alert_level === 'HIGH' ? 'badge-high' : dssRes.alert_level === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                  Mức Cảnh Báo: {dssRes.alert_level === 'CRITICAL' ? '🚨 CRITICAL' : dssRes.alert_level}
                </span>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
                  Phân khúc: <strong>{dssRes.rfm_segment}</strong>
                  {segment === AUTO_SEGMENT && usedSegment ? ' (K-Means)' : ''}
                  {dssRes.matched_rules && dssRes.matched_rules.length > 0 && <> · Luật khớp: {dssRes.matched_rules.join(', ')}</>}
                </div>
              </div>

              {/* Warnings */}
              {dssRes.warnings.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#f59e0b', fontWeight: 600, marginBottom: '6px' }}>
                    <AlertTriangle size={16} /> Cảnh Báo Hệ Thống:
                  </div>
                  {dssRes.warnings.map((w, idx) => (
                    <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '6px' }}>
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>
                  <Lightbulb size={16} /> Gợi Ý Hành Động Marketing:
                </div>
                {dssRes.recommendations.map((r, idx) => (
                  <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '6px' }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Chưa có đề xuất từ DSS Engine.</div>
          )}
        </div>
      </div>
    </div>
  );
};
