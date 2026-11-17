import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Smartphone, 
  Moon, 
  EyeOff, 
  Filter, 
  Calendar, 
  Clock, 
  ShieldCheck,
  Search,
  CheckCircle2
} from 'lucide-react';
import { formatDate, getSeverityClass, getAlertIconName, getAlertFriendlyName } from '../utils/formatters';

export default function SafetyAlerts({ alerts = [], sessions = [], isLoading = false, onSelectSession }) {
  const [sessionFilter, setSessionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct sessions for the dropdown
  const sessionOptions = useMemo(() => {
    const set = new Set();
    alerts.forEach(a => {
      if (a.session_id) set.add(a.session_id);
    });
    return Array.from(set);
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (sessionFilter !== 'all' && alert.session_id !== sessionFilter) return false;
      if (severityFilter !== 'all' && alert.severity?.toLowerCase() !== severityFilter.toLowerCase()) return false;
      if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msg = (alert.message || '').toLowerCase();
        const type = (alert.type || '').toLowerCase();
        const id = (alert.session_id || '').toLowerCase();
        if (!msg.includes(q) && !type.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, sessionFilter, severityFilter, typeFilter, searchQuery]);

  // Icon component helper
  const renderAlertIcon = (type) => {
    switch (type) {
      case 'HIGH_RISK':
        return <AlertTriangle size={18} color="#EF4444" />;
      case 'PHONE_DETECTED':
        return <Smartphone size={18} color="#F59E0B" />;
      case 'DROWSINESS':
        return <Moon size={18} color="#818CF8" />;
      case 'DISTRACTION':
        return <EyeOff size={18} color="#0D9488" />;
      default:
        return <Bell size={18} color="var(--royal-violet)" />;
    }
  };

  return (
    <div className="aurora-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="card-header-flex">
        <div className="card-title">
          <Bell size={19} color="var(--royal-violet)" />
          <span>Safety Incidents & Alert Timeline</span>
          <span style={styles.counterBadge}>
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>

        {/* Filter Toolbar */}
        <div style={styles.filterToolbar}>
          {/* Search Box */}
          <div style={styles.searchBox}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search alert..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Session Filter */}
          <select 
            value={sessionFilter} 
            onChange={(e) => setSessionFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Sessions ({sessionOptions.length})</option>
            {sessionOptions.map(id => (
              <option key={id} value={id}>
                Session {id.slice(-6)}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
          </select>

          {/* Alert Type Filter */}
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="DROWSINESS">Drowsiness</option>
            <option value="PHONE_DETECTED">Phone Detected</option>
            <option value="DISTRACTION">Distraction</option>
          </select>
        </div>
      </div>

      <div className="card-content">
        {isLoading ? (
          <div style={styles.emptyState}>
            <div className="pulse-dot online" style={{ width: 14, height: 14 }} />
            <span style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Loading safety alerts from backend...
            </span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.checkIconBox}>
              <CheckCircle2 size={36} color="#10B981" />
            </div>
            <h4 style={styles.emptyTitle}>No Safety Alerts Found</h4>
            <p style={styles.emptyDesc}>
              {alerts.length === 0 
                ? 'No alerts recorded in the database. Driver telemetry indicates clean driving habits.'
                : 'No alerts match the selected filter criteria. Try resetting the filters.'}
            </p>
          </div>
        ) : (
          <div style={styles.timelineContainer}>
            {filteredAlerts.map((alert, idx) => {
              const severityClass = getSeverityClass(alert.severity);
              const friendlyName = getAlertFriendlyName(alert.type);

              return (
                <div key={alert._id || idx} style={styles.timelineItem}>
                  {/* Timeline bullet & line */}
                  <div style={styles.timelineBulletWrapper}>
                    <div style={{
                      ...styles.timelineBullet,
                      backgroundColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B'
                    }} />
                    {idx !== filteredAlerts.length - 1 && <div style={styles.timelineLine} />}
                  </div>

                  {/* Alert Content Card */}
                  <div style={styles.alertCard}>
                    <div style={styles.alertCardHeader}>
                      <div style={styles.alertIconAndType}>
                        {renderAlertIcon(alert.type)}
                        <span style={styles.alertTypeTitle}>{friendlyName}</span>
                      </div>

                      <div style={styles.alertPillsRow}>
                        <span className={`status-pill ${severityClass}`}>
                          {alert.severity}
                        </span>
                        <div style={styles.timestampPill}>
                          <Clock size={12} color="#94A3B8" />
                          <span>{formatDate(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.alertMessage}>
                      {alert.message}
                    </div>

                    <div style={styles.alertFooter}>
                      <span style={styles.sessionRef}>
                        Session ID: <code style={styles.code}>{alert.session_id || '–'}</code>
                      </span>
                      {alert.session_id && onSelectSession && (
                        <button 
                          onClick={() => onSelectSession(alert.session_id)}
                          style={styles.viewSessionBtn}
                        >
                          Inspect Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  counterBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  filterToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '6px 12px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '0.82rem',
    color: 'var(--text-primary)',
    width: '120px',
  },
  select: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    outline: 'none',
    cursor: 'pointer',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  checkIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'var(--status-low-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  emptyDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    maxWidth: '420px',
    lineHeight: 1.4,
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    position: 'relative',
  },
  timelineBulletWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '18px',
    paddingTop: '8px',
  },
  timelineBullet: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    zIndex: 2,
    boxShadow: '0 0 0 3px #FFFFFF, 0 0 0 4px var(--border-subtle)',
  },
  timelineLine: {
    flex: 1,
    width: '2px',
    backgroundColor: 'var(--border-subtle)',
    marginTop: '6px',
  },
  alertCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 150ms ease',
  },
  alertCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  alertIconAndType: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  alertTypeTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  alertPillsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  timestampPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  alertMessage: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  alertFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-subtle)',
    fontSize: '0.75rem',
  },
  sessionRef: {
    color: 'var(--text-muted)',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#E2E8F0',
    padding: '2px 5px',
    borderRadius: '4px',
    fontSize: '0.72rem',
  },
  viewSessionBtn: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--royal-violet)',
    cursor: 'pointer',
  }
};
