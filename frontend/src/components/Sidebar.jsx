import React from 'react';
import {
  LayoutDashboard,
  Video,
  History,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Activity,
  Cpu,
  Radio
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, backendHealth, alertCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Video, badge: 'AI Live' },
    { id: 'history', label: 'Session History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: alertCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>
          <ShieldCheck size={26} color="#818CF8" />
        </div>
        <div>
          <div style={styles.brandTitle}>
            Vision<span style={{ color: '#818CF8' }}>Drive</span>
          </div>
          <div style={styles.brandTagline}>AURORA SAFETY AI</div>
        </div>
      </div>

      {/* Automotive Platform Badge */}
      <div style={styles.fleetBadge}>
        <Radio size={13} color="#14B8A6" className="pulse-dot online" />
        <span style={styles.fleetBadgeText}>Fleet Safety Node #104</span>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <div style={styles.navSectionLabel}>NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {})
              }}
            >
              <div style={styles.navButtonContent}>
                <Icon
                  size={19}
                  color={isActive ? '#818CF8' : '#94A3B8'}
                />
                <span style={{
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: isActive ? 600 : 500
                }}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span style={styles.livePill}>{item.badge}</span>
              )}

              {item.count > 0 && (
                <span style={styles.countPill}>{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Engine Status Card in Footer */}
      <div style={styles.footerCard}>
        <div style={styles.footerHeader}>
          <Cpu size={16} color="#818CF8" />
          <span style={styles.footerTitle}>AI Core Modules</span>
        </div>
        <div style={styles.moduleRow}>
          <span style={styles.moduleName}>MediaPipe Landmark</span>
          <span style={{ ...styles.moduleStatus, color: '#10B981' }}>Active</span>
        </div>
        <div style={styles.moduleRow}>
          <span style={styles.moduleName}>YOLOv11 Detection</span>
          <span style={{ ...styles.moduleStatus, color: '#10B981' }}>Ready</span>
        </div>
        <div style={styles.moduleRow}>
          <span style={styles.moduleName}>Backend Engine</span>
          <span style={{
            ...styles.moduleStatus,
            color: backendHealth?.isHealthy ? '#10B981' : '#F59E0B'
          }}>
            {backendHealth?.isHealthy ? 'Online' : 'Standby'}
          </span>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '270px',
    backgroundColor: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    padding: '24px 18px',
    userSelect: 'none',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingLeft: '6px'
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    lineHeight: 1.1
  },
  brandTagline: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: '0.12em',
    marginTop: '2px'
  },
  fleetBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--sidebar-surface)',
    border: '1px solid var(--sidebar-border)',
    borderRadius: '8px',
    padding: '7px 12px',
    marginBottom: '24px',
  },
  fleetBadgeText: {
    fontSize: '0.75rem',
    color: '#CBD5E1',
    fontWeight: '500'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navSectionLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    color: '#64748B',
    padding: '8px 10px 4px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '10px',
    transition: 'all 180ms ease',
    textAlign: 'left',
    width: '100%',
  },
  navButtonActive: {
    background: 'var(--sidebar-active-bg)',
    border: '1px solid rgba(129, 140, 248, 0.4)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
  },
  navButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.9rem',
  },
  livePill: {
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '999px',
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    color: '#2DD4BF',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    letterSpacing: '0.04em'
  },
  countPill: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '1px 8px',
    borderRadius: '999px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  footerCard: {
    backgroundColor: 'var(--sidebar-surface)',
    border: '1px solid var(--sidebar-border)',
    borderRadius: '12px',
    padding: '14px',
    marginTop: 'auto',
  },
  footerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  footerTitle: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: '0.02em',
  },
  moduleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
    padding: '3px 0',
  },
  moduleName: {
    color: '#94A3B8',
  },
  moduleStatus: {
    fontWeight: '600',
  }
};
