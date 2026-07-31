import React from 'react';
import { Users, UserCheck, AlertTriangle, TrendingUp, Zap, ShieldCheck } from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const stats = [
    { label: 'Tổng Số Khách Hàng', value: '1,000', icon: Users, color: '#6366f1' },
    { label: 'Khách Hàng VIP', value: '254', icon: UserCheck, color: '#10b981' },
    { label: 'Rủi Ro Churn Cao (>70%)', value: '142', icon: AlertTriangle, color: '#f43f5e' },
    { label: 'Doanh Thu Tỷ Lệ (VNĐ)', value: '18.4 tỷ', icon: TrendingUp, color: '#06b6d4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${stat.color}20`,
                border: `1px solid ${stat.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                <Icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Zap style={{ color: '#6366f1' }} size={22} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Mô Hình Học Máy Integrated ML</h3>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.92rem', marginBottom: '12px' }}>
            Hệ thống tự động phân cụm nhóm khách hàng RFM (Recency, Frequency, Monetary) bằng thuật toán <strong>K-Means Clustering</strong> và dự đoán xác suất rời bỏ (Churn) bằng <strong>XGBoost / Gradient Boosting</strong>.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <li>✓ Độ chính xác mô hình Churn: ~91.5%</li>
            <li>✓ Cập nhật dữ liệu thời gian thực qua REST API</li>
          </ul>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck style={{ color: '#10b981' }} size={22} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Động Cơ Quyết Định DSS Rules</h3>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.92rem', marginBottom: '12px' }}>
            DSS Engine kết hợp kết quả phân cụm ML và tỷ lệ Churn để tự động sinh ra các cảnh báo rủi ro (HIGH/MEDIUM/LOW) cùng gợi ý hành động marketing chính xác.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <li>✓ Tự động hóa chiến dịch khuyến mãi & CSKH</li>
            <li>✓ Tối ưu hóa chi phí giữ chân khách hàng VIP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
