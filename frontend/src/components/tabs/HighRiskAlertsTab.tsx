import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';

interface HighRiskCustomer {
  id: string;
  segment: string;
  churn_prob: number;
  recency: number;
  recommendation: string;
  status: 'PENDING' | 'TRIGGERED';
}

export const HighRiskAlertsTab: React.FC = () => {
  const [customers, setCustomers] = useState<HighRiskCustomer[]>([
    { id: 'CUST_1042', segment: 'VIP', churn_prob: 88.5, recency: 64, recommendation: 'Gửi Voucher 20% & Chuyên viên VIP gọi hỗ trợ ngay', status: 'PENDING' },
    { id: 'CUST_1109', segment: 'Cần chăm sóc', churn_prob: 92.1, recency: 112, recommendation: 'Tự động gửi Email kích hoạt kèm freeship', status: 'PENDING' },
    { id: 'CUST_1254', segment: 'Tiềm năng', churn_prob: 76.4, recency: 55, recommendation: 'Tặng 500 điểm thưởng tri ân giỏ hàng', status: 'PENDING' },
    { id: 'CUST_1311', segment: 'Rủi ro', churn_prob: 84.0, recency: 90, recommendation: 'Gửi khảo sát chất lượng dịch vụ & giảm giá 15%', status: 'PENDING' },
  ]);

  const handleTriggerAction = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'TRIGGERED' } : c))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle style={{ color: '#f43f5e' }} size={24} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Danh Sách Cảnh Báo Khách Hàng Rủi Ro Rời Bỏ Cao</h3>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px' }}>
            Các khách hàng có tỷ lệ Churn &gt; 70% được lọc trực tiếp từ DSS Engine cần can thiệp khẩn cấp.
          </p>
        </div>
        <span className="badge badge-high" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          {customers.filter((c) => c.status === 'PENDING').length} Khách Hàng Cần Xử Lý
        </span>
      </div>

      {/* Customer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customers.map((customer) => (
          <div key={customer.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '12px',
                padding: '12px 18px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Xác Suất Churn</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>{customer.churn_prob}%</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{customer.id}</span>
                  <span className="badge badge-medium">{customer.segment}</span>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{customer.recency} ngày chưa mua</span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '6px' }}>
                  <strong>Khuyến nghị DSS:</strong> {customer.recommendation}
                </div>
              </div>
            </div>

            <div>
              {customer.status === 'PENDING' ? (
                <button
                  onClick={() => handleTriggerAction(customer.id)}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)' }}
                >
                  <Send size={16} /> Kích Hoạt CSKH
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={20} /> Đã Gửi Ưu Đãi
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
