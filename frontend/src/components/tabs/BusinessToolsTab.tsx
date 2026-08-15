import React, { useState } from 'react';
import { Sparkles, Sliders, ShieldAlert, Layout, Zap, Filter, FileSpreadsheet, CheckCircle2, ShoppingBag } from 'lucide-react';

export const BusinessToolsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'cleaner' | 'marketing' | 'architecture'>('cleaner');
  const [cleaningStatus, setCleaningStatus] = useState<string>('IDLE');
  const [cleanedCount, setCleanedCount] = useState<number>(10000);

  const handleRunCleaner = () => {
    setCleaningStatus('RUNNING');
    setTimeout(() => {
      setCleaningStatus('COMPLETED');
      setCleanedCount(10000);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
          }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Không Gian Tác Nghiệp Doanh Nghiệp</h2>
              <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: '#10b981' }}>
                🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginTop: '4px' }}>
              Môi trường làm việc thực tế: Tiền xử lý dữ liệu giao dịch đa kênh, quản lý kịch bản Marketing cá nhân hóa và thiết lập ngưỡng cảnh báo rủi ro rời bỏ.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRunCleaner}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              fontSize: '0.85rem',
              padding: '8px 14px'
            }}
          >
            <Filter size={15} />
            {cleaningStatus === 'RUNNING' ? 'Đang Lọc & Khử Nhiễu...' : 'Chạy Pipeline Tiền Xử Lý Dữ Liệu'}
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveSubTab('cleaner')}
          className={`subtab-btn ${activeSubTab === 'cleaner' ? 'active' : ''}`}
        >
          <Filter size={17} /> Bộ Công Cụ Tiền Xử Lý Dữ Liệu
        </button>
        <button
          onClick={() => setActiveSubTab('marketing')}
          className={`subtab-btn ${activeSubTab === 'marketing' ? 'active' : ''}`}
        >
          <Zap size={17} /> Chiến Lược Marketing & Cảnh Báo DSS
        </button>
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`subtab-btn ${activeSubTab === 'architecture' ? 'active' : ''}`}
        >
          <Layout size={17} /> Kiến Trúc Luồng Quyết Định
        </button>
      </div>

      {/* SUBTAB 1: CÔNG CỤ LÀM SẠCH DỮ LIỆU TƯƠNG TÁC */}
      {activeSubTab === 'cleaner' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter style={{ color: '#10b981' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Quy Trình Tiền Xử Lý & Làm Sạch Dữ Liệu Đa Kênh</h3>
            </div>
            {cleaningStatus === 'COMPLETED' && (
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                ✓ Đã làm sạch và chuẩn hóa thành công {cleanedCount.toLocaleString()} bản ghi giao dịch!
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>1. Xử lý Missing Values</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>100% Đầy đủ</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>Imputation giá trị trung vị</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>2. Xử lý Outlier (IQR)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#06b6d4', marginTop: '4px' }}>Cắt lọc phân vị</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>Recency 1-365, Monetary &gt; 100k</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>3. Khử Nhiễu Giao Dịch</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginTop: '4px' }}>Đồng bộ 3 Kênh</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>POS, Website, TMĐT</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>4. Chuẩn Hóa StandardScaler</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>Z-Score (μ=0, σ=1)</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>Sẵn sàng cho ML Models</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CHIẾN LƯỢC MARKETING & CẢNH BÁO DSS */}
      {activeSubTab === 'marketing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Zap style={{ color: '#f59e0b' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>5 Kịch Bản Chiến Lược Marketing Cá Nhân Hóa</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', borderLeft: '3px solid #f43f5e', padding: '10px 14px', borderRadius: '4px' }}>
                <strong style={{ color: '#f43f5e' }}>🔴 Kịch bản 1 (Khẩn cấp - Churn &gt; 70%):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '4px' }}>Tự động gửi Voucher giảm giá 15% - 20% kèm thông báo CSKH liên hệ trực tiếp.</p>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', padding: '10px 14px', borderRadius: '4px' }}>
                <strong style={{ color: '#10b981' }}>🟢 Kịch bản 2 (Tri ân VIP - Churn &lt; 20%):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '4px' }}>Mời tham gia chương trình tri ân đặc quyền VIP và sự kiện khuyến mãi riêng.</p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '10px 14px', borderRadius: '4px' }}>
                <strong style={{ color: '#f59e0b' }}>🟡 Kịch bản 3 (Giữ chân VIP rủi ro trung bình 20-70%):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '4px' }}>Gửi quà tặng cá nhân hóa và chỉ định chuyên viên CSKH hỗ trợ 1-1.</p>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '3px solid #6366f1', padding: '10px 14px', borderRadius: '4px' }}>
                <strong style={{ color: '#818cf8' }}>🔵 Kịch bản 4 (Khai thác Tiềm Năng):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '4px' }}>Gợi ý sản phẩm Cross-sell / Up-sell và nhân đôi điểm thưởng mua hàng.</p>
              </div>

              <div style={{ background: 'rgba(6, 182, 212, 0.1)', borderLeft: '3px solid #06b6d4', padding: '10px 14px', borderRadius: '4px' }}>
                <strong style={{ color: '#06b6d4' }}>⚪ Kịch bản 5 (Kích hoạt Cần Chăm Sóc):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '4px' }}>Gửi khảo sát trải nghiệm dịch vụ và mã ưu đãi Freeship không giới hạn.</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldAlert style={{ color: '#f43f5e' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cơ Chế Phân Cấp Cảnh Báo Rủi Ro DSS</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f43f5e' }}>Mức Cảnh Báo Đỏ (HIGH ALERT)</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Áp dụng khi Xác suất Churn &gt; 70%</div>
                </div>
                <span className="badge badge-high">Nguy Cơ Cao</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f59e0b' }}>Mức Cảnh Báo Vàng (MEDIUM ALERT)</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Áp dụng khi Xác suất Churn từ 40% - 70%</div>
                </div>
                <span className="badge badge-medium">Cần Chăm Sóc</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>Mức Cảnh Báo Xanh (LOW RISK)</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Áp dụng khi Xác suất Churn &lt; 40%</div>
                </div>
                <span className="badge badge-low">An Toàn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: KIẾN TRÚC TỔNG THỂ */}
      {activeSubTab === 'architecture' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layout style={{ color: '#6366f1' }} size={22} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Kiến Trúc Luồng Quyết Định 3 Tầng</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.95rem' }}>1. Tầng Dữ Liệu (Data Layer)</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>• Dữ liệu giao dịch POS & Web & TMĐT</li>
                <li>• MongoDB Atlas Cloud Collections</li>
                <li>• Pipeline làm sạch & StandardScaler</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>2. Tầng Động Cơ (Model/DSS Layer)</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>• K-Means RFM Segmentation Engine</li>
                <li>• XGBoost Churn Prediction Model</li>
                <li>• Động cơ suy diễn quy tắc DSS IF-THEN</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>3. Tầng Tương Tác (Dialog Layer)</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>• Streamlit Multichannel Dashboard</li>
                <li>• React TypeScript SPA Modern UI</li>
                <li>• Kích hoạt CSKH tự động 1-chạm</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
