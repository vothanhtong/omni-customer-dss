import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  LayoutDashboard,
  PieChart,
  BrainCircuit,
  AlertTriangle,
  ShieldCheck,
  Briefcase,
  Sparkles,
  Building,
  UserCog,
  FileText,
  GraduationCap
} from 'lucide-react';
import { BrandMark } from '../brand/BrandMark';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, switchRole, openProfileModal } = useAuth();

  return (
    <aside className="adminator-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
        <BrandMark size={38} className="sidebar-brand-logo" />
        <div className="sidebar-brand-text">
          <div className="brand-name brand-wordmark">Omni<b>DSS</b></div>
          <div className="brand-version">Hỗ trợ ra quyết định đa kênh</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Section 1: WORKSPACE */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">WORKSPACE</div>
          
          <button
            onClick={() => setActiveTab('home')}
            className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Trang Chủ</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal')}
            className={`sidebar-nav-item ${activeTab === 'proposal' ? 'active' : ''}`}
            title="Thuyết minh Đề tài Nghiên cứu Khoa học Sinh viên"
          >
            <GraduationCap size={18} color="#a855f7" />
            <span>Thuyết Minh NCKH</span>
            <span className="sidebar-pro-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}>NTU</span>
          </button>

          <button
            onClick={openProfileModal}
            className="sidebar-nav-item promo-item"
            title="Nhấp để cập nhật thông tin doanh nghiệp & đổi Avatar"
          >
            <Building size={18} color="#60a5fa" />
            <span>Hồ Sơ Doanh Nghiệp</span>
            <span className="sidebar-pro-badge">EDIT</span>
          </button>
        </div>

        {/* Section 2: DECISION SUPPORT & ANALYTICS */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">DECISION SUPPORT & ANALYTICS</div>
          
          <button
            onClick={() => setActiveTab('rfm')}
            className={`sidebar-nav-item ${activeTab === 'rfm' ? 'active' : ''}`}
          >
            <PieChart size={18} />
            <span>Phân Cụm RFM</span>
          </button>

          <button
            onClick={() => setActiveTab('dss')}
            className={`sidebar-nav-item ${activeTab === 'dss' ? 'active' : ''}`}
          >
            <BrainCircuit size={18} />
            <span>Dự Đoán & DSS</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`sidebar-nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
          >
            <AlertTriangle size={18} />
            <span>Cảnh Báo Churn</span>
            <span className="sidebar-counter-badge">HOT</span>
          </button>
        </div>

        {/* Section 3: PORTALS & WORKSPACES */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">PORTALS & WORKSPACES</div>

          <button
            onClick={() => setActiveTab('business_panel')}
            className={`sidebar-nav-item ${activeTab === 'business_panel' ? 'active' : ''}`}
          >
            <Briefcase size={18} />
            <span>Không Gian Doanh Nghiệp</span>
          </button>

          <button
            onClick={() => setActiveTab('admin_panel')}
            className={`sidebar-nav-item ${activeTab === 'admin_panel' ? 'active' : ''}`}
          >
            <ShieldCheck size={18} />
            <span>Quản Trị Hệ Thống</span>
          </button>

          <button
            onClick={switchRole}
            className="sidebar-nav-item"
            style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '8px' }}
            title="Đổi vai trò giữa Admin và Doanh Nghiệp"
          >
            <Sparkles size={16} color="#eab308" />
            <span>Chuyển Vai Trò Nhanh</span>
          </button>
        </div>
      </div>

      {/* User Footer Profile Card */}
      <div className="sidebar-user-footer">
        <div
          className="sidebar-user-card"
          onClick={openProfileModal}
          title="Nhấp để cập nhật thông tin doanh nghiệp hoặc đổi Avatar"
        >
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" className="sidebar-avatar-img" />
          ) : (
            <div className="sidebar-avatar">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {currentUser?.fullName || 'Võ Thanh Tòng'}
            </div>
            <div className="sidebar-user-role">
              {currentUser?.organization ? currentUser.organization.substring(0, 20) + '...' : currentUser?.roleTitle}
            </div>
          </div>
          <UserCog size={16} color="#94a3b8" />
        </div>
      </div>
    </aside>
  );
};
