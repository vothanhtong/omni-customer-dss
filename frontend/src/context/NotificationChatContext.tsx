import React, { createContext, useContext, useState, useEffect } from 'react';
import { useModelMetrics, fmt } from './MetricsContext';
import { useAuth } from './AuthContext';
import { DssRule, getDssRules, getHighRiskCustomers } from '../services/api';
import { HighRiskPage } from '../types/customer';

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

  // Chat
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

export const ASSISTANT_NAME = 'Trợ lý gợi ý theo luật';
const ASSISTANT_AVATAR = '📋';
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const n = (v: number) => v.toLocaleString('vi-VN');

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG_WELCOME',
    sender: 'assistant',
    senderName: ASSISTANT_NAME,
    avatar: ASSISTANT_AVATAR,
    text:
      'Xin chào! Tôi trả lời dựa trên bảng luật DSS và số liệu thật của hệ thống (mô hình churn, phân cụm RFM, danh sách cảnh báo). ' +
      'Tôi không phải mô hình AI tạo sinh. Hãy hỏi về: rủi ro rời bỏ, khách VIP, khách tiềm năng, phân cụm RFM hoặc chất lượng mô hình.',
    time: '',
    channel: 'dss_ai',
  },
  {
    id: 'MSG_NOTES',
    sender: 'cskh_staff',
    senderName: 'Hệ thống',
    avatar: '🗒️',
    text: 'Kênh ghi chú nội bộ của nhóm CSKH. Ghi chú chỉ lưu trong phiên làm việc hiện tại trên trình duyệt này.',
    time: '',
    channel: 'cskh_team',
  },
];

/** Trả lời theo luật: chọn chủ đề theo từ khóa, nội dung lấy từ bảng luật DSS và số liệu thật */
function ruleBasedReply(
  text: string,
  ctx: { rules: DssRule[]; risk: HighRiskPage | null; metrics: ReturnType<typeof useModelMetrics>['metrics'] },
): string {
  const lower = text.toLowerCase();
  const { rules, risk, metrics } = ctx;
  const rulesFor = (pred: (r: DssRule) => boolean) =>
    rules.filter(pred).map((r) => `• ${r.rule_id} [${r.level}] ${r.segments}, churn ${r.churn_interval}: ${r.recommendation}`).join('\n');

  if (/churn|rời bỏ|nguy cơ|rủi ro/.test(lower)) {
    const counts = risk ? `Hiện có ${n(risk.alert_counts.CRITICAL)} khách mức Khẩn cấp và ${n(risk.alert_counts.HIGH)} khách mức Cao (trên ${n(risk.population)} khách đã chấm điểm).\n` : '';
    return `📊 ${counts}Luật DSS áp dụng cho nhóm rủi ro:\n${rulesFor((r) => r.level === 'CRITICAL' || r.level === 'HIGH') || '(chưa tải được bảng luật)'}`;
  }
  if (/vip|giữ chân/.test(lower)) {
    const seg = metrics?.rfm.segments.find((s) => s.segment === 'VIP');
    const prof = seg ? `Phân khúc VIP: ${n(seg.customers)} khách (${(seg.share * 100).toFixed(1)}%), TB ${seg.mean_frequency} đơn thành công.\n` : '';
    return `💎 ${prof}Luật DSS cho VIP:\n${rulesFor((r) => r.segments.includes('VIP') && !r.segments.includes('trừ VIP')) || '(chưa tải được bảng luật)'}`;
  }
  if (/tiềm năng|cơ hội|mua lại|xu hướng/.test(lower)) {
    const opp = risk ? `Hiện có ${n(risk.opportunity_count)} khách tiềm năng (VIP/Tiềm năng, xác suất mua lại ≥ 60%) — xem tab Cảnh báo › Khách tiềm năng.\n` : '';
    return `📈 ${opp}Luật DSS cho nhóm Tiềm năng:\n${rulesFor((r) => r.segments.includes('Tiềm năng')) || '(chưa tải được bảng luật)'}`;
  }
  if (/rfm|phân cụm|phân khúc/.test(lower)) {
    return metrics
      ? `🎯 K-Means (K=${metrics.rfm.k}) trên ${n(metrics.rfm.n_customers)} khách: ` +
          metrics.rfm.segments.map((s) => `${s.segment} ${(s.share * 100).toFixed(1)}%`).join(', ') + `.\nGán nhãn: ${metrics.rfm.labeling_rule}`
      : '🎯 Chưa tải được kết quả phân cụm từ máy chủ.';
  }
  if (/mô hình|chính xác|auc|độ tin cậy/.test(lower)) {
    if (!metrics) return 'Chưa tải được chỉ số mô hình.';
    const t = metrics.churn.best_model_test;
    return `🧪 ${metrics.churn.best_model} trên tập kiểm tra out-of-time (${n(metrics.churn.n_test)} khách): ROC-AUC ${fmt(t.roc_auc)}, ` +
      `balanced accuracy ${fmt(t.balanced_accuracy)}, F1 ${fmt(t.f1_score)}. Lưu ý: ${(metrics.churn.churn_rate_test * 100).toFixed(1)}% khách ` +
      'trong tập kiểm tra là churn nên accuracy không phản ánh đúng chất lượng; nên đọc ROC-AUC và balanced accuracy.';
  }
  return 'Tôi chỉ trả lời các chủ đề: rủi ro rời bỏ, khách VIP, khách tiềm năng, phân cụm RFM, chất lượng mô hình. Hãy thử một trong các gợi ý bên dưới.';
}

