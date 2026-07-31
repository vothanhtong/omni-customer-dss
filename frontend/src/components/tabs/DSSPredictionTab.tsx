import React, { useState } from 'react';
import { predictChurn, evaluateDSS } from '../../services/api';
import { ChurnResponse, DSSResponse } from '../../types/customer';
import { BrainCircuit, Send, AlertTriangle, Lightbulb } from 'lucide-react';

export const DSSPredictionTab: React.FC = () => {
  const [recency, setRecency] = useState<number>(45);
  const [frequency, setFrequency] = useState<number>(3);
  const [monetary, setMonetary] = useState<number>(1200);
  const [supportTickets, setSupportTickets] = useState<number>(4);
  const [appLogins, setAppLogins] = useState<number>(2);
  const [daysSinceSupport, setDaysSinceSupport] = useState<number>(10);
  const [segment, setSegment] = useState<string>('Cần chăm sóc');

  const [loading, setLoading] = useState<boolean>(false);
  const [churnRes, setChurnRes] = useState<ChurnResponse | null>(null);
  const [dssRes, setDssRes] = useState<DSSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredictAndEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Predict Churn
      const churnData = await predictChurn({
        recency,
        frequency,
        monetary,
        support_tickets: supportTickets,
        app_logins_last_month: appLogins,
        days_since_last_support: daysSinceSupport,
      });
      setChurnRes(churnData);

      // 2. Evaluate DSS Rules
      const dssData = await evaluateDSS({
        customer_id: 'CUST_DEMO',
        rfm_segment: segment,
        churn_risk: churnData.churn_probability,
        recency,
        frequency,
        monetary,
      });
      setDssRes(dssData);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến Backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Form Input */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BrainCircuit style={{ color: '#a855f7' }} size={22} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Dự Đoán Churn & Đánh Giá DSS Engine</h3>
        </div>

        <form onSubmit={handlePredictAndEvaluate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Recency (ngày):</label>
              <input type="number" className="form-input" value={recency} onChange={(e) => setRecency(Number(e.target.value))} min={0} required />
            </div>
            <div className="form-group">
              <label className="form-label">Frequency (lần):</label>
              <input type="number" className="form-input" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} min={1} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Monetary (VNĐ):</label>
              <input type="number" className="form-input" value={monetary} onChange={(e) => setMonetary(Number(e.target.value))} min={0} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phân Khúc RFM:</label>
              <select className="form-input" value={segment} onChange={(e) => setSegment(e.target.value)}>
                <option value="VIP">VIP</option>
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="Cần chăm sóc">Cần chăm sóc</option>
                <option value="Rủi ro">Rủi ro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Support Tickets:</label>
              <input type="number" className="form-input" value={supportTickets} onChange={(e) => setSupportTickets(Number(e.target.value))} min={0} required />
            </div>
            <div className="form-group">
              <label className="form-label">App Logins:</label>
              <input type="number" className="form-input" value={appLogins} onChange={(e) => setAppLogins(Number(e.target.value))} min={0} required />
            </div>
            <div className="form-group">
              <label className="form-label">Days Support:</label>
              <input type="number" className="form-input" value={daysSinceSupport} onChange={(e) => setDaysSinceSupport(Number(e.target.value))} min={0} required />
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
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#9ca3af', marginBottom: '12px' }}>Dự Đoán Churn (XGBoost)</h4>
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
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Chưa có kết quả dự đoán Churn.</div>
          )}
        </div>

        {/* DSS Engine Rules Output */}
        <div className="glass-card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#9ca3af', marginBottom: '12px' }}>Khuyến Nghị Tự Động từ DSS Engine</h4>
          {dssRes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alert Level Badge */}
              <div>
                <span className={`badge ${dssRes.alert_level === 'HIGH' ? 'badge-high' : dssRes.alert_level === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                  Mức Cảnh Báo: {dssRes.alert_level}
                </span>
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
