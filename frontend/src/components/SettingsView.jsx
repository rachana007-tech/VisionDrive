import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Database, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Users,
  Code
} from 'lucide-react';
import { getBaseUrl, setBaseUrl, api } from '../services/api';

export default function SettingsView({ backendHealth, onRefreshBackend }) {
  const [apiUrl, setApiUrlState] = useState(getBaseUrl());
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveUrl = () => {
    setBaseUrl(apiUrl);
    setTestResult({ message: 'Base URL saved successfully!', success: true });
    if (onRefreshBackend) onRefreshBackend();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.checkHealth();
      if (result.isHealthy) {
        setTestResult({
          message: `Connection successful! Ping latency: ${result.latency}ms`,
          success: true
        });
      } else {
        setTestResult({
          message: `Health check failed: ${result.error}`,
          success: false
        });
      }
    } catch (err) {
      setTestResult({
        message: `Failed to connect: ${err.message}`,
        success: false
      });
    } finally {
      setIsTesting(false);
      if (onRefreshBackend) onRefreshBackend();
    }
  };

  return (
    <div className="fade-in" style={{ marginBottom: '24px' }}>
      <div style={styles.container}>
        {/* Backend Configuration Card */}
        <div className="aurora-card" style={styles.card}>
          <div className="card-header-flex">
            <div className="card-title">
              <Server size={19} color="var(--royal-violet)" />
              <span>Backend API Server Configuration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`pulse-dot ${backendHealth?.isHealthy ? 'online' : 'offline'}`} />
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: backendHealth?.isHealthy ? '#10B981' : '#EF4444' 
              }}>
                {backendHealth?.isHealthy ? 'FastAPI Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="card-content">
            <div style={styles.inputGroup}>
              <label style={styles.label}>VisionDrive FastAPI Base URL</label>
              <div style={styles.inputRow}>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrlState(e.target.value)}
                  placeholder="http://127.0.0.1:8000"
                  style={styles.input}
                />
                <button onClick={handleSaveUrl} className="btn-secondary" style={styles.actionBtn}>
                  Save
                </button>
                <button 
                  onClick={handleTestConnection} 
                  disabled={isTesting}
                  className="btn-primary" 
                  style={styles.actionBtn}
                >
                  <RefreshCw size={14} style={{ animation: isTesting ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
              <span style={styles.helperText}>
                Default: <code>http://127.0.0.1:8000</code>. WebSocket connects to <code>/ws/monitor</code>.
              </span>
            </div>

            {testResult && (
              <div style={{
                ...styles.resultBox,
                backgroundColor: testResult.success ? 'var(--status-low-bg)' : 'var(--status-high-bg)',
                borderColor: testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                color: testResult.success ? '#065F46' : '#991B1B'
              }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div style={styles.apiEndpointsBox}>
              <div style={styles.endpointsTitle}>Verified Integrated Backend Endpoints:</div>
              <div style={styles.endpointsList}>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/</code>
                  <span style={styles.endpointDesc}>API root welcome message</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/health</code>
                  <span style={styles.endpointDesc}>System status check</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/sessions</code>
                  <span style={styles.endpointDesc}>List all monitoring sessions</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/sessions/{'{session_id}'}</code>
                  <span style={styles.endpointDesc}>Specific session details & results</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/alerts</code>
                  <span style={styles.endpointDesc}>All recorded safety alerts</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodGet}>GET</span>
                  <code>/alerts/{'{session_id}'}</code>
                  <span style={styles.endpointDesc}>Alerts filtered by session</span>
                </div>
                <div style={styles.endpointItem}>
                  <span style={styles.methodWs}>WS</span>
                  <code>/ws/monitor</code>
                  <span style={styles.endpointDesc}>Live webcam binary streaming & AI detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Architecture & Team Contributions */}
        <div className="aurora-card" style={styles.card}>
          <div className="card-header-flex">
            <div className="card-title">
              <Users size={19} color="var(--soft-teal)" />
              <span>VisionDrive Module & Team Architecture</span>
            </div>
          </div>

          <div className="card-content">
            <div style={styles.teamGrid}>
              <div style={styles.teamCard}>
                <div style={styles.teamHeader}>
                  <span style={styles.memberTag}>Member 1</span>
                  <span style={styles.moduleTag}>Distraction Module</span>
                </div>
                <ul style={styles.featureList}>
                  <li>Head pose estimation via cv2.solvePnP</li>
                  <li>Yaw, pitch and roll angle extraction</li>
                  <li>Smoothed direction (Forward, Left, Right, Up, Down)</li>
                  <li>Phone detection via YOLO11 (ultralytics)</li>
                </ul>
              </div>

              <div style={styles.teamCard}>
                <div style={styles.teamHeader}>
                  <span style={styles.memberTag}>Member 2</span>
                  <span style={styles.moduleTag}>Fatigue Module</span>
                </div>
                <ul style={styles.featureList}>
                  <li>MediaPipe Face Landmarker (478 3D landmarks)</li>
                  <li>Eye Aspect Ratio (EAR) calculation & blink counting</li>
                  <li>PERCLOS computation over a 60-second window</li>
                  <li>Mouth Aspect Ratio (MAR) and yawn detection</li>
                  <li>Fatigue level classifier (LOW, MODERATE, HIGH)</li>
                </ul>
              </div>

              <div style={styles.teamCard}>
                <div style={styles.teamHeader}>
                  <span style={styles.memberTag}>Member 3</span>
                  <span style={styles.moduleTag}>Backend Integration</span>
                </div>
                <ul style={styles.featureList}>
                  <li>FastAPI web server & CORS middleware</li>
                  <li>WebSocket endpoint (/ws/monitor) frame processing</li>
                  <li>MongoDB session & alert persistence (database.py)</li>
                  <li>Risk scoring engine (risk_scoring.py)</li>
                </ul>
              </div>

              <div style={styles.teamCard}>
                <div style={styles.teamHeader}>
                  <span style={{ ...styles.memberTag, backgroundColor: '#EEF2FF', color: 'var(--royal-violet)' }}>
                    Member 4 (Current)
                  </span>
                  <span style={{ ...styles.moduleTag, backgroundColor: '#CCFBF1', color: '#0D9488' }}>
                    Frontend & Dashboard
                  </span>
                </div>
                <ul style={styles.featureList}>
                  <li>React.js Aurora design architecture</li>
                  <li>Live WebSocket frame streaming & HUD overlays</li>
                  <li>Real-time telemetry and risk score gauges</li>
                  <li>Historical session inspection & Recharts analytics</li>
                  <li>High-risk audio warning alert with auto-cooldown</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: '240px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  actionBtn: {
    padding: '10px 18px',
    fontSize: '0.85rem',
  },
  helperText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  resultBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.82rem',
    marginBottom: '16px',
  },
  apiEndpointsBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '16px',
    marginTop: '8px',
  },
  endpointsTitle: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  endpointsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  endpointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
  },
  methodGet: {
    backgroundColor: '#EEF2FF',
    color: 'var(--royal-violet)',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.72rem',
  },
  methodWs: {
    backgroundColor: '#CCFBF1',
    color: '#0D9488',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.72rem',
  },
  endpointDesc: {
    fontFamily: 'Inter, sans-serif',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    marginLeft: 'auto',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  teamCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  teamHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberTag: {
    fontSize: '0.75rem',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  moduleTag: {
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
    color: 'var(--text-muted)',
  },
  featureList: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    paddingLeft: '18px',
    lineHeight: 1.6,
  }
};
