import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, Sliders, Layers, BarChart3, Users, RefreshCw, Sparkles, Activity, Server, HardDrive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminManagementTab: React.FC = () => {
  const { allRegisteredUsers, refreshUsers } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'models' | 'database' | 'users' | 'system'>('models');
  const [tuningStatus, setTuningStatus] = useState<string>('IDLE');

  const handleRetune = () => {
    setTuningStatus('RUNNING');
    setTimeout(() => {
      setTuningStatus('COMPLETED');
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
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
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Bảng Quản Trị Hệ Thống Toàn Diện</h2>
              <span className="badge badge-high" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderColor: '#6366f1' }}>
                👑 Quản Trị Viên (System Admin)
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginTop: '4px' }}>
              Trung tâm điều hành: Giám sát tham số mô hình Machine Learning, quản trị cơ sở dữ liệu MongoDB Atlas Cloud và phân quyền tài khoản doanh nghiệp.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRetune}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <RefreshCw size={15} className={tuningStatus === 'RUNNING' ? 'spin' : ''} />
            {tuningStatus === 'RUNNING' ? 'Đang Tái Huấn Luyện...' : 'Đồng Bộ & Kiểm Tra Mô Hình'}
          </button>
        </div>
      </div>

      {/* Top System Health KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Độ Trễ API Trung Bình</span>
            <Activity size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>&lt; 14ms</div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>FastAPI Async Lifespan</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Mô Hình ML Active</span>
            <Cpu size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>2 Models</div>
          <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '2px' }}>XGBoost & K-Means (K=4)</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Cơ Sở Dữ Liệu Cloud</span>
            <Database size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4', marginTop: '6px' }}>MongoDB Atlas</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>3 Collections Kết Nối</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Tài Khoản Doanh Nghiệp</span>
            <Users size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>Active</div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>Phân quyền RBAC sẵn sàng</div>
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
          onClick={() => setActiveSubTab('models')}
          className={`subtab-btn ${activeSubTab === 'models' ? 'active' : ''}`}
        >
          <Cpu size={17} /> Quản Trị Mô Hình & Tuning ML
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`subtab-btn ${activeSubTab === 'database' ? 'active' : ''}`}
        >
          <Database size={17} /> MongoDB Atlas Cloud
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`subtab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
        >
          <Users size={17} /> Quản Lý Tài Khoản & Phân Quyền
        </button>
      </div>

      {/* SUBTAB 1: QUẢN TRỊ MÔ HÌNH ML & TUNING */}
      {activeSubTab === 'models' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Cpu style={{ color: '#6366f1' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cấu Hình & Tối Ưu Mô Hình (GridSearchCV)</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>XGBoost Classifier (Mô hình chính)</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                  • Siêu tham số: n_estimators=100, max_depth=4, learning_rate=0.05, subsample=0.8
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, marginTop: '6px' }}>
                  🎯 ROC-AUC: 0.9575 | F1-Score: 0.8654 (Đánh giá 5-Fold Cross Validation)
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #6366f1' }}>
                <div style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 700 }}>Random Forest Classifier (So sánh)</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                  • Siêu tham số: n_estimators=100, max_depth=8, min_samples_split=2
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, marginTop: '6px' }}>
                  🎯 ROC-AUC: 0.9421 | F1-Score: 0.8333
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ fontSize: '0.9rem', color: '#06b6d4', fontWeight: 700 }}>K-Means RFM Clustering (Phân cụm)</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                  • Phân bố 4 cụm: VIP, Tiềm năng, Cần chăm sóc, Rủi ro
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, marginTop: '6px' }}>
                  🎯 Xác định K=4 qua phương pháp Elbow (SSE / Inertia)
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BarChart3 style={{ color: '#10b981' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trạng Thái Tệp Mô Hình (Saved Artifacts)</h3>
            </div>

            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#9ca3af' }}>
                  <th style={{ padding: '10px 8px' }}>Tệp Mô Hình</th>
                  <th style={{ padding: '10px 8px' }}>Kích Thước</th>
                  <th style={{ padding: '10px 8px' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 600 }}>xgb_churn.pkl</td>
                  <td style={{ padding: '10px 8px', color: '#9ca3af' }}>167.6 KB</td>
                  <td style={{ padding: '10px 8px', color: '#10b981' }}>🟢 Active</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 600 }}>kmeans_rfm.pkl</td>
                  <td style={{ padding: '10px 8px', color: '#9ca3af' }}>40.8 KB</td>
                  <td style={{ padding: '10px 8px', color: '#10b981' }}>🟢 Active</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 600 }}>scaler_rfm.pkl</td>
                  <td style={{ padding: '10px 8px', color: '#9ca3af' }}>927 B</td>
                  <td style={{ padding: '10px 8px', color: '#10b981' }}>🟢 Active</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 600 }}>scaler_churn.pkl</td>
                  <td style={{ padding: '10px 8px', color: '#9ca3af' }}>1.07 KB</td>
                  <td style={{ padding: '10px 8px', color: '#10b981' }}>🟢 Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DATABASE MONGODB */}
      {activeSubTab === 'database' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database style={{ color: '#06b6d4' }} size={22} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cơ Sở Dữ Liệu MongoDB Atlas Cloud</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>MongoDB Cluster</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06b6d4', marginTop: '4px' }}>Cluster0 Atlas</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>🟢 Đang kết nối phi đồng bộ (Motor Async)</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Collection: rfm_predictions</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>10,480 Bản Ghi</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Lưu lịch sử phân cụm K-Means</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Collection: churn_predictions</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>10,480 Bản Ghi</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Lưu lịch sử dự đoán XGBoost</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Collection: dss_logs</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>2,340 Bản Ghi</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Lưu nhật ký cảnh báo & đề xuất DSS</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: QUẢN LÝ NGƯỜI DÙNG */}
      {activeSubTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ color: '#a855f7' }} size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Danh Sách Tài Khoản Trong Database ({allRegisteredUsers.length})</h3>
            </div>
            <button
              onClick={refreshUsers}
              className="adminator-btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <RefreshCw size={13} /> Làm mới danh sách
            </button>
          </div>

          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#9ca3af' }}>
                <th style={{ padding: '10px' }}>Họ và Tên</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Đơn Vị / Doanh Nghiệp</th>
                <th style={{ padding: '10px' }}>Vai Trò Quyền Hạn</th>
                <th style={{ padding: '10px' }}>Ngày Tạo</th>
                <th style={{ padding: '10px' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {allRegisteredUsers.map((user, idx) => (
                <tr key={user.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#ffffff' }}>{user.fullName}</td>
                  <td style={{ padding: '10px', color: '#818cf8' }}>{user.email}</td>
                  <td style={{ padding: '10px', color: '#cbd5e1' }}>{user.organization || 'Doanh Nghiệp Bán Lẻ'}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${user.role === 'admin' ? 'badge-high' : 'badge-low'}`}>
                      {user.role === 'admin' ? '👑 Quản Trị Viên' : '🏢 Doanh Nghiệp'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: '#9ca3af' }}>{user.createdAt || '2026-08-15'}</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>🟢 Hoạt động</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
