import React, { useState, useRef, useEffect } from 'react';
import { useNotificationChat } from '../../context/NotificationChatContext';
import { X, Send, Bot, Users, Sparkles, MessageSquare } from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const {
    isChatDrawerOpen,
    closeChatDrawer,
    messages,
    sendMessage,
    activeChatChannel,
    setActiveChatChannel
  } = useNotificationChat();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatDrawerOpen]);

  if (!isChatDrawerOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="drawer-overlay" onClick={closeChatDrawer}>
      <div className="chat-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ứng Dụng Chat Realtime</h3>
          </div>
          <button className="drawer-close-btn" onClick={closeChatDrawer} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="chat-channel-tabs">
          <button
            onClick={() => setActiveChatChannel('dss_ai')}
            className={`chat-tab-btn ${activeChatChannel === 'dss_ai' ? 'active' : ''}`}
          >
            <Bot size={16} /> 🤖 Trợ Lý AI DSS
          </button>
          <button
            onClick={() => setActiveChatChannel('cskh_team')}
            className={`chat-tab-btn ${activeChatChannel === 'cskh_team' ? 'active' : ''}`}
          >
            <Users size={16} /> 👥 Nhóm CSKH Nội Bộ
          </button>
        </div>

        {/* Chat Messages List */}
        <div className="chat-messages-container">
          {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div key={msg.id} className={`chat-bubble-row ${isMe ? 'me' : 'other'}`}>
                {!isMe && <div className="chat-msg-avatar">{msg.avatar}</div>}
                <div className="chat-msg-content">
                  <div className="chat-msg-author">
                    <span>{msg.senderName}</span>
                    <span className="chat-msg-time">{msg.time}</span>
                  </div>
                  <div className={`chat-msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts (Only on AI Channel) */}
        {activeChatChannel === 'dss_ai' && (
          <div className="chat-quick-prompts">
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="#06b6d4" /> Gợi ý câu hỏi:
            </span>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickPrompt('Làm sao giữ chân nhóm khách hàng Churn > 70%?')}
            >
              Cứu vãn Churn &gt; 70%?
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickPrompt('Chiến lược chăm sóc đặc quyền cho khách hàng VIP?')}
            >
              Chiến lược VIP?
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickPrompt('Phân cụm RFM hiện tại của hệ thống như thế nào?')}
            >
              Phân cụm RFM?
            </button>
          </div>
        )}

        {/* Input Footer */}
        <form onSubmit={handleSend} className="chat-input-footer">
          <input
            type="text"
            className="chat-input-box"
            placeholder={activeChatChannel === 'dss_ai' ? 'Hỏi trợ lý AI về rủi ro, phân cụm hoặc voucher...' : 'Nhắn tin cho nhóm CSKH...'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputVal.trim()} title="Gửi tin nhắn">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
