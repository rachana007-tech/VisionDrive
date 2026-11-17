import React from 'react';
import { 
  Car, 
  AlertTriangle, 
  HeartPulse, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Shield,
  Layers
} from 'lucide-react';
import { formatDate, calculateDuration, getRiskLevelClass } from '../utils/formatters';

export default function OverviewCards({ 
  totalSessions = 0, 
  totalAlerts = 0, 
  backendHealth, 
  latestSession,
  onViewHistory,
  onViewAlerts,
  onViewSettings
}) {
  const isHealthy = backendHealth?.isHealthy;
  const latestRiskLevel = latestSession?.latest_results?.overall_risk_level || 'LOW';
  const riskClass = getRiskLevelClass(latestRiskLevel);

  return (
    <div className="dashboard-grid-4 fade-in">
      {/* 1. Total Monitoring Sessions */}
      <div 
        className="aurora-card aurora-card-interactive" 
        onClick={onViewHistory}
        style={styles.card}
      >
        <div style={styles.cardTop}>
          <span style={styles.cardLabel}>TOTAL SESSIONS</span>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--royal-violet)' }}>
            <Car size={20} />
          </div>
        </div>

        <div style={styles.valueRow}>
          <span style={styles.primaryValue}>{totalSessions}</span>
          <span style={styles.unitText}>drives</span>
        </div>

        <div style={styles.cardBottom}>
          <span style={styles.detailText}>
            {latestSession ? `Last: ${formatDate(latestSession.start_time)}` : 'No recorded sessions'}
          </span>
          <ChevronRight size={14} color="#94A3B8" />
        </div>
      </div>

      {/* 2. Total Safety Alerts */}
      <div 
        className="aurora-card aurora-card-interactive" 
        onClick={onViewAlerts}
        style={styles.card}
      >
        <div style={styles.cardTop}>
          <span style={styles.cardLabel}>SAFETY ALERTS</span>
          <div style={{ 
            ...styles.iconBox, 
            backgroundColor: totalAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: totalAlerts > 0 ? '#EF4444' : '#10B981' 
          }}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div style={styles.valueRow}>
          <span style={{ 
            ...styles.primaryValue, 
            color: totalAlerts > 0 ? '#EF4444' : 'var(--text-primary)' 
          }}>
            {totalAlerts}
          </span>
          <span style={styles.unitText}>triggered</span>
        </div>

        <div style={styles.cardBottom}>
          <span style={styles.detailText}>
            {totalAlerts > 0 ? 'Review incident logs' : 'Safe driving maintained'}
          </span>
          <ChevronRight size={14} color="#94A3B8" />
        </div>
      </div>

      {/* 3. Backend / API Health */}
      <div 
        className="aurora-card aurora-card-interactive" 
        onClick={onViewSettings}
        style={styles.card}
      >
        <div style={styles.cardTop}>
          <span style={styles.cardLabel}>AI BACKEND HEALTH</span>
          <div style={{ 
            ...styles.iconBox, 
            backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: isHealthy ? '#10B981' : '#EF4444' 
          }}>
            <HeartPulse size={20} />
          </div>
        </div>

        <div style={styles.valueRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isHealthy ? (
              <CheckCircle2 size={24} color="#10B981" />
            ) : (
              <XCircle size={24} color="#EF4444" />
            )}
            <span style={{ 
              ...styles.primaryValue, 
              fontSize: '1.4rem',
              color: isHealthy ? '#10B981' : '#EF4444' 
            }}>
              {isHealthy ? 'Healthy' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div style={styles.cardBottom}>
          <span style={styles.detailText}>
            {isHealthy 
              ? `FastAPI @ 8000 (${backendHealth?.latency || '<1'}ms)` 
              : 'FastAPI server not responding'}
          </span>
          <ChevronRight size={14} color="#94A3B8" />
        </div>
      </div>

      {/* 4. Latest Monitoring Session */}
      <div 
        className="aurora-card aurora-card-interactive" 
        onClick={onViewHistory}
        style={styles.card}
      >
        <div style={styles.cardTop}>
          <span style={styles.cardLabel}>LATEST DRIVE</span>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--soft-teal)' }}>
            <Clock size={20} />
          </div>
        </div>

        {latestSession ? (
          <>
            <div style={styles.valueRow}>
              <span style={{ ...styles.primaryValue, fontSize: '1.25rem' }}>
                {calculateDuration(latestSession.start_time, latestSession.end_time)}
              </span>
              <span className={`status-pill ${riskClass}`} style={{ marginLeft: 'auto' }}>
                {latestRiskLevel}
              </span>
            </div>

            <div style={styles.cardBottom}>
              <span style={styles.detailText}>
                {latestSession.frame_count || 0} frames • {latestSession.status || 'completed'}
              </span>
              <ChevronRight size={14} color="#94A3B8" />
            </div>
          </>
        ) : (
          <>
            <div style={styles.valueRow}>
              <span style={{ ...styles.primaryValue, fontSize: '1.1rem', color: '#94A3B8' }}>
                No Sessions Yet
              </span>
            </div>
            <div style={styles.cardBottom}>
              <span style={styles.detailText}>Start a live monitoring session</span>
              <ChevronRight size={14} color="#94A3B8" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '148px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  cardLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
  },
  iconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    margin: '4px 0 10px',
  },
  primaryValue: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.85rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  unitText: {
    fontSize: '0.82rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-subtle)',
  },
  detailText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '220px',
  }
};
