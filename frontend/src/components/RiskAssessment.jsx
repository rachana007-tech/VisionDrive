import React from 'react';
import { 
  Eye, 
  AlertCircle, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Smartphone,
  Gauge
} from 'lucide-react';
import { getRiskLevelClass } from '../utils/formatters';

export default function RiskAssessment({ 
  riskData, 
  fatigueData, 
  distractionData, 
  phoneData,
  isLiveMonitoring = false,
  latestResults = null 
}) {
  // Use either live WebSocket data or latest session DB data safely with fallback to {}
  const sourceRisk = (isLiveMonitoring ? riskData : latestResults) || {};
  
  // Extract real backend scores - STRICT: do not fabricate!
  const fatigueScore = sourceRisk?.fatigue_score !== undefined ? sourceRisk.fatigue_score : null;
  const distractionScore = sourceRisk?.distraction_score !== undefined ? sourceRisk.distraction_score : null;
  const overallScore = sourceRisk?.overall_risk_score !== undefined ? sourceRisk.overall_risk_score : null;
  const overallLevel = sourceRisk?.overall_risk_level || (isLiveMonitoring ? 'NOT_ASSESSED' : 'STANDBY');

  const fatigueLevel = isLiveMonitoring 
    ? (fatigueData?.fatigue_level || 'NOT ASSESSED')
    : (sourceRisk?.fatigue_level || (fatigueScore != null ? (fatigueScore >= 80 ? 'HIGH' : fatigueScore >= 40 ? 'MODERATE' : 'LOW') : 'NOT ASSESSED'));

  const overallClass = getRiskLevelClass(overallLevel);
  const fatigueClass = getRiskLevelClass(fatigueLevel);
  const distractionClass = getRiskLevelClass(
    distractionScore != null 
      ? (distractionScore >= 80 ? 'HIGH' : distractionScore >= 40 ? 'MODERATE' : 'LOW') 
      : 'NOT_ASSESSED'
  );

  return (
    <div className="fade-in" style={{ marginBottom: '24px' }}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleRow}>
          <Gauge size={19} color="var(--royal-violet)" />
          <h2 style={styles.sectionTitle}>Real-Time Driver Risk Assessment</h2>
        </div>
        <div style={styles.sourceIndicator}>
          {isLiveMonitoring ? (
            <span style={styles.liveTag}>
              <span className="pulse-dot online" /> Live Stream Telemetry
            </span>
          ) : (
            <span style={styles.historyTag}>
              Historical Session Telemetry
            </span>
          )}
        </div>
      </div>

      <div style={styles.cardsGrid}>
        {/* 1. FATIGUE RISK SCORE CARD */}
        <div className="aurora-card" style={styles.riskCard}>
          <div className="card-header-flex">
            <div className="card-title">
              <Eye size={18} color="var(--royal-violet)" />
              <span>Fatigue Risk Score</span>
            </div>
            <span className={`status-pill ${fatigueClass}`}>
              {fatigueLevel}
            </span>
          </div>

          <div className="card-content" style={styles.cardContentFlex}>
            <div style={styles.gaugeContainer}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#E2E4F0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={fatigueScore >= 80 ? '#EF4444' : fatigueScore >= 40 ? '#F59E0B' : '#10B981'}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={
                    fatigueScore != null 
                      ? 2 * Math.PI * 48 * (1 - Math.min(100, Math.max(0, fatigueScore)) / 100)
                      : 2 * Math.PI * 48
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
                <text
                  x="60"
                  y="56"
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="800"
                  fontSize="22"
                  fill="var(--text-primary)"
                >
                  {fatigueScore != null ? `${fatigueScore}%` : 'N/A'}
                </text>
                <text
                  x="60"
                  y="74"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                  fontSize="10"
                  fill="var(--text-muted)"
                >
                  {fatigueScore != null ? 'FATIGUE' : 'NO DATA'}
                </text>
              </svg>
            </div>

            <div style={styles.metricsList}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Classification</span>
                <span style={{ ...styles.metricValue, fontWeight: 700 }}>{fatigueLevel}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Eye State</span>
                <span style={styles.metricValue}>
                  {fatigueData?.eye_closed ? 'Eyes Closed' : (fatigueData?.face_detected ? 'Eyes Open' : '–')}
                </span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>PERCLOS Window</span>
                <span style={styles.metricValue}>
                  {fatigueData?.perclos != null ? `${(fatigueData.perclos * 100).toFixed(1)}%` : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DISTRACTION RISK SCORE CARD */}
        <div className="aurora-card" style={styles.riskCard}>
          <div className="card-header-flex">
            <div className="card-title">
              <AlertCircle size={18} color="var(--soft-teal)" />
              <span>Distraction Risk Score</span>
            </div>
            <span className={`status-pill ${distractionClass}`}>
              {distractionScore != null ? (distractionScore >= 80 ? 'HIGH' : distractionScore >= 40 ? 'MODERATE' : 'LOW') : 'NOT ASSESSED'}
            </span>
          </div>

          <div className="card-content" style={styles.cardContentFlex}>
            <div style={styles.gaugeContainer}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#E2E4F0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={distractionScore >= 80 ? '#EF4444' : distractionScore >= 40 ? '#F59E0B' : '#14B8A6'}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={
                    distractionScore != null 
                      ? 2 * Math.PI * 48 * (1 - Math.min(100, Math.max(0, distractionScore)) / 100)
                      : 2 * Math.PI * 48
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
                <text
                  x="60"
                  y="56"
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="800"
                  fontSize="22"
                  fill="var(--text-primary)"
                >
                  {distractionScore != null ? `${distractionScore}%` : 'N/A'}
                </text>
                <text
                  x="60"
                  y="74"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                  fontSize="10"
                  fill="var(--text-muted)"
                >
                  {distractionScore != null ? 'DISTRACT' : 'NO DATA'}
                </text>
              </svg>
            </div>

            <div style={styles.metricsList}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Head Direction</span>
                <span style={{ ...styles.metricValue, fontWeight: 700 }}>
                  {distractionData?.head_direction || sourceRisk?.head_direction || '–'}
                </span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Away Duration</span>
                <span style={styles.metricValue}>
                  {distractionData?.looking_away_duration != null 
                    ? `${distractionData.looking_away_duration.toFixed(1)}s` 
                    : '0.0s'}
                </span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Phone Present</span>
                <span style={{ 
                  ...styles.metricValue, 
                  color: (phoneData?.phone_detected || sourceRisk?.phone_detected) ? '#EF4444' : '#10B981',
                  fontWeight: 600
                }}>
                  {(phoneData?.phone_detected || sourceRisk?.phone_detected) ? 'DETECTED' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPOSITE OVERALL RISK CARD */}
        <div className="aurora-card" style={styles.riskCard}>
          <div className="card-header-flex">
            <div className="card-title">
              <Activity size={18} color={overallScore >= 80 ? '#EF4444' : '#6366F1'} />
              <span>Composite Safety Index</span>
            </div>
            <span className={`status-pill ${overallClass}`}>
              {overallLevel}
            </span>
          </div>

          <div className="card-content" style={styles.cardContentFlex}>
            <div style={styles.overallScoreBox}>
              <div style={styles.overallIconWrapper}>
                {overallLevel === 'HIGH' ? (
                  <ShieldX size={34} color="#EF4444" />
                ) : overallLevel === 'MODERATE' ? (
                  <ShieldAlert size={34} color="#F59E0B" />
                ) : (
                  <ShieldCheck size={34} color="#10B981" />
                )}
              </div>
              <div style={styles.overallValueWrapper}>
                <div style={styles.overallScoreText}>
                  {overallScore != null ? `${overallScore}` : '–'}
                  {overallScore != null && <span style={styles.overallMax}>/100</span>}
                </div>
                <div style={styles.overallLevelSub}>
                  {overallLevel === 'HIGH' ? 'Critical Safety Hazard' : overallLevel === 'MODERATE' ? 'Caution Recommended' : 'Optimal Driver Focus'}
                </div>
              </div>
            </div>

            <div style={styles.safetyPolicy}>
              <div style={styles.policyRow}>
                <span style={styles.policyLabel}>Threshold Policy:</span>
                <span style={styles.policyVal}>Max(Fatigue, Distraction)</span>
              </div>
              <div style={styles.policyBar}>
                <div 
                  style={{
                    ...styles.policyProgress,
                    width: `${Math.min(100, Math.max(0, overallScore || 0))}%`,
                    backgroundColor: overallScore >= 80 ? '#EF4444' : overallScore >= 40 ? '#F59E0B' : '#10B981'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  sourceIndicator: {
    display: 'flex',
    alignItems: 'center',
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--soft-teal)',
    backgroundColor: 'var(--soft-teal-subtle)',
    padding: '3px 10px',
    borderRadius: '999px',
  },
  historyTag: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    backgroundColor: '#F1F5F9',
    padding: '3px 10px',
    borderRadius: '999px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  riskCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardContentFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  gaugeContainer: {
    flexShrink: 0,
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    borderLeft: '1px solid var(--border-subtle)',
    paddingLeft: '16px',
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.82rem',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  metricValue: {
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  overallScoreBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    marginBottom: '14px',
  },
  overallIconWrapper: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  overallValueWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  overallScoreText: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.9rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  overallMax: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  overallLevelSub: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  safetyPolicy: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  policyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
  },
  policyLabel: {
    color: 'var(--text-muted)',
  },
  policyVal: {
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  policyBar: {
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  policyProgress: {
    height: '100%',
    transition: 'width 0.4s ease',
  }
};
