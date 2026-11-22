import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationChat } from '../../context/NotificationChatContext';
import { Search, Bell, MessageSquare, Sun, Moon, ChevronRight, UserCog } from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeTab }) => {
  const { currentUser, openProfileModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    openNotificationDrawer,
    unreadNotificationCount,
    openChatDrawer,
    unreadChatCount
  } = useNotificationChat();

  const getTabLabel = () => {
    switch (activeTab) {
      case 'home': return 'Trang Chủ Chào Mừng';
      case 'overview': return 'Bảng Điều Khiển DSS';
      case 'proposal': return 'Thuyết Minh Đề Tài NCKH';
      case 'rfm': return 'Phân Cụm RFM';
      case 'dss': return 'Dự Đoán & Động Cơ DSS';
      case 'alerts': return 'Cảnh Báo Churn Khẩn Cấp';
      case 'admin_panel': return 'Quản Trị Hệ Thống';
      case 'business_panel': return 'Không Gian Doanh Nghiệp';
      default: return 'Trang Chủ Chào Mừng';
    }
  };

  return (
    <header className="adminator-top-header">
      {/* Breadcrumb Left */}
      <div className="header-breadcrumb">
        <span className="breadcrumb-root">Workspace</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">{getTabLabel()}</span>
      </div>

      {/* Right Controls: Search, Notifications, Chat, Theme, Avatar */}
      <div className="header-right-controls">
        {/* Search Bar */}
        <div className="header-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm khách hàng, báo cáo..."
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        {/* Action Icon: Notifications */}
        <button
          onClick={openNotificationDrawer}
          className="header-icon-btn"
          title="Xem thông báo cảnh báo Churn & Hệ thống"
        >
          <Bell size={18} />
          {unreadNotificationCount > 0 && (
            <span className="header-badge badge-danger">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Action Icon: Messages / Live Chat */}
        <button
          onClick={openChatDrawer}
          className="header-icon-btn"
          title="Mở trợ lý gợi ý theo luật & ghi chú CSKH"
        >
          <MessageSquare size={18} />
          {unreadChatCount > 0 && (
            <span className="header-badge badge-info">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Action Icon: Theme Toggle (Sáng / Tối) */}
        <button
          onClick={toggleTheme}
          className="header-icon-btn"
          title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* User Profile Avatar */}
        <div
          className="header-user-avatar-btn"
          onClick={openProfileModal}
          title="Hồ Sơ Doanh Nghiệp & Đổi Avatar (Nhấp để chỉnh sửa)"
        >
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" className="header-avatar-img" />
          ) : (
            <div className="header-user-avatar">
              {currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'VT'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
