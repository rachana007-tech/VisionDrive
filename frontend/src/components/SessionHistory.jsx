import React, { useState } from 'react';
import { 
  History, 
  Clock, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  Eye, 
  Smartphone, 
  Layers,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { formatDate, calculateDuration, getRiskLevelClass, getAlertFriendlyName } from '../utils/formatters';
import api from '../services/api';

export default function SessionHistory({ 
  sessions = [], 
  isLoading = false,
  selectedSessionId,
  setSelectedSessionId 
}) {
  const [activeSessionDetail, setActiveSessionDetail] = useState(null);
  const [sessionAlerts, setSessionAlerts] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Load detailed session data
  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setIsDetailLoading(true);
    setActiveSessionDetail(null);
    setSessionAlerts([]);

    try {
      const [detailData, alertsData] = await Promise.all([
        api.getSessionById(sessionId),
        api.getSessionAlerts(sessionId)
      ]);
      setActiveSessionDetail(detailData);
      setSessionAlerts(alertsData || []);
    } catch (err) {
      console.error('[SessionHistory] Error loading session detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fade-in" style={{ marginBottom: '24px' }}>
      <div className="aurora-card">
        <div className="card-header-flex">
          <div className="card-title">
            <History size={19} color="var(--royal-violet)" />
            <span>Driver Monitoring Session History</span>
            <span style={styles.badge}>{sessions.length} Drives</span>
          </div>
          <span style={styles.subtext}>Sorted by latest session</span>
        </div>

        <div className="card-content" style={{ padding: '0' }}>
          {isLoading ? (
            <div style={styles.loadingBox}>
              <div className="pulse-dot online" style={{ width: 14, height: 14 }} />
              <span style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Fetching monitoring sessions from database...
              </span>
            </div>
          ) : sessions.length === 0 ? (
            <div style={styles.emptyBox}>
              <History size={36} color="#94A3B8" />
              <h4 style={styles.emptyTitle}>No Sessions Found</h4>
              <p style={styles.emptyDesc}>
                No driving monitoring sessions have been logged yet. Start a Live Monitoring session to record your drive.
              </p>
            </div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>SESSION ID</th>
                    <th style={styles.th}>START TIME</th>
                    <th style={styles.th}>DURATION</th>
                    <th style={styles.th}>STATUS</th>
                    <th style={styles.th}>FRAMES</th>
                    <th style={styles.th}>OVERALL RISK</th>
                    <th style={styles.th}>PHONE DETECTED</th>
                    <th style={styles.th}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const latest = session.latest_results || {};
                    const riskLevel = latest.overall_risk_level || 'LOW';
                    const riskClass = getRiskLevelClass(riskLevel);
                    const isSelected = selectedSessionId === session._id;

                    return (
                      <tr 
                        key={session._id} 
                        onClick={() => handleSelectSession(session._id)}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        }}
                      >
                        {/* Session ID */}
                        <td style={styles.td}>
                          <div style={styles.idWrapper}>
                            <code style={styles.idCode}>{session._id.slice(-8)}</code>
                            <button
                              onClick={(e) => handleCopyId(session._id, e)}
                              style={styles.copyBtn}
                              title="Copy full ObjectId"
                            >
                              {copiedId === session._id ? (
                                <Check size={12} color="#10B981" />
                              ) : (
                                <Copy size={12} color="#94A3B8" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Start Time */}
                        <td style={styles.td}>
                          <div style={styles.cellMainText}>
                            {formatDate(session.start_time)}
                          </div>
                        </td>

                        {/* Duration */}
                        <td style={styles.td}>
                          <div style={styles.cellMainText}>
                            {calculateDuration(session.start_time, session.end_time)}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={styles.td}>
                          <span className={`status-pill ${session.status === 'active' ? 'low' : 'neutral'}`}>
                            {session.status || 'completed'}
                          </span>
                        </td>

                        {/* Frames */}
                        <td style={styles.td}>
                          <span style={styles.cellMainText}>
                            {session.frame_count || 0}
                          </span>
                        </td>

                        {/* Overall Risk */}
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`status-pill ${riskClass}`}>
                              {riskLevel}
                            </span>
                            {latest.overall_risk_score != null && (
                              <span style={styles.scoreText}>
                                {latest.overall_risk_score}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Phone Detected */}
                        <td style={styles.td}>
                          <span style={{ 
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: latest.phone_detected ? '#EF4444' : '#10B981'
                          }}>
                            {latest.phone_detected ? 'Yes (Detected)' : 'No'}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={styles.td}>
                          <button 
                            onClick={() => handleSelectSession(session._id)}
                            style={styles.inspectBtn}
                          >
                            <span>Inspect</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SESSION INSPECTION MODAL / DRAWER */}
      {selectedSessionId && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedSessionId(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>Session Inspection Report</div>
                <div style={styles.modalSub}>
                  MongoDB ObjectId: <code>{selectedSessionId}</code>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSessionId(null)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={styles.modalBody}>
              {isDetailLoading ? (
                <div style={styles.loadingBox}>
                  <div className="pulse-dot online" />
                  <span style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                    Loading session analytics and alerts...
                  </span>
                </div>
              ) : activeSessionDetail ? (
                <div style={styles.detailContainer}>
                  {/* Summary Grid */}
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryBox}>
                      <span style={styles.summaryLabel}>Start Timestamp</span>
                      <span style={styles.summaryVal}>
                        {formatDate(activeSessionDetail.start_time)}
                      </span>
                    </div>
                    <div style={styles.summaryBox}>
                      <span style={styles.summaryLabel}>End Timestamp</span>
                      <span style={styles.summaryVal}>
                        {activeSessionDetail.end_time ? formatDate(activeSessionDetail.end_time) : 'In Progress'}
                      </span>
                    </div>
                    <div style={styles.summaryBox}>
                      <span style={styles.summaryLabel}>Total Drive Time</span>
                      <span style={styles.summaryVal}>
                        {calculateDuration(activeSessionDetail.start_time, activeSessionDetail.end_time)}
                      </span>
                    </div>
                    <div style={styles.summaryBox}>
                      <span style={styles.summaryLabel}>Processed Frames</span>
                      <span style={styles.summaryVal}>
                        {activeSessionDetail.frame_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Risk Classification Distribution */}
                  {activeSessionDetail.risk_summary && (
                    <div style={styles.riskBreakdownSection}>
                      <div style={styles.sectionSubhead}>Risk Level Distribution</div>
                      <div style={styles.riskSummaryGrid}>
                        <div style={{ ...styles.riskSummaryCard, borderColor: '#10B981' }}>
                          <span style={styles.riskSummaryLabel}>LOW RISK FRAMES</span>
                          <span style={{ ...styles.riskSummaryVal, color: '#10B981' }}>
                            {activeSessionDetail.risk_summary.LOW || 0}
                          </span>
                        </div>
                        <div style={{ ...styles.riskSummaryCard, borderColor: '#F59E0B' }}>
                          <span style={styles.riskSummaryLabel}>MODERATE RISK</span>
                          <span style={{ ...styles.riskSummaryVal, color: '#F59E0B' }}>
                            {activeSessionDetail.risk_summary.MODERATE || 0}
                          </span>
                        </div>
                        <div style={{ ...styles.riskSummaryCard, borderColor: '#EF4444' }}>
                          <span style={styles.riskSummaryLabel}>HIGH RISK FRAMES</span>
                          <span style={{ ...styles.riskSummaryVal, color: '#EF4444' }}>
                            {activeSessionDetail.risk_summary.HIGH || 0}
                          </span>
                        </div>
                        <div style={{ ...styles.riskSummaryCard, borderColor: '#64748B' }}>
                          <span style={styles.riskSummaryLabel}>NOT ASSESSED</span>
                          <span style={{ ...styles.riskSummaryVal, color: '#64748B' }}>
                            {activeSessionDetail.risk_summary.NOT_ASSESSED || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Associated Alerts for this Session */}
                  <div style={styles.alertsSection}>
                    <div style={styles.sectionSubhead}>
                      Session Safety Alerts ({sessionAlerts.length})
                    </div>

                    {sessionAlerts.length === 0 ? (
                      <div style={styles.noAlertsNotice}>
                        <CheckCircle2 size={18} color="#10B981" />
                        <span>No safety alerts triggered during this session. Drive was clean!</span>
                      </div>
                    ) : (
                      <div style={styles.sessionAlertsList}>
                        {sessionAlerts.map((alert, idx) => (
                          <div key={alert._id || idx} style={styles.miniAlertItem}>
                            <AlertTriangle size={16} color={alert.severity === 'critical' ? '#EF4444' : '#F59E0B'} />
                            <div style={{ flex: 1 }}>
                              <div style={styles.miniAlertTitle}>
                                {getAlertFriendlyName(alert.type)}
                              </div>
                              <div style={styles.miniAlertMsg}>{alert.message}</div>
                            </div>
                            <span style={styles.miniAlertTime}>
                              {formatDate(alert.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.emptyBox}>Could not load session details.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  badge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  subtext: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    color: 'var(--text-muted)',
  },
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '12px',
    marginBottom: '6px',
  },
  emptyDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    maxWidth: '400px',
    lineHeight: 1.4,
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.85rem',
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid var(--border-subtle)',
  },
  th: {
    padding: '12px 18px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
  },
  td: {
    padding: '14px 18px',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  idWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  idCode: {
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  copyBtn: {
    padding: '2px',
    borderRadius: '4px',
  },
  cellMainText: {
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  inspectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    border: '1px solid #C7D2FE',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '24px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
    animation: 'fadeIn 0.2s ease',
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  modalSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
  },
  detailContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.95rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '4px',
  },
  sectionSubhead: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  riskBreakdownSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  riskSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  riskSummaryCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  riskSummaryLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  riskSummaryVal: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.4rem',
    fontWeight: '800',
    marginTop: '4px',
  },
  alertsSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  noAlertsNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--status-low-bg)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.82rem',
    color: '#065F46',
  },
  sessionAlertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  miniAlertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  miniAlertTitle: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  miniAlertMsg: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  miniAlertTime: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
  }
};
