import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  Store,
  Upload,
  CheckCircle2,
  X,
  Camera,
  Shield,
  Save,
  Briefcase,
  LogOut,
  Trash2,
  Loader2
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { currentUser, isProfileModalOpen, closeProfileModal, updateProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'enterprise' | 'personal'>('enterprise');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Fields State
  const [fullName, setFullName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [taxCode, setTaxCode] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Bán lẻ đa kênh (Omnichannel Retail)');
  const [storeCount, setStoreCount] = useState<string>('6 - 20 Chi nhánh cửa hàng');
  const [website, setWebsite] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setOrganization(currentUser.organization || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setTaxCode(currentUser.taxCode || '');
      setIndustry(currentUser.industry || 'Bán lẻ đa kênh (Omnichannel Retail)');
      setStoreCount(currentUser.storeCount || '6 - 20 Chi nhánh cửa hàng');
      setWebsite(currentUser.website || '');
    }
  }, [currentUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarUrl(compressedDataUrl);
          } else {
            setAvatarUrl(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleLogout = () => {
    closeProfileModal();
    logout();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        fullName,
        organization,
        avatarUrl,
        phone,
        address,
        taxCode,
        industry,
        storeCount,
        website
      });
      setToastMsg('Đã cập nhật và lưu hồ sơ doanh nghiệp vào MongoDB Atlas thành công!');
      setTimeout(() => {
        setToastMsg(null);
        closeProfileModal();
      }, 1400);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={closeProfileModal}>
      <div className="profile-modal-panel modal-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Toast Alert inside modal */}
        {toastMsg && (
          <div className="profile-toast-alert">
            <CheckCircle2 size={18} color="#10b981" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-title-box">
            <div className="profile-title-icon">
              <Building size={22} color="#ffffff" />
            </div>
            <div>
              <h3 className="profile-main-title">Hồ Sơ Doanh Nghiệp & Tài Khoản</h3>
              <p className="profile-sub-title">Cập nhật thông tin nhận diện, quy mô chuỗi và lưu trữ vào MongoDB</p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={closeProfileModal} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Avatar Top Section - Tinh Gọn */}
        <div className="profile-avatar-customizer">
          <div className="avatar-preview-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-preview-img" />
            ) : (
              <div className="avatar-preview-fallback">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <label className="avatar-upload-badge" title="Tải ảnh đại diện mới từ máy tính">
              <Camera size={14} color="#ffffff" />
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="avatar-controls-col">
            <div className="avatar-info-row">
              <h4 className="avatar-user-name">{fullName || currentUser.fullName}</h4>
              <span className="avatar-user-role-badge">
                <Shield size={12} /> {currentUser.roleTitle}
              </span>
            </div>
            <p className="avatar-help-text">
              {currentUser.organization || 'Doanh Nghiệp Bán Lẻ Đa Kênh'} · ID: <code style={{ color: '#2563eb' }}>{currentUser.id}</code>
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <label className="adminator-btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Tải ảnh từ thiết bị
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="adminator-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  title="Xóa ảnh đại diện tùy chỉnh"
                >
                  <Trash2 size={14} /> Xóa ảnh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-nav-tabs">
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'enterprise' ? 'active' : ''}`}
            onClick={() => setActiveTab('enterprise')}
          >
            <Building size={16} /> Thông Tin Doanh Nghiệp & Chuỗi
          </button>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={16} /> Thông Tin Người Đại Diện
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="profile-form-body">
          {activeTab === 'enterprise' ? (
            <div className="profile-form-grid">
              <div className="form-group full-width">
                <label className="form-label">Tên Doanh Nghiệp / Chuỗi Bán Lẻ</label>
                <div className="auth-input-container">
                  <Building size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tập Đoàn Bán Lẻ Đa Kênh OmniRetail Corp"
                    className="auth-text-input"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mã Số Thuế / Giấy Phép KD</label>
                <div className="auth-input-container">
                  <FileText size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="Ví dụ: 0314899988"
                    className="auth-text-input"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quy Mô Chuỗi Cửa Hàng</label>
                <div className="auth-input-container">
                  <Store size={16} className="auth-field-icon" />
                  <select
                    className="auth-text-input auth-select"
                    value={storeCount}
                    onChange={(e) => setStoreCount(e.target.value)}
                  >
                    <option value="1 - 5 Cửa hàng / Chi nhánh">1 - 5 Cửa hàng / Chi nhánh</option>
                    <option value="6 - 20 Chi nhánh cửa hàng">6 - 20 Chi nhánh cửa hàng</option>
                    <option value="20+ Chuỗi siêu thị toàn quốc">20+ Chuỗi siêu thị toàn quốc</option>
                    <option value="50+ Hệ thống bán lẻ đa kênh">50+ Hệ thống bán lẻ đa kênh</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Ngành Hàng Kinh Doanh Đa Kênh</label>
                <div className="auth-input-container">
                  <Briefcase size={16} className="auth-field-icon" />
                  <select
                    className="auth-text-input auth-select"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="Bán lẻ đa kênh (Omnichannel Retail)">Bán lẻ đa kênh (Omnichannel Retail)</option>
                    <option value="Thời trang & Phụ kiện May mặc">Thời trang & Phụ kiện May mặc</option>
                    <option value="Điện máy, Gia dụng & Công nghệ">Điện máy, Gia dụng & Công nghệ</option>
                    <option value="Hàng tiêu dùng nhanh (FMCG) & Siêu thị">Hàng tiêu dùng nhanh (FMCG) & Siêu thị</option>
                    <option value="Mỹ phẩm, Dược & Chăm sóc sức khỏe">Mỹ phẩm, Dược & Chăm sóc sức khỏe</option>
                    <option value="Ẩm thực & Đồ uống (F&B)">Ẩm thực & Đồ uống (F&B)</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Địa Chỉ Trụ Sở Chính</label>
                <div className="auth-input-container">
                  <MapPin size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="Tòa nhà, Đường, Quận/Huyện, Tỉnh/TP"
                    className="auth-text-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Website Doanh Nghiệp</label>
                <div className="auth-input-container">
                  <Globe size={16} className="auth-field-icon" />
                  <input
                    type="url"
                    placeholder="https://yourcompany.com"
                    className="auth-text-input"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-form-grid">
              <div className="form-group full-width">
                <label className="form-label">Họ và Tên Người Đại Diện</label>
                <div className="auth-input-container">
                  <User size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên"
                    className="auth-text-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Tài Khoản (Không đổi)</label>
                <div className="auth-input-container">
                  <Mail size={16} className="auth-field-icon" />
                  <input
                    type="email"
                    disabled
                    className="auth-text-input"
                    value={currentUser.email}
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số Điện Thoại Liên Hệ</label>
                <div className="auth-input-container">
                  <Phone size={16} className="auth-field-icon" />
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    className="auth-text-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Đường Dẫn URL Ảnh Đại Diện (Tùy Chọn)</label>
                <div className="auth-input-container">
                  <Upload size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="https://domain.com/avatar.jpg"
                    className="auth-text-input"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="profile-modal-footer">
            {/* Nút Đăng Xuất Tài Khoản */}
            <button
              type="button"
              onClick={handleLogout}
              className="adminator-btn-secondary btn-logout"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={16} color="#f43f5e" />
              <span style={{ color: '#f43f5e' }}>Đăng xuất</span>
            </button>

            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button type="button" onClick={closeProfileModal} className="adminator-btn-secondary">
                Hủy bỏ
              </button>
              <button type="submit" disabled={loading} className="adminator-btn-primary hover-lift">
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-loader" />
                    <span>Đang lưu Database...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Lưu Thay Đổi Vào Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
