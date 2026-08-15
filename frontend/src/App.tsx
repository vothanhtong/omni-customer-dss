import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationChatProvider } from './context/NotificationChatContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { AuthPage } from './components/auth/AuthPage';
import { ProfileModal } from './components/profile/ProfileModal';
import { HomeWelcomeTab } from './components/tabs/HomeWelcomeTab';
import { ResearchProposalTab } from './components/tabs/ResearchProposalTab';
import { OverviewTab } from './components/tabs/OverviewTab';
import { RFMSegmentationTab } from './components/tabs/RFMSegmentationTab';
import { DSSPredictionTab } from './components/tabs/DSSPredictionTab';
import { HighRiskAlertsTab } from './components/tabs/HighRiskAlertsTab';
import { AdminManagementTab } from './components/tabs/AdminManagementTab';
import { BusinessToolsTab } from './components/tabs/BusinessToolsTab';

const MainLayout: React.FC = () => {
  const { isAuthPageOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Màn hình Đăng nhập / Đăng ký Split-Screen toàn màn hình
  if (isAuthPageOpen) {
    return <AuthPage />;
  }

  return (
    <div className="adminator-app-root">
      {/* Sidebar cố định bên trái */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Khu vực nội dung chính bên phải */}
      <div className="adminator-main-wrapper">
        <TopHeader activeTab={activeTab} />

        <main className="adminator-content-container">
          {activeTab === 'home' && <HomeWelcomeTab setActiveTab={setActiveTab} />}
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'proposal' && <ResearchProposalTab />}
          {activeTab === 'rfm' && <RFMSegmentationTab />}
          {activeTab === 'dss' && <DSSPredictionTab />}
          {activeTab === 'alerts' && <HighRiskAlertsTab />}
          {activeTab === 'admin_panel' && <AdminManagementTab />}
          {activeTab === 'business_panel' && <BusinessToolsTab />}
        </main>
      </div>

      {/* Ngăn kéo Thông Báo và Live Chat Realtime */}
      <NotificationDrawer />
      <ChatDrawer />

      {/* Modal Cập nhật Hồ Sơ Doanh Nghiệp & Đổi Avatar */}
      <ProfileModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationChatProvider>
          <MainLayout />
        </NotificationChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