export const NotificationChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [activeChatChannel, setActiveChatChannel] = useState<'dss_ai' | 'cskh_team'>('dss_ai');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [rules, setRules] = useState<DssRule[]>([]);
  const [risk, setRisk] = useState<HighRiskPage | null>(null);

  const { metrics } = useModelMetrics();
  const { isAuthenticated } = useAuth();

  const upsert = (notif: AppNotification) =>
    setNotifications((prev) => [notif, ...prev.filter((x) => x.id !== notif.id)]);

  // Thông báo cập nhật mô hình (số liệu thật từ /api/metrics)
  useEffect(() => {
    if (!metrics) return;
    const c = metrics.churn;
    const best = c.best_model_test;
    upsert({
      id: 'NOTIF_MODEL',
      title: `🟢 Mô hình churn: ${c.best_model}`,
      message:
        `Huấn luyện trên ${n(c.n_train)} KH, kiểm định out-of-time trên ${n(c.n_test)} KH: ` +
        `ROC-AUC ${fmt(best.roc_auc)}, balanced accuracy ${fmt(best.balanced_accuracy)}.`,
      type: 'success',
      time: new Date(metrics.generated_at).toLocaleString('vi-VN'),
      read: false,
    });
  }, [metrics]);

  // Cảnh báo rủi ro & khách tiềm năng (số liệu thật từ /api/customers/high-risk — cần đăng nhập)
  useEffect(() => {
    getDssRules().then(setRules).catch(() => setRules([]));
    if (!isAuthenticated) return;
    getHighRiskCustomers({ alert_level: ['CRITICAL', 'HIGH'], page: 1, page_size: 1 })
      .then((res) => {
        setRisk(res);
        const time = new Date().toLocaleString('vi-VN');
        upsert({
          id: 'NOTIF_RISK',
          title: '🔴 Cảnh báo rủi ro rời bỏ',
          message: `${n(res.alert_counts.CRITICAL)} khách mức Khẩn cấp và ${n(res.alert_counts.HIGH)} khách mức Cao cần can thiệp (theo bảng luật DSS).`,
          type: 'danger',
          time,
          read: false,
          actionLabel: 'Xem danh sách',
        });
        upsert({
          id: 'NOTIF_OPPORTUNITY',
          title: '📈 Khách hàng tiềm năng',
          message: `${n(res.opportunity_count)} khách VIP/Tiềm năng có xác suất mua lại ≥ 60%: phù hợp chiến dịch tri ân, bán thêm.`,
          type: 'info',
          time,
          read: false,
          actionLabel: 'Xem danh sách',
        });
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const unreadNotificationCount = notifications.filter((x) => !x.read).length;
  const unreadChatCount = 0;

  const markAsRead = (id: string) => setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
  const markAllAsRead = () => setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  const clearNotifications = () => setNotifications([]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `MSG_${Date.now()}`,
      sender: 'user',
      senderName: 'Bạn',
      avatar: '👤',
      text: text.trim(),
      time: nowTime(),
      channel: activeChatChannel,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Kênh CSKH chỉ là ghi chú nội bộ: không có phản hồi tự động giả lập
    if (activeChatChannel !== 'dss_ai') return;
    const reply: ChatMessage = {
      id: `MSG_RULE_${Date.now()}`,
      sender: 'assistant',
      senderName: ASSISTANT_NAME,
      avatar: ASSISTANT_AVATAR,
      text: ruleBasedReply(text, { rules, risk, metrics }),
      time: nowTime(),
      channel: 'dss_ai',
    };
    setMessages((prev) => [...prev, reply]);
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

        messages: messages.filter((m) => m.channel === activeChatChannel),
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
