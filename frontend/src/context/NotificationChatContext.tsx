import React, { createContext, useContext, useState, useEffect } from 'react';
import { useModelMetrics, fmt } from './MetricsContext';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  time: string;
  read: boolean;
  actionLabel?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'cskh_staff';
  senderName: string;
  avatar: string;
  text: string;
  time: string;
  channel: 'dss_ai' | 'cskh_team';
}

interface NotificationChatContextType {
  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isNotificationDrawerOpen: boolean;
  openNotificationDrawer: () => void;
  closeNotificationDrawer: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // Live Chat
  messages: ChatMessage[];
  activeChatChannel: 'dss_ai' | 'cskh_team';
  setActiveChatChannel: (channel: 'dss_ai' | 'cskh_team') => void;
  isChatDrawerOpen: boolean;
  openChatDrawer: () => void;
  closeChatDrawer: () => void;
  sendMessage: (text: string) => void;
  unreadChatCount: number;
}

const NotificationChatContext = createContext<NotificationChatContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF_01',
    title: '🔴 Cảnh Báo Churn Khẩn Cấp',
    message: 'Phát hiện 142 khách hàng có nguy cơ rời bỏ > 70% trong 7 ngày qua. Đề xuất kích hoạt Voucher 20%.',
    type: 'danger',
    time: '5 phút trước',
    read: false,
    actionLabel: 'Xem danh sách',
  },
  {
    id: 'NOTIF_02',
    title: '🟡 Khách Hàng VIP Giảm Tương Tác',
    message: '28 Khách hàng VIP chưa phát sinh giao dịch mới trong 45 ngày qua trên kênh Website.',
    type: 'warning',
    time: '25 phút trước',
    read: false,
    actionLabel: 'Phân bổ CSKH',
  },
  {
    id: 'NOTIF_04',
    title: '🔵 Đồng Bộ Dữ Liệu Đa Kênh',
    message: 'Dữ liệu từ POS Cửa hàng & Sàn TMĐT đã được đồng bộ vào MongoDB Atlas Cloud thành công.',
    type: 'info',
    time: '3 giờ trước',
    read: true,
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG_01',
    sender: 'assistant',
    senderName: 'Trợ Lý AI DSS',
    avatar: '🤖',
    text: 'Xin chào! Tôi là Trợ Lý AI Hỗ Trợ Ra Quyết Định (Omni DSS Copilot). Bạn có thể hỏi tôi về phân cụm RFM, dự đoán rủi ro rời bỏ khách hàng hoặc đề xuất chương trình khuyến mãi.',
    time: '10:00',
    channel: 'dss_ai',
  },
  {
    id: 'MSG_02',
    sender: 'cskh_staff',
    senderName: 'Chuyên Viên CSKH VIP',
    avatar: '👩‍💼',
    text: 'Đã hoàn tất cuộc gọi hỗ trợ 1-1 cho 12 khách hàng VIP nhóm có rủi ro rời bỏ. 10 khách hàng đã đồng ý nhận mã Voucher tái kích hoạt.',
    time: '10:15',
    channel: 'cskh_team',
  },
];

