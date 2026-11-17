import React, { useRef, useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Play, 
  Square, 
  AlertTriangle, 
  Camera, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Timer,
  Smartphone,
  Eye,
  Maximize2
} from 'lucide-react';
import LiveMonitorSocket from '../services/websocket';
import { formatDurationSeconds, getRiskLevelClass } from '../utils/formatters';

export default function LiveMonitoring({ 
  onLiveTelemetry, 
  onNewAlert, 
  backendHealth,
  isMonitoringActive,
  setIsMonitoringActive 
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);

  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'error'
  const [sessionDuration, setSessionDuration] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'error' | 'disconnected'
  const [connectionError, setConnectionError] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);

  // Live timer tick
  useEffect(() => {
    let timer = null;
    if (isMonitoringActive) {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(timer);
  }, [isMonitoringActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  const startMonitoring = async () => {
    setConnectionError(null);
    setConnectionStatus('connecting');

    try {
      // 1. Request Webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraPermission('granted');

      // 2. Initialize WebSocket to backend
      const socket = new LiveMonitorSocket({
        fps: 8, // ~8 frames/sec for smooth MediaPipe + YOLO11 inference
        onOpen: () => {
          setConnectionStatus('connected');
        },
        onSessionCreated: (sessionId) => {
          setActiveSessionId(sessionId);
        },
        onData: (data) => {
          setLiveMetrics(data);
          if (onLiveTelemetry) {
            onLiveTelemetry(data);
          }
        },
        onAlerts: (alerts) => {
          setLiveAlerts(alerts);
          if (onNewAlert) {
            alerts.forEach(a => onNewAlert(a));
          }
        },
        onError: (err) => {
          console.warn('[LiveMonitoring] WebSocket error:', err);
          setConnectionStatus('error');
          setConnectionError(
            'Unable to connect to VisionDrive WebSocket at /ws/monitor. Ensure the FastAPI backend is running.'
          );
        },
        onClose: () => {
          setConnectionStatus('disconnected');
        }
      });

      socketRef.current = socket;
      await socket.connect();

      // 3. Start streaming frames
      socket.startStreaming(videoRef.current);
      setIsMonitoringActive(true);
    } catch (err) {
      console.error('[LiveMonitoring] Start failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setConnectionError('Camera permission was denied. Please allow camera access in browser settings.');
      } else {
        setConnectionError(err.message || 'Failed to start monitoring.');
      }
      stopMonitoring();
    }
  };

  const stopMonitoring = () => {
    // Stop WebSocket streaming and disconnect
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Stop webcam stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsMonitoringActive(false);
    setConnectionStatus('disconnected');
    setActiveSessionId(null);
    setLiveAlerts([]);
  };

  // Helper values from current live telemetry
  const fatigue = liveMetrics?.fatigue;
  const distraction = liveMetrics?.distraction;
  const phone = liveMetrics?.phone;
  const risk = liveMetrics?.risk;
  const overallRiskLevel = risk?.overall_risk_level || 'NOT_ASSESSED';
  const overallRiskScore = risk?.overall_risk_score;

  return (
    <div className="aurora-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="card-header-flex">
        <div className="card-title">
          <Video size={19} color="var(--royal-violet)" />
          <span>Live Driver Monitoring Console</span>
          {isMonitoringActive && (
            <span style={styles.activePill}>
              <span className="pulse-dot online" /> STREAMING TO AI CORE
            </span>
          )}
        </div>

        <div style={styles.headerControls}>
          {/* Duration Stopwatch */}
          <div style={styles.timerBox}>
            <Timer size={15} color="var(--royal-violet)" />
            <span style={styles.timerText}>{formatDurationSeconds(sessionDuration)}</span>
          </div>

          {/* Start/Stop Button */}
          {!isMonitoringActive ? (
            <button
              onClick={startMonitoring}
              disabled={connectionStatus === 'connecting'}
              className="btn-primary"
              style={styles.controlBtn}
            >
              <Play size={16} />
              <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Start Monitoring'}</span>
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="btn-danger"
              style={styles.controlBtn}
            >
              <Square size={16} />
              <span>Stop Monitoring</span>
            </button>
          )}
        </div>
      </div>

      <div className="card-content" style={styles.consoleBody}>
        {/* Error / Backend Warning Notice */}
        {connectionError && (
          <div style={styles.errorBanner}>
            <AlertTriangle size={18} color="#EF4444" />
            <div style={styles.errorText}>
              <strong>Connection Notice:</strong> {connectionError}
            </div>
          </div>
        )}

        <div style={styles.videoStage}>
          {/* Webcam Video Container */}
          <div style={styles.videoWrapper}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                ...styles.videoElement,
                display: isMonitoringActive ? 'block' : 'none'
              }}
            />

            {/* Standby Placeholder when camera is not running */}
            {!isMonitoringActive && (
              <div style={styles.standbyPlaceholder}>
                <div style={styles.standbyIconBox}>
                  <Camera size={44} color="#818CF8" />
                </div>
                <h3 style={styles.standbyTitle}>Camera Monitoring Inactive</h3>
                <p style={styles.standbyDesc}>
                  Click "Start Monitoring" to connect webcam feed directly to the VisionDrive FastAPI AI WebSocket (/ws/monitor).
                </p>
                <div style={styles.standbyNote}>
                  <span>FastAPI WebSocket Status: </span>
                  <strong style={{ color: backendHealth?.isHealthy ? '#10B981' : '#F59E0B' }}>
                    {backendHealth?.isHealthy ? 'Available at ws://127.0.0.1:8000/ws/monitor' : 'Backend Standby'}
                  </strong>
                </div>
              </div>
            )}

            {/* Live Video HUD Overlays */}
            {isMonitoringActive && (
              <>
                {/* Top Status Bar Over Video */}
                <div style={styles.videoTopOverlay}>
                  <div style={styles.hudBadge}>
                    <Activity size={13} color="#2DD4BF" />
                    <span>SESSION: {activeSessionId ? activeSessionId.slice(-8) : 'INIT'}</span>
                  </div>
                  <div style={{
                    ...styles.hudBadge,
                    backgroundColor: overallRiskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(15, 23, 42, 0.75)'
                  }}>
                    <span>RISK: {overallRiskLevel} {overallRiskScore != null ? `(${overallRiskScore})` : ''}</span>
                  </div>
                </div>

                {/* Real-time Alert Banner over Video if triggered */}
                {liveAlerts.length > 0 && (
                  <div style={styles.videoAlertOverlay}>
                    <ShieldAlert size={20} color="#FFFFFF" />
                    <div>
                      <div style={styles.alertHead}>{liveAlerts[0].type}</div>
                      <div style={styles.alertMsg}>{liveAlerts[0].message}</div>
                    </div>
                  </div>
                )}

                {/* Bottom HUD Over Video */}
                <div style={styles.videoBottomOverlay}>
                  <div style={styles.hudMetric}>
                    <span style={styles.hudLabel}>EAR:</span>
                    <span style={styles.hudVal}>
                      {fatigue?.average_ear != null ? fatigue.average_ear.toFixed(2) : '–'}
                    </span>
                  </div>
                  <div style={styles.hudMetric}>
                    <span style={styles.hudLabel}>Head:</span>
                    <span style={styles.hudVal}>
                      {distraction?.head_direction || '–'}
                    </span>
                  </div>
                  <div style={styles.hudMetric}>
                    <span style={styles.hudLabel}>Phone:</span>
                    <span style={{
                      ...styles.hudVal,
                      color: phone?.phone_detected ? '#F87171' : '#34D399'
                    }}>
                      {phone?.phone_detected ? 'DETECTED' : 'CLEAR'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Live Telemetry Sidebar */}
          <div style={styles.telemetrySidebar}>
            <div style={styles.telemetryHeader}>
              <Activity size={16} color="var(--royal-violet)" />
              <span style={styles.telemetryTitle}>Live AI Telemetry</span>
            </div>

            <div style={styles.telemetrySection}>
              <div style={styles.telemetryLabel}>Camera Permission</div>
              <div style={styles.permissionRow}>
                <CheckCircle size={15} color={cameraPermission === 'granted' ? '#10B981' : '#94A3B8'} />
                <span style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: 600,
                  color: cameraPermission === 'granted' ? '#10B981' : 'var(--text-muted)'
                }}>
                  {cameraPermission.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={styles.telemetrySection}>
              <div style={styles.telemetryLabel}>WebSocket Stream</div>
              <div style={styles.streamStatusBox}>
                <span className={`pulse-dot ${connectionStatus === 'connected' ? 'online' : connectionStatus === 'connecting' ? 'warning' : 'offline'}`} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {connectionStatus === 'connected' ? 'Streaming (8-10 FPS)' : connectionStatus === 'connecting' ? 'Connecting to /ws/monitor' : 'Idle'}
                </span>
              </div>
            </div>

            <div style={styles.telemetrySection}>
              <div style={styles.telemetryLabel}>Face Detection State</div>
              <div style={styles.telemetryValBig}>
                {fatigue?.face_detected ? (
                  <span style={{ color: '#10B981' }}>Face Detected</span>
                ) : (
                  <span style={{ color: '#94A3B8' }}>{isMonitoringActive ? 'No Face in Frame' : 'Inactive'}</span>
                )}
              </div>
            </div>

            <div style={styles.telemetryGrid}>
              <div style={styles.metricMini}>
                <span style={styles.miniLabel}>Blink Count</span>
                <span style={styles.miniVal}>{fatigue?.blink_count ?? 0}</span>
              </div>
              <div style={styles.metricMini}>
                <span style={styles.miniLabel}>Yawn Count</span>
                <span style={styles.miniVal}>{fatigue?.yawn_count ?? 0}</span>
              </div>
              <div style={styles.metricMini}>
                <span style={styles.miniLabel}>Looking Away</span>
                <span style={styles.miniVal}>
                  {distraction?.looking_away_duration != null ? `${distraction.looking_away_duration.toFixed(1)}s` : '0.0s'}
                </span>
              </div>
              <div style={styles.metricMini}>
                <span style={styles.miniLabel}>Phone Conf.</span>
                <span style={styles.miniVal}>
                  {phone?.phone_confidence ? `${Math.round(phone.phone_confidence * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div style={styles.noticeBox}>
              <strong>Architectural Note:</strong> Live video frames are encoded as JPEG and streamed via WebSocket directly to the FastAPI detector suite (MediaPipe FaceLandmarker + YOLO11). Detection results are returned in real time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    padding: '7px 14px',
    borderRadius: '8px',
  },
  timerText: {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums'
  },
  controlBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem'
  },
  activePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    border: '1px solid #C7D2FE',
    padding: '2px 8px',
    borderRadius: '6px'
  },
  consoleBody: {
    padding: '20px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--status-high-bg)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '0.82rem',
    color: '#991B1B',
  },
  videoStage: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '20px',
  },
  videoWrapper: {
    position: 'relative',
    backgroundColor: '#0A0C16',
    borderRadius: '14px',
    overflow: 'hidden',
    minHeight: '380px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
    border: '1px solid #1E293B'
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)' // Mirror preview for natural user experience
  },
  standbyPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px',
    textAlign: 'center',
    color: '#94A3B8',
  },
  standbyIconBox: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(129, 140, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  standbyTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '8px',
  },
  standbyDesc: {
    fontSize: '0.85rem',
    color: '#94A3B8',
    maxWidth: '380px',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  standbyNote: {
    fontSize: '0.75rem',
    backgroundColor: '#1E2238',
    padding: '6px 14px',
    borderRadius: '8px',
    color: '#CBD5E1',
  },
  videoTopOverlay: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  hudBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  videoAlertOverlay: {
    position: 'absolute',
    top: '56px',
    left: '12px',
    right: '12px',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    backdropFilter: 'blur(8px)',
    color: '#FFFFFF',
    padding: '10px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 15,
    animation: 'auroraPulse 1.5s infinite',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  alertHead: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.04em',
  },
  alertMsg: {
    fontSize: '0.82rem',
    fontWeight: '500',
  },
  videoBottomOverlay: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    color: '#FFFFFF',
    padding: '6px 14px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-around',
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  hudMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
  },
  hudLabel: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  hudVal: {
    fontWeight: '700',
  },
  telemetrySidebar: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  telemetryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  telemetryTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  telemetrySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  telemetryLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  permissionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  streamStatusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  telemetryValBig: {
    fontSize: '0.9rem',
    fontWeight: '700',
  },
  telemetryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  metricMini: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
  },
  miniLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  miniVal: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.05rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  noticeBox: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    backgroundColor: '#EEF2FF',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #C7D2FE',
    lineHeight: 1.4,
    marginTop: 'auto',
  }
};
