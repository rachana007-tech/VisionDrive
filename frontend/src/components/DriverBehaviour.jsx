import React from 'react';
import { 
  Eye, 
  Smile, 
  Compass, 
  Smartphone, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCw
} from 'lucide-react';

export default function DriverBehaviour({ 
  fatigueData, 
  distractionData, 
  phoneData,
  isLiveMonitoring = false,
  latestResults = null 
}) {
  const fatigue = isLiveMonitoring ? fatigueData : null;
  const distraction = isLiveMonitoring ? distractionData : null;
  const phone = isLiveMonitoring ? phoneData : null;
  const fallback = latestResults || {};

  // Eye status
  const eyeClosed = fatigue?.eye_closed ?? false;
  const avgEar = fatigue?.average_ear ?? null;
  const earA = fatigue?.ear_a ?? null;
  const earB = fatigue?.ear_b ?? null;
  const prolongedClosure = fatigue?.prolonged_closure ?? false;

  // Blink detection
  const blinkCount = fatigue?.blink_count ?? null;

  // Yawn detection
  const mouthOpen = fatigue?.mouth_open ?? false;
  const mar = fatigue?.mar ?? null;
  const yawnCount = fatigue?.yawn_count ?? null;
  const yawnDetected = fatigue?.yawn_detected ?? false;

  // Head position
  const headDirection = distraction?.head_direction || fallback.head_direction || 'Forward';
  const yaw = distraction?.yaw ?? null;
  const pitch = distraction?.pitch ?? null;
  const roll = distraction?.roll ?? null;
  const lookingAwayDuration = distraction?.looking_away_duration ?? null;
  const prolongedLookingAway = distraction?.prolonged_looking_away ?? false;

  // Phone detection
  const phoneDetected = phone?.phone_detected ?? fallback.phone_detected ?? false;
  const phoneConfidence = phone?.phone_confidence ?? null;
  const phoneCount = phone?.phone_detection_count ?? (phoneDetected ? 1 : 0);

  return (
    <div className="aurora-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="card-header-flex">
        <div className="card-title">
          <Compass size={19} color="var(--royal-violet)" />
          <span>Driver Behaviour & Visual Telemetry</span>
        </div>
        <span style={styles.subtext}>
          {isLiveMonitoring ? 'Real-Time Sensor Feed' : 'Last Session Snapshot'}
        </span>
      </div>

      <div className="card-content" style={styles.contentGrid}>
        {/* 1. EYE STATUS & EAR */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={styles.iconTag}>
              <Eye size={17} color="var(--royal-violet)" />
            </div>
            <span style={styles.telemetryHeading}>Eye Status & EAR</span>
            <span 
              className={`status-pill ${eyeClosed ? 'high' : 'low'}`}
              style={{ marginLeft: 'auto' }}
            >
              {eyeClosed ? 'Closed' : 'Open'}
            </span>
          </div>

          <div style={styles.metricGrid2}>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Avg EAR</span>
              <span style={styles.cellValue}>
                {avgEar != null ? avgEar.toFixed(3) : '–'}
              </span>
            </div>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>EAR (L / R)</span>
              <span style={styles.cellValue}>
                {earA != null && earB != null ? `${earA.toFixed(2)} / ${earB.toFixed(2)}` : '–'}
              </span>
            </div>
          </div>

          <div style={{ ...styles.alertStatusRow, borderColor: prolongedClosure ? '#EF4444' : '#E2E4F0' }}>
            <span style={styles.alertLabel}>Prolonged Closure:</span>
            <span style={{ 
              fontWeight: 700, 
              color: prolongedClosure ? '#EF4444' : '#10B981' 
            }}>
              {prolongedClosure ? 'WARNING ACTIVE' : 'Normal'}
            </span>
          </div>
        </div>

        {/* 2. BLINK DETECTION */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={{ ...styles.iconTag, backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--soft-teal)' }}>
              <RotateCw size={17} />
            </div>
            <span style={styles.telemetryHeading}>Blink Dynamics</span>
          </div>

          <div style={styles.bigStatContainer}>
            <div style={styles.bigStatValue}>
              {blinkCount != null ? blinkCount : '–'}
            </div>
            <div style={styles.bigStatLabel}>Total Blinks Registered</div>
          </div>

          <div style={styles.infoRow}>
            <span>Adaptive Threshold:</span>
            <strong style={{ color: 'var(--text-secondary)' }}>0.21 EAR</strong>
          </div>
        </div>

        {/* 3. YAWNING & MOUTH (MAR) */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={{ ...styles.iconTag, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <Smile size={17} />
            </div>
            <span style={styles.telemetryHeading}>Yawning & Mouth (MAR)</span>
            <span 
              className={`status-pill ${yawnDetected ? 'high' : mouthOpen ? 'moderate' : 'low'}`}
              style={{ marginLeft: 'auto' }}
            >
              {yawnDetected ? 'Yawning' : mouthOpen ? 'Open' : 'Normal'}
            </span>
          </div>

          <div style={styles.metricGrid2}>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>MAR Value</span>
              <span style={styles.cellValue}>
                {mar != null ? mar.toFixed(3) : '–'}
              </span>
            </div>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Yawn Count</span>
              <span style={styles.cellValue}>
                {yawnCount != null ? yawnCount : '–'}
              </span>
            </div>
          </div>

          <div style={styles.alertStatusRow}>
            <span style={styles.alertLabel}>Yawn Event:</span>
            <span style={{ 
              fontWeight: 700, 
              color: yawnDetected ? '#EF4444' : '#10B981' 
            }}>
              {yawnDetected ? 'DETECTED' : 'None'}
            </span>
          </div>
        </div>

        {/* 4. HEAD POSITION & 3D POSE */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={{ ...styles.iconTag, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--royal-violet)' }}>
              <Compass size={17} />
            </div>
            <span style={styles.telemetryHeading}>3D Head Pose & Direction</span>
            <span 
              className={`status-pill ${prolongedLookingAway ? 'high' : headDirection === 'Forward' ? 'low' : 'moderate'}`}
              style={{ marginLeft: 'auto' }}
            >
              {headDirection}
            </span>
          </div>

          <div style={styles.metricGrid3}>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Yaw</span>
              <span style={styles.cellValue}>{yaw != null ? `${yaw}°` : '–'}</span>
            </div>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Pitch</span>
              <span style={styles.cellValue}>{pitch != null ? `${pitch}°` : '–'}</span>
            </div>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Roll</span>
              <span style={styles.cellValue}>{roll != null ? `${roll}°` : '–'}</span>
            </div>
          </div>

          <div style={{ ...styles.alertStatusRow, borderColor: prolongedLookingAway ? '#EF4444' : '#E2E4F0' }}>
            <span style={styles.alertLabel}>Looking Away:</span>
            <span style={{ 
              fontWeight: 700, 
              color: prolongedLookingAway ? '#EF4444' : 'var(--text-secondary)' 
            }}>
              {lookingAwayDuration != null ? `${lookingAwayDuration.toFixed(1)}s` : '0.0s'}
            </span>
          </div>
        </div>

        {/* 5. GAZE DIRECTION NOTICE */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={{ ...styles.iconTag, backgroundColor: '#F1F5F9', color: '#64748B' }}>
              <Info size={17} />
            </div>
            <span style={styles.telemetryHeading}>Gaze Direction Status</span>
            <span className="status-pill neutral" style={{ marginLeft: 'auto' }}>
              AI Replaced
            </span>
          </div>

          <div style={styles.noteContainer}>
            <p style={styles.noteParagraph}>
              Gaze tracking was superseded by <strong>3D Head Pose Estimation (PnP)</strong> & <strong>Blink EAR</strong> in the backend detection pipeline (commit <code>885f059</code>).
            </p>
            <div style={styles.subDetail}>
              Orientation is reliably inferred via MediaPipe 3D face mesh angles (Yaw/Pitch/Roll) with direction smoothing.
            </div>
          </div>
        </div>

        {/* 6. PHONE DETECTION */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryCardHeader}>
            <div style={{ 
              ...styles.iconTag, 
              backgroundColor: phoneDetected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: phoneDetected ? '#EF4444' : '#10B981' 
            }}>
              <Smartphone size={17} />
            </div>
            <span style={styles.telemetryHeading}>Phone Detection (YOLO11)</span>
            <span 
              className={`status-pill ${phoneDetected ? 'high' : 'low'}`}
              style={{ marginLeft: 'auto' }}
            >
              {phoneDetected ? 'Phone Present' : 'Clean'}
            </span>
          </div>

          <div style={styles.metricGrid2}>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Status</span>
              <span style={{ 
                ...styles.cellValue, 
                color: phoneDetected ? '#EF4444' : '#10B981',
                fontSize: '0.9rem'
              }}>
                {phoneDetected ? 'PHONE DETECTED' : 'Not Detected'}
              </span>
            </div>
            <div style={styles.metricCell}>
              <span style={styles.cellLabel}>Model Confidence</span>
              <span style={styles.cellValue}>
                {phoneConfidence != null ? `${(phoneConfidence * 100).toFixed(0)}%` : '–'}
              </span>
            </div>
          </div>

          <div style={styles.alertStatusRow}>
            <span style={styles.alertLabel}>Safety Protocol:</span>
            <span style={{ 
              fontWeight: 600, 
              color: phoneDetected ? '#EF4444' : 'var(--text-muted)' 
            }}>
              {phoneDetected ? 'CRITICAL DISTRACTION' : 'Compliant'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  subtext: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
  },
  telemetryCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '175px',
  },
  telemetryCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  iconTag: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryHeading: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  metricGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '12px',
  },
  metricGrid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    marginBottom: '12px',
  },
  metricCell: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
  },
  cellLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  cellValue: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  alertStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-subtle)',
  },
  alertLabel: {
    color: 'var(--text-muted)',
  },
  bigStatContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
  },
  bigStatValue: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--soft-teal)',
    lineHeight: 1,
  },
  bigStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-subtle)',
  },
  noteContainer: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
  noteParagraph: {
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  },
  subDetail: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  }
};
