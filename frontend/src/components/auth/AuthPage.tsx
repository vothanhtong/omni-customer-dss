import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types/auth';
import {
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  KeyRound,
  X,
  Star,
  Globe,
  Zap,
  CheckCircle,
  Database,
  Loader2
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, quickLoginAs, closeAuthPage } = useAuth();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Form States
  const [email, setEmail] = useState<string>('admin@omni-dss.vn');
  const [password, setPassword] = useState<string>('admin123');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [role, setRole] = useState<RoleType>('business_user');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
        showToast('Đăng nhập thành công! Đang chuyển hướng vào hệ thống...');
      } else {
        if (!fullName.trim()) {
          throw new Error('Vui lòng nhập họ và tên của bạn.');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có tối thiểu 6 ký tự.');
        }
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }
        await register({
          email,
          password,
          fullName,
          role,
          organization: organization.trim() || 'Doanh Nghiệp Bán Lẻ'
        });
        showToast('Tạo tài khoản thành công! Đã lưu trữ an toàn vào Database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType: RoleType) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await quickLoginAs(roleType);
      showToast(`Đã đăng nhập nhanh với vai trò ${roleType === 'admin' ? 'Quản Trị Viên Hệ Thống' : 'Người Dùng Doanh Nghiệp'}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể đăng nhập demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotStatus('sending');
    setTimeout(() => {
      setForgotStatus('sent');
      showToast('Đã gửi mã khôi phục mật khẩu đến email của bạn!');
    }, 1000);
  };

  return (
    <div className="auth-split-screen">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="auth-toast-banner">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CỘT TRÁI: HERO VIBRANT GRADIENT VỚI HIỆU ỨNG CHUYỂN ĐỘNG (100% TIẾNG VIỆT)  */}
      {/* ========================================================================= */}
      <div className="auth-hero-col animated-gradient-hero">
        {/* Floating background glowing orbs */}
        <div className="hero-glow-orb orb-1"></div>
        <div className="hero-glow-orb orb-2"></div>

        {/* Top Brand & Rating */}
        <div className="auth-hero-top-row hero-fade-in">
          <div className="auth-brand-badge">
            <div className="auth-logo-icon pulse-logo">A</div>
            <div className="auth-brand-info">
              <span className="auth-brand-name">Omni DSS</span>
              <span className="auth-brand-subtag">Hệ Thống Ra Quyết Định Đa Kênh</span>
            </div>
          </div>
          <div className="auth-rating-pill float-pill">
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span>★ 5.0 Tin Cậy Doanh Nghiệp</span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="auth-hero-content hero-slide-up">
          <div className="auth-version-tag">
            <Sparkles size={14} color="#60a5fa" />
            <span>PHIÊN BẢN 2026 · HỆ THỐNG QUẢN TRỊ V3.1 ENTERPRISE</span>
          </div>

          <h1 className="auth-hero-title">
            Bảng điều khiển thông minh mà đội ngũ của bạn muốn mở mỗi ngày.
          </h1>

          <p className="auth-hero-desc">
            Tốc độ xử lý quyết định dưới 14ms, dữ liệu giao dịch chuẩn hóa đa kênh và động cơ học máy tự động – nâng tầm từ phân cụm RFM đơn lẻ đến không gian tác nghiệp tiếp thị cá nhân hóa toàn diện.
          </p>

          {/* 3 Điểm Nhấn Tính Năng Nổi Bật (Thay thế cho phần trích dẫn cũ) */}
          <div className="hero-feature-highlights">
            <div className="highlight-pill-item">
              <div className="highlight-icon-box"><Zap size={16} color="#60a5fa" /></div>
              <div>
                <div className="highlight-title">Phản Hồi Siêu Tốc</div>
                <div className="highlight-desc">Xử lý quy tắc DSS & dự báo Churn &lt; 14ms</div>
              </div>
            </div>

            <div className="highlight-pill-item">
              <div className="highlight-icon-box"><CheckCircle size={16} color="#34d399" /></div>
              <div>
                <div className="highlight-title">Mô Hình Học Máy Chuẩn Xác</div>
                <div className="highlight-desc">XGBoost 91.50% Accuracy & ROC-AUC 0.9575</div>
              </div>
            </div>

            <div className="highlight-pill-item">
              <div className="highlight-icon-box"><Database size={16} color="#fbbf24" /></div>
              <div>
                <div className="highlight-title">Đồng Bộ MongoDB Atlas Cloud</div>
                <div className="highlight-desc">Lưu trữ phân khúc và lịch sử cảnh báo an toàn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Footer */}
        <div className="auth-hero-footer hero-fade-in">
          © 2026 · HỆ THỐNG DSS BÁN HÀNG ĐA KÊNH · BẢO MẬT CHUẨN ISO/IEC 27001
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI: FORM AUTHENTICATION THANH LỊCH (100% TIẾNG VIỆT)                */}
      {/* ========================================================================= */}
      <div className="auth-form-col">
        {/* Top Navigation */}
        <div className="auth-top-nav">
          <button onClick={closeAuthPage} className="auth-back-btn" title="Quay lại Bảng điều khiển">
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>

          <div className="auth-switch-mode">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
                if (isLogin) {
                  setEmail('');
                  setPassword('');
                } else {
                  setEmail('admin@omni-dss.vn');
                  setPassword('admin123');
                }
              }}
            >
              {isLogin ? 'Tạo tài khoản mới' : 'Đăng nhập ngay'}
            </button>
          </div>
        </div>

        {/* Centered Form Wrapper */}
        <div className="auth-form-wrapper form-fade-in">
          <div className="auth-form-header">
            <h2 className="auth-title">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Đăng nhập vào không gian làm việc Omni DSS để tiếp tục quản trị và ra quyết định.'
                : 'Bắt đầu trải nghiệm nền tảng Hỗ trợ ra Quyết định Đa Kênh hàng đầu.'}
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-banner">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-main-form">
            {/* Trường Họ Tên (Chỉ khi đăng ký) */}
            {!isLogin && (
              <div className="auth-field-group">
                <label className="auth-label">Họ và tên của bạn</label>
                <div className="auth-input-container">
                  <User size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="auth-text-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Trường Email */}
            <div className="auth-field-group">
              <label className="auth-label">Email công việc</label>
              <div className="auth-input-container">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="auth-text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Trường Tên Doanh Nghiệp & Vai Trò (Chỉ khi đăng ký) */}
            {!isLogin && (
              <>
                <div className="auth-field-group">
                  <label className="auth-label">Tên Doanh nghiệp / Chuỗi bán lẻ</label>
                  <div className="auth-input-container">
                    <Building size={18} className="auth-field-icon" />
                    <input
                      type="text"
                      placeholder="Ví dụ: OmniRetail Corporation"
                      className="auth-text-input"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Phân quyền tài khoản</label>
                  <div className="auth-input-container">
                    <ShieldCheck size={18} className="auth-field-icon" />
                    <select
                      className="auth-text-input auth-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as RoleType)}
                    >
                      <option value="business_user">🏢 Doanh Nghiệp (Marketing & CSKH)</option>
                      <option value="admin">👑 Quản Trị Viên Hệ Thống (System Admin)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Trường Mật Khẩu */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label className="auth-label">Mật khẩu bảo mật</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                      setForgotStatus('idle');
                    }}
                    className="auth-forgot-link-btn"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="auth-input-container">
                <Lock size={18} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="auth-text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye-btn"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Trường Xác Nhận Mật Khẩu (Chỉ khi đăng ký) */}
            {!isLogin && (
              <div className="auth-field-group">
                <label className="auth-label">Xác nhận lại mật khẩu</label>
                <div className="auth-input-container">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="auth-text-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-eye-btn"
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox Remember Me */}
            {isLogin && (
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Ghi nhớ đăng nhập trong 30 ngày</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="auth-submit-btn hover-lift">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={18} className="spin-loader" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  {isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản ngay'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Phân Cách Đăng Nhập Nhanh */}
          <div className="auth-divider-row">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">HOẶC ĐĂNG NHẬP NHANH (DEMO)</span>
            <div className="auth-divider-line"></div>
          </div>

          {/* Quick Demo Buttons */}
          <div className="auth-quick-buttons">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="auth-social-btn demo-admin-btn hover-scale"
              title="Đăng nhập với vai trò Quản Trị Viên"
            >
              <ShieldCheck size={18} color="#2563eb" />
              <span>👑 Admin Quản Trị</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('business_user')}
              className="auth-social-btn demo-biz-btn hover-scale"
              title="Đăng nhập với vai trò Doanh Nghiệp"
            >
              <Briefcase size={18} color="#10b981" />
              <span>🏢 Doanh Nghiệp</span>
            </button>
          </div>

          {/* Footer Terms */}
          <div className="auth-terms-footer">
            Bằng việc tiếp tục, bạn đồng ý với <a href="#terms" onClick={(e) => e.preventDefault()}>Điều khoản sử dụng</a> và{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a> của Omni DSS.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL QUÊN MẬT KHẨU (FORGOT PASSWORD MODAL)                               */}
      {/* ========================================================================= */}
      {isForgotModalOpen && (
        <div className="drawer-overlay" onClick={() => setIsForgotModalOpen(false)}>
          <div className="forgot-password-modal modal-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Khôi Phục Mật Khẩu</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsForgotModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {forgotStatus === 'sent' ? (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto' }} />
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Đã Gửi Hướng Dẫn!</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                    Chúng tôi đã gửi đường link đặt lại mật khẩu và mã OTP thử nghiệm tới: <strong>{forgotEmail}</strong>.
                  </p>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    🔑 Mã OTP Thử Nghiệm: <strong style={{ color: '#2563eb', letterSpacing: '2px' }}>889922</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="auth-submit-btn hover-lift"
                    style={{ marginTop: '12px' }}
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendForgotEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                    Nhập địa chỉ email doanh nghiệp đã đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu trong vài giây.
                  </p>
                  <div className="auth-field-group">
                    <label className="auth-label">Email đã đăng ký</label>
                    <div className="auth-input-container">
                      <Mail size={18} className="auth-field-icon" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="auth-text-input"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={forgotStatus === 'sending'} className="auth-submit-btn hover-lift">
                    {forgotStatus === 'sending' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} className="spin-loader" />
                        <span>Đang gửi mã...</span>
                      </div>
                    ) : (
                      'Gửi mã khôi phục →'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
