import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { OverviewTab } from './components/tabs/OverviewTab';
import { RFMSegmentationTab } from './components/tabs/RFMSegmentationTab';
import { DSSPredictionTab } from './components/tabs/DSSPredictionTab';
import { HighRiskAlertsTab } from './components/tabs/HighRiskAlertsTab';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'rfm' && <RFMSegmentationTab />}
        {activeTab === 'dss' && <DSSPredictionTab />}
        {activeTab === 'alerts' && <HighRiskAlertsTab />}
      </main>
    </div>
  );
};

export default App;
