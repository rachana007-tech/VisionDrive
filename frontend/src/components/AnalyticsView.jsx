import React, { useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { formatDate } from '../utils/formatters';

const RISK_COLORS = {
  LOW: '#10B981',
  MODERATE: '#F59E0B',
  HIGH: '#EF4444',
  NOT_ASSESSED: '#94A3B8'
};

const ALERT_COLORS = {
  HIGH_RISK: '#EF4444',
  DROWSINESS: '#818CF8',
  PHONE_DETECTED: '#F59E0B',
  DISTRACTION: '#0D9488'
};

export default function AnalyticsView({ sessions = [], alerts = [] }) {
  // 1. Calculate Aggregate Risk Summary across all sessions
  const riskDistributionData = useMemo(() => {
    let low = 0;
    let moderate = 0;
    let high = 0;
    let notAssessed = 0;

    sessions.forEach(s => {
      if (s.risk_summary) {
        low += s.risk_summary.LOW || 0;
        moderate += s.risk_summary.MODERATE || 0;
        high += s.risk_summary.HIGH || 0;
        notAssessed += s.risk_summary.NOT_ASSESSED || 0;
      }
    });

    const total = low + moderate + high + notAssessed;
    if (total === 0) return [];

    return [
      { name: 'Low Risk', value: low, key: 'LOW', color: RISK_COLORS.LOW },
      { name: 'Moderate Risk', value: moderate, key: 'MODERATE', color: RISK_COLORS.MODERATE },
      { name: 'High Risk', value: high, key: 'HIGH', color: RISK_COLORS.HIGH },
      { name: 'Not Assessed', value: notAssessed, key: 'NOT_ASSESSED', color: RISK_COLORS.NOT_ASSESSED },
    ].filter(item => item.value > 0);
  }, [sessions]);

  // 2. Alert Statistics by Type
  const alertStatsData = useMemo(() => {
    const counts = {
      HIGH_RISK: 0,
      DROWSINESS: 0,
      PHONE_DETECTED: 0,
      DISTRACTION: 0
    };

    alerts.forEach(a => {
      if (counts[a.type] !== undefined) {
        counts[a.type]++;
      } else {
        counts[a.type] = (counts[a.type] || 0) + 1;
      }
    });

    return [
      { name: 'High Risk', count: counts.HIGH_RISK, fill: ALERT_COLORS.HIGH_RISK },
      { name: 'Drowsiness', count: counts.DROWSINESS, fill: ALERT_COLORS.DROWSINESS },
      { name: 'Phone Usage', count: counts.PHONE_DETECTED, fill: ALERT_COLORS.PHONE_DETECTED },
      { name: 'Distraction', count: counts.DISTRACTION, fill: ALERT_COLORS.DISTRACTION },
    ];
  }, [alerts]);

  // 3. Historical Drive Trends (Chronological)
  const sessionTrendsData = useMemo(() => {
    // Reverse to chronological order (oldest to newest)
    const reversed = [...sessions].reverse();

    return reversed.map((s, idx) => {
      const start = new Date(s.start_time).getTime();
      const end = s.end_time ? new Date(s.end_time).getTime() : start;
      const durationMin = Math.round(Math.max(0, (end - start) / 60000) * 10) / 10;

      const latest = s.latest_results || {};

      return {
        sessionName: `Drive #${idx + 1} (${s._id ? s._id.slice(-4) : idx + 1})`,
        frames: s.frame_count || 0,
        durationMinutes: durationMin,
        fatigueScore: latest.fatigue_score ?? 0,
        distractionScore: latest.distraction_score ?? 0,
        overallScore: latest.overall_risk_score ?? 0
      };
    });
  }, [sessions]);

  const hasData = sessions.length > 0 || alerts.length > 0;

  return (
    <div className="fade-in" style={{ marginBottom: '24px' }}>
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <BarChart3 size={20} color="var(--royal-violet)" />
          <h2 style={styles.title}>Safety Telemetry & Incident Analytics</h2>
        </div>
        <div style={styles.dataSourceBadge}>
          Aggregated from {sessions.length} sessions and {alerts.length} alerts
        </div>
      </div>

      {!hasData ? (
        <div className="aurora-card" style={styles.emptyCard}>
          <BarChart3 size={40} color="#94A3B8" />
          <h3 style={styles.emptyTitle}>No Telemetry Data Available</h3>
          <p style={styles.emptyDesc}>
            Analytics are computed exclusively from verified backend MongoDB session logs. Once monitoring runs are completed, trends and risk distributions will visualize here.
          </p>
        </div>
      ) : (
        <div style={styles.chartsGrid}>
          {/* Chart 1: Risk Frame Distribution (Donut) */}
          <div className="aurora-card" style={styles.chartCard}>
            <div className="card-header-flex">
              <div className="card-title">
                <PieIcon size={17} color="var(--royal-violet)" />
                <span>Overall Risk Distribution (All Frames)</span>
              </div>
            </div>
            <div className="card-content" style={styles.chartBody}>
              {riskDistributionData.length === 0 ? (
                <div style={styles.noChartNotice}>No frame risk records available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name) => [`${val} frames`, name]}
                      contentStyle={styles.tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Safety Alerts by Category */}
          <div className="aurora-card" style={styles.chartCard}>
            <div className="card-header-flex">
              <div className="card-title">
                <ShieldAlert size={17} color="#EF4444" />
                <span>Alerts Frequency by Classification</span>
              </div>
            </div>
            <div className="card-content" style={styles.chartBody}>
              {alerts.length === 0 ? (
                <div style={styles.noChartNotice}>Zero safety alerts recorded. All drives safe.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={alertStatsData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4F0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={styles.tooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Incidents">
                      {alertStatsData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Historical Session Frames Trend */}
          <div className="aurora-card" style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
            <div className="card-header-flex">
              <div className="card-title">
                <TrendingUp size={17} color="var(--soft-teal)" />
                <span>Drive Duration & Monitored Frame Trends</span>
              </div>
            </div>
            <div className="card-content" style={styles.chartBody}>
              {sessionTrendsData.length === 0 ? (
                <div style={styles.noChartNotice}>No sessions to display.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sessionTrendsData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4F0" vertical={false} />
                    <XAxis dataKey="sessionName" stroke="#64748B" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#6366F1" fontSize={11} name="Frames" />
                    <YAxis yAxisId="right" orientation="right" stroke="#0D9488" fontSize={11} name="Min" />
                    <Tooltip contentStyle={styles.tooltipStyle} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="frames" fill="#6366F1" radius={[4, 4, 0, 0]} name="Frames Captured" />
                    <Bar yAxisId="right" dataKey="durationMinutes" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Duration (Mins)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  dataSourceBadge: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    backgroundColor: '#F1F5F9',
    padding: '4px 12px',
    borderRadius: '999px',
    fontWeight: '600'
  },
  emptyCard: {
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '14px',
    marginBottom: '6px',
  },
  emptyDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    maxWidth: '460px',
    lineHeight: 1.5,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  chartCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  chartBody: {
    padding: '16px',
    minHeight: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartNotice: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  tooltipStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E4F0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    fontSize: '0.8rem',
  }
};
