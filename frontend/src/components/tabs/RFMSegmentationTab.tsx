import React, { useState } from 'react';
import { predictRFM } from '../../services/api';
import { RFMResponse } from '../../types/customer';
import { PieChart, Send, CheckCircle2 } from 'lucide-react';

export const RFMSegmentationTab: React.FC = () => {
  const [recency, setRecency] = useState<number>(30);
  const [frequency, setFrequency] = useState<number>(12);
  const [monetary, setMonetary] = useState<number>(8500);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RFMResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictRFM({ recency, frequency, monetary });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến Backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Form Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <PieChart style={{ color: '#6366f1' }} size={22} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Dự Đoán Phân Cụm RFM (K-Means)</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Recency (Số ngày kể từ lần mua cuối):</label>
            <input
              type="number"
              className="form-input"
              value={recency}
              onChange={(e) => setRecency(Number(e.target.value))}
              min={0}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Frequency (Số lần giao dịch):</label>
            <input
              type="number"
              className="form-input"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monetary (Tổng giá trị chi tiêu VNĐ / k VNĐ):</label>
            <input
              type="number"
              className="form-input"
              value={monetary}
              onChange={(e) => setMonetary(Number(e.target.value))}
              min={0}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
            <Send size={18} />
            {loading ? 'Đang phân tích ML...' : 'Phân Cụm Khách Hàng'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Result Display */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {result ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle2 size={48} style={{ color: '#10b981' }} />
            <h4 style={{ fontSize: '1.1rem', color: '#9ca3af' }}>Kết Quả Phân Cụm ML</h4>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              padding: '20px 32px',
              minWidth: '220px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 600 }}>Phân Khúc KH</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{result.segment_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>Cluster ID: #{result.cluster_id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', marginTop: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Recency</div>
                <div style={{ fontWeight: 600 }}>{result.recency} ngày</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Frequency</div>
                <div style={{ fontWeight: 600 }}>{result.frequency} lần</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Monetary</div>
                <div style={{ fontWeight: 600 }}>{result.monetary.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <p>Vui lòng nhập chỉ số RFM và bấm nút phân tích để xem kết quả phân cụm từ K-Means.</p>
          </div>
        )}
      </div>
    </div>
  );
};
