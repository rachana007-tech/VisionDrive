import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  User, 
  ShieldAlert,
  RefreshCw,
  Video,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Header({ 
  backendHealth, 
  onRefresh, 
  isRefreshing, 
  onStartLive, 
  isMonitoringActive,
  isAudioMuted = false,
  onToggleMute,
  isAudioBlocked = false,
  onEnableAudio
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime);

  return (
    <header style={styles.header}>
      {/* Title Section */}
      <div style={styles.titleSection}>
        <div style={styles.titleWrapper}>
          <h1 style={styles.mainTitle}>Driver Safety Overview</h1>
          <span style={styles.versionBadge}>v1.0.0</span>
        </div>
        <p style={styles.subTitle}>
          AI-Based Real-Time Driver Fatigue & Distraction Detection System
        </p>
      </div>

      {/* Right Controls & Info */}
      <div style={styles.metaSection}>
        {/* Live Monitoring Quick Toggle */}
        <button
          onClick={onStartLive}
          style={{
            ...styles.quickMonitorBtn,
            backgroundColor: isMonitoringActive ? '#EF4444' : 'var(--royal-violet)',
            boxShadow: isMonitoringActive 
              ? '0 4px 14px rgba(239, 68, 68, 0.25)' 
              : 'var(--shadow-violet)'
          }}
          title={isMonitoringActive ? 'Active Live Stream' : 'Open Live Camera Stream'}
        >
          <Video size={16} color="#FFFFFF" />
          <span>{isMonitoringActive ? 'Stop Stream' : 'Live Camera'}</span>
          {isMonitoringActive && <span className="pulse-dot warning" />}
        </button>

        {/* Refresh API Button */}
        <button 
          onClick={onRefresh} 
          disabled={isRefreshing}
          style={styles.refreshButton}
          title="Refresh Backend Data"
        >
          <RefreshCw 
            size={16} 
            color="#475569" 
            style={{ 
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
        </button>

        {/* Mute/Unmute Audio Warning Alert Button */}
        <button
          onClick={onToggleMute}
          style={{
            ...styles.refreshButton,
            backgroundColor: isAudioMuted ? '#FEF2F2' : '#F8FAFC',
            borderColor: isAudioMuted ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)',
          }}
          title={isAudioMuted ? 'Warning sounds muted (Click to unmute)' : 'Warning sounds active (Click to mute)'}
        >
          {isAudioMuted ? (
            <VolumeX size={16} color="#EF4444" />
          ) : (
            <Volume2 size={16} color="var(--royal-violet)" />
          )}
        </button>

        {/* Browser Autoplay Blocked Notice Pill */}
        {isAudioBlocked && !isAudioMuted && (
          <button 
            onClick={onEnableAudio}
            style={styles.audioPromptPill}
            title="Browser requires interaction to play audio. Click to enable."
          >
            <Volume2 size={13} color="#D97706" />
            <span>Enable Sound</span>
          </button>
        )}

        {/* Backend Connection Status Pill */}
        <div 
          style={{
            ...styles.statusPill,
            backgroundColor: backendHealth?.isHealthy ? 'var(--status-low-bg)' : 'var(--status-high-bg)',
            borderColor: backendHealth?.isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          }}
          title={backendHealth?.isHealthy 
            ? `Backend online (${backendHealth.latency || '<1'}ms)` 
            : `Backend offline: ${backendHealth?.error || 'Cannot reach API'}`}
        >
          {backendHealth?.isHealthy ? (
            <>
              <span className="pulse-dot online" />
              <span style={{ ...styles.statusText, color: 'var(--status-low)' }}>
                API Connected {backendHealth?.latency ? `(${backendHealth.latency}ms)` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="pulse-dot offline" />
              <span style={{ ...styles.statusText, color: 'var(--status-high)' }}>
                API Offline
              </span>
            </>
          )}
        </div>

        {/* Live Clock */}
        <div style={styles.clockPill}>
          <Clock size={15} color="var(--royal-violet)" />
          <div style={styles.clockText}>
            <span style={styles.datePart}>{formattedDate}</span>
            <span style={styles.timePart}>{formattedTime}</span>
          </div>
        </div>

        {/* Driver Profile */}
        <div style={styles.profileCard}>
          <div style={styles.avatar}>
            <User size={18} color="#FFFFFF" />
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.driverName}>Capt. Alex Ray</div>
            <div style={styles.driverRole}>Active Pilot #VD-8842</div>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '18px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    flexWrap: 'wrap'
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  mainTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: 1.2
  },
  versionBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #C7D2FE'
  },
  subTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  metaSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  quickMonitorBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#FFFFFF',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: '700',
    transition: 'all 150ms ease'
  },
  refreshButton: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease'
  },
  audioPromptPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--status-moderate-bg)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#B45309',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 14px',
    borderRadius: '999px',
    border: '1px solid',
    fontSize: '0.8rem',
  },
  statusText: {
    fontWeight: '600',
    fontSize: '0.78rem'
  },
  clockPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '6px 14px',
  },
  clockText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.2
  },
  datePart: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  timePart: {
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums'
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '6px',
    borderLeft: '1px solid var(--border-subtle)'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--royal-violet) 0%, var(--soft-teal) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  driverName: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  driverRole: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '500'
  }
};
