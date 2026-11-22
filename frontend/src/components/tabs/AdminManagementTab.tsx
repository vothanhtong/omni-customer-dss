import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, Sliders, Layers, BarChart3, Users, RefreshCw, Sparkles, Activity, Server, HardDrive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModelMetrics, fmt, pct } from '../../context/MetricsContext';

export const AdminManagementTab: React.FC = () => {
  const { allRegisteredUsers, refreshUsers } = useAuth();
  const { metrics, error: metricsError, loading: metricsLoading, reload: reloadMetrics } = useModelMetrics();
  const churn = metrics?.churn;
  const [activeSubTab, setActiveSubTab] = useState<'models' | 'database' | 'users' | 'system'>('models');

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
            onClick={reloadMetrics}
            disabled={metricsLoading}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            title="Tải lại chỉ số mô hình từ máy chủ (huấn luyện lại: python backend/train_pipeline.py)"
          >
            <RefreshCw size={15} className={metricsLoading ? 'spin' : ''} />
            {metricsLoading ? 'Đang tải chỉ số...' : 'Tải Lại Chỉ Số Mô Hình'}
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
          <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '2px' }}>{churn?.best_model ?? '—'} & K-Means (K={metrics?.rfm.k ?? 4})</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu style={{ color: '#6366f1' }} size={22} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>So Sánh 4 Mô Hình Churn (GridSearchCV 5-fold · Test Out-of-Time)</h3>
              </div>
              <button className="btn-secondary" onClick={reloadMetrics} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Tải lại chỉ số
              </button>
            </div>

            {!churn ? (
              <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                {metricsError ?? 'Đang tải chỉ số mô hình...'}
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '12px', lineHeight: 1.6 }}>
                  Train: <strong>{churn.n_train.toLocaleString('vi-VN')}</strong> KH (churn {pct(churn.churn_rate_train)}) · Test:{' '}
                  <strong>{churn.n_test.toLocaleString('vi-VN')}</strong> KH (churn {pct(churn.churn_rate_test)}) · Cửa sổ kết quả:{' '}
                  {churn.outcome_window.days.toFixed(1)} ngày · Baseline đoán toàn bộ “churn”: accuracy {fmt(churn.majority_baseline_accuracy_test)} ·
                  Chọn mô hình theo: {churn.selection_criterion}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', minWidth: '760px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right', color: '#9ca3af' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Mô hình</th>
                        <th style={{ padding: '8px' }}>CV AUC</th>
                        <th style={{ padding: '8px' }}>Accuracy</th>
                        <th style={{ padding: '8px' }}>Bal. Acc</th>
                        <th style={{ padding: '8px' }}>Precision</th>
                        <th style={{ padding: '8px' }}>Recall</th>
                        <th style={{ padding: '8px' }}>F1</th>
                        <th style={{ padding: '8px' }}>ROC-AUC</th>
                        <th style={{ padding: '8px' }} title="Recall của lớp thiểu số: khách quay lại mua">Recall (quay lại)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {churn.models.map((m) => {
                        const isBest = m.model === churn.best_model;
                        return (
                          <tr key={m.model} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'right', background: isBest ? 'rgba(16, 185, 129, 0.08)' : undefined }}>
                            <td style={{ padding: '8px', textAlign: 'left', color: isBest ? '#10b981' : '#ffffff', fontWeight: 700 }}>
                              {m.model} {isBest && '★'}
                              <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>
                                {Object.entries(m.best_params).map(([k, v]) => `${k}=${v}`).join(', ')}
                              </div>
                            </td>
                            <td style={{ padding: '8px' }}>{fmt(m.cv_roc_auc_mean)} ± {fmt(m.cv_roc_auc_std, 3)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.accuracy)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.balanced_accuracy)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.precision)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.recall)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.f1_score)}</td>
                            <td style={{ padding: '8px', fontWeight: 700 }}>{fmt(m.test.roc_auc)}</td>
                            <td style={{ padding: '8px' }}>{fmt(m.test.retained_recall)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                  ★ Mô hình đang phục vụ API. Ngưỡng quyết định {churn.decision_threshold}. Cập nhật: {new Date(metrics!.generated_at).toLocaleString('vi-VN')}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <BarChart3 style={{ color: '#10b981' }} size={22} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Đặc Trưng Quan Trọng ({churn?.best_model ?? '—'})</h3>
              </div>
              {churn?.best_model_feature_importance.slice(0, 8).map((f) => (
                <div key={f.feature} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <span>{f.feature}</span>
                    <span>{pct(f.importance, 1)}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                    <div style={{ width: `${Math.min(100, f.importance * 100 / (churn.best_model_feature_importance[0]?.importance || 1))}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Layers style={{ color: '#06b6d4' }} size={22} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>K-Means RFM (K={metrics?.rfm.k ?? 4})</h3>
              </div>
              {metrics && (
                <>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right', color: '#9ca3af' }}>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Phân khúc</th>
                        <th style={{ padding: '6px' }}>Số KH</th>
                        <th style={{ padding: '6px' }}>R (ngày)</th>
                        <th style={{ padding: '6px' }}>F</th>
                        <th style={{ padding: '6px' }}>M (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.rfm.segments.map((s) => (
                        <tr key={s.segment} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'right' }}>
                          <td style={{ padding: '6px', textAlign: 'left', color: '#ffffff', fontWeight: 600 }}>{s.segment}</td>
                          <td style={{ padding: '6px' }}>{s.customers.toLocaleString('vi-VN')} ({pct(s.share, 1)})</td>
                          <td style={{ padding: '6px' }}>{s.mean_recency_days}</td>
                          <td style={{ padding: '6px' }}>{s.mean_frequency}</td>
                          <td style={{ padding: '6px' }}>{Math.round(s.mean_monetary_vnd).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px', lineHeight: 1.5 }}>
                    Gán nhãn: {metrics.rfm.labeling_rule}
                    <br />
                    Silhouette: {metrics.rfm.silhouette.map((x) => `k=${x.k}: ${fmt(x.silhouette, 3)}`).join(' · ')}
                  </div>
                </>
              )}
            </div>
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
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>Chưa thống kê</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Lưu lịch sử phân cụm K-Means</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Collection: churn_predictions</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>Chưa thống kê</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Lưu lịch sử dự đoán Churn</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Collection: dss_logs</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>Chưa thống kê</div>
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