export const NotificationChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [activeChatChannel, setActiveChatChannel] = useState<'dss_ai' | 'cskh_team'>('dss_ai');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);

  const { metrics } = useModelMetrics();

  // Thông báo cập nhật mô hình lấy số liệu thật từ /api/metrics
  useEffect(() => {
    if (!metrics) return;
    const c = metrics.churn;
    const best = c.best_model_test;
    const notif: AppNotification = {
      id: 'NOTIF_MODEL',
      title: `🟢 Mô Hình Churn: ${c.best_model}`,
      message:
        `Huấn luyện trên ${c.n_train.toLocaleString('vi-VN')} KH, kiểm định out-of-time trên ${c.n_test.toLocaleString('vi-VN')} KH: ` +
        `ROC-AUC ${fmt(best.roc_auc)}, F1 ${fmt(best.f1_score)}, Recall lớp quay lại ${fmt(best.retained_recall)}.`,
      type: 'success',
      time: new Date(metrics.generated_at).toLocaleString('vi-VN'),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== 'NOTIF_MODEL')]);
  }, [metrics]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const unreadChatCount = 3;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `MSG_${Date.now()}`,
      sender: 'user',
      senderName: 'Bạn',
      avatar: '👤',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: activeChatChannel,
    };

    setMessages(prev => [...prev, userMsg]);

    // Tự động phản hồi thông minh nếu đang ở kênh AI DSS
    if (activeChatChannel === 'dss_ai') {
      setTimeout(() => {
        let replyText = 'Tôi đã ghi nhận câu hỏi của bạn. Hệ thống DSS đề xuất: ';
        const lower = text.toLowerCase();

        if (lower.includes('churn') || lower.includes('rời bỏ') || lower.includes('nguy cơ')) {
          replyText = '📊 Phân tích Churn: Đối với nhóm khách hàng Churn > 70%, giải pháp tối ưu nhất là tự động phát Voucher giảm giá 15-20% và gán chuyên viên CSKH liên hệ trực tiếp trong 24 giờ.';
        } else if (lower.includes('vip') || lower.includes('giữ chân')) {
          replyText = '💎 Chiến lược VIP: Mời khách hàng tham gia câu lạc bộ đặc quyền VIP, tích lũy điểm thưởng kép và gửi quà tặng cá nhân hóa vào dịp đặc biệt.';
        } else if (lower.includes('rfm') || lower.includes('phân cụm')) {
          replyText = metrics
            ? `🎯 Phân cụm RFM: K-Means (K=${metrics.rfm.k}) trên ${metrics.rfm.n_customers.toLocaleString('vi-VN')} khách hàng: ` +
              metrics.rfm.segments.map((s) => `${s.segment} (${(s.share * 100).toFixed(1)}%)`).join(', ') + '.'
            : '🎯 Phân cụm RFM: chưa tải được kết quả phân cụm từ máy chủ.';
        } else {
          replyText = '💡 Đề xuất DSS: Dựa trên mô hình học máy XGBoost, việc gửi email kích hoạt giỏ hàng kèm ưu đãi Freeship vào lúc 19:00 - 21:00 giúp tăng tỷ lệ quay lại mua sắm thêm 34%.';
        }

        const aiMsg: ChatMessage = {
          id: `MSG_AI_${Date.now()}`,
          sender: 'assistant',
          senderName: 'Trợ Lý AI DSS',
          avatar: '🤖',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'dss_ai',
        };

        setMessages(prev => [...prev, aiMsg]);
      }, 600);
    } else {
      // Phản hồi từ kênh CSKH Team
      setTimeout(() => {
        const staffMsg: ChatMessage = {
          id: `MSG_STAFF_${Date.now()}`,
          sender: 'cskh_staff',
          senderName: 'Trưởng Nhóm CSKH',
          avatar: '👨‍💼',
          text: 'Đã nhận thông tin chỉ đạo. Đội ngũ CSKH đang tiến hành xử lý danh sách ưu tiên theo đúng quy trình DSS.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'cskh_team',
        };
        setMessages(prev => [...prev, staffMsg]);
      }, 700);
    }
  };

  return (
    <NotificationChatContext.Provider
      value={{
        notifications,
        unreadNotificationCount,
        isNotificationDrawerOpen,
        openNotificationDrawer: () => setIsNotificationDrawerOpen(true),
        closeNotificationDrawer: () => setIsNotificationDrawerOpen(false),
        markAsRead,
        markAllAsRead,
        clearNotifications,

        messages: messages.filter(m => m.channel === activeChatChannel),
        activeChatChannel,
        setActiveChatChannel,
        isChatDrawerOpen,
        openChatDrawer: () => setIsChatDrawerOpen(true),
        closeChatDrawer: () => setIsChatDrawerOpen(false),
        sendMessage,
        unreadChatCount,
      }}
    >
      {children}
    </NotificationChatContext.Provider>
  );
};

export const useNotificationChat = () => {
  const context = useContext(NotificationChatContext);
  if (!context) {
    throw new Error('useNotificationChat must be used within a NotificationChatProvider');
  }
  return context;
};
