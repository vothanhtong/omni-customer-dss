import React from 'react';
import { useNotificationChat } from '../../context/NotificationChatContext';
import { X, Bell, Check, Trash2, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    closeNotificationDrawer,
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadNotificationCount
  } = useNotificationChat();

  if (!isNotificationDrawerOpen) return null;

  return (
    <div className="drawer-overlay" onClick={closeNotificationDrawer}>
      <div className="notification-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Thông Báo Hệ Thống</h3>
            {unreadNotificationCount > 0 && (
              <span className="badge badge-high" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                {unreadNotificationCount} mới
              </span>
            )}
          </div>
          <button className="drawer-close-btn" onClick={closeNotificationDrawer} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="drawer-actions-bar">
          <button onClick={markAllAsRead} className="drawer-text-btn">
            <Check size={14} /> Đánh dấu đã đọc
          </button>
          <button onClick={clearNotifications} className="drawer-text-btn text-danger">
            <Trash2 size={14} /> Xóa tất cả
          </button>
        </div>

        {/* Notification Items List */}
        <div className="drawer-content-list">
          {notifications.length === 0 ? (
            <div className="drawer-empty-state">
              <Bell size={36} color="#64748b" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p>Hiện không có thông báo mới nào.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const getIcon = () => {
                switch (notif.type) {
                  case 'danger': return <AlertCircle size={18} color="#f43f5e" />;
                  case 'warning': return <AlertTriangle size={18} color="#f59e0b" />;
                  case 'success': return <CheckCircle size={18} color="#10b981" />;
                  default: return <Info size={18} color="#06b6d4" />;
                }
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`notif-card-item ${notif.read ? 'read' : 'unread'} type-${notif.type}`}
                >
                  <div className="notif-icon-col">
                    {getIcon()}
                  </div>
                  <div className="notif-body-col">
                    <div className="notif-item-header">
                      <h4 className="notif-item-title">{notif.title}</h4>
                      <span className="notif-item-time">{notif.time}</span>
                    </div>
                    <p className="notif-item-msg">{notif.message}</p>
                    {notif.actionLabel && (
                      <button className="notif-action-pill" onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}>
                        {notif.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
