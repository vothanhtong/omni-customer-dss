import React from 'react';
import { LayoutDashboard, PieChart, BrainCircuit, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Tổng Quan Hệ Thống', icon: LayoutDashboard },
    { id: 'rfm', label: 'Phân Cụm RFM', icon: PieChart },
    { id: 'dss', label: 'Dự Đoán & DSS Engine', icon: BrainCircuit },
    { id: 'alerts', label: 'Cảnh Báo Rủi Ro Cao', icon: AlertTriangle },
  ];

  return (
    <nav style={{
      background: 'rgba(17, 24, 39, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '70px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <BrainCircuit size={22} />
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Customer Analytics <span className="gradient-text">DSS</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#818cf8' : '#9ca3af',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
