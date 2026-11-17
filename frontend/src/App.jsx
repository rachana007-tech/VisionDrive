import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import RiskAssessment from './components/RiskAssessment';
import LiveMonitoring from './components/LiveMonitoring';
import DriverBehaviour from './components/DriverBehaviour';
import SafetyAlerts from './components/SafetyAlerts';
import SessionHistory from './components/SessionHistory';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import api from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('[ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', margin: '16px 0' }}>
          <h4 style={{ color: '#991B1B', marginBottom: '6px', fontWeight: 700 }}>Telemetry Rendering Notice</h4>
          <p style={{ color: '#7F1D1D', fontSize: '0.85rem' }}>{this.state.error?.message || 'Rendering error caught.'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '10px', padding: '6px 12px', background: '#DC2626', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Recover
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendHealth, setBackendHealth] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  // Fetch all initial data from backend
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [healthRes, sessionsRes, alertsRes] = await Promise.allSettled([
        api.checkHealth(),
        api.getSessions(),
        api.getAllAlerts()
      ]);

      if (healthRes.status === 'fulfilled') {
        setBackendHealth(healthRes.value);
      } else {
        setBackendHealth({ isHealthy: false, error: 'Health check unreachable' });
      }

      if (sessionsRes.status === 'fulfilled') {
        const sData = sessionsRes.value;
        // backend /sessions returns { total_sessions: N, sessions: [...] }
        setSessions(sData.sessions || []);
      }

      if (alertsRes.status === 'fulfilled') {
        // backend /alerts returns Array<Alert>
        setAlerts(alertsRes.value || []);
      }
    } catch (err) {
      console.warn('[VisionDrive App] Refresh error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Periodic light health polling
    const interval = setInterval(() => {
      fetchData(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle incoming live alerts from WebSocket
  const handleNewAlert = useCallback((newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  // Handle incoming live telemetry frames
  const handleLiveTelemetry = useCallback((data) => {
    setLiveTelemetry(data);
  }, []);

  const latestSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="app-container">
      {/* Subtle Aurora Ambient Glows */}
      <div className="aurora-glow-1" />
      <div className="aurora-glow-2" />

      {/* Deep Indigo Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        backendHealth={backendHealth}
        alertCount={alerts.length}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          backendHealth={backendHealth}
          onRefresh={() => fetchData(false)}
          isRefreshing={isRefreshing}
          onStartLive={() => setCurrentTab('live')}
          isMonitoringActive={isMonitoringActive}
        />

        {/* Dynamic Content Views */}
        <main className="content-body">
          {currentTab === 'dashboard' && (
            <>
              {/* 1. Overview Metric Cards */}
              <OverviewCards
                totalSessions={sessions.length}
                totalAlerts={alerts.length}
                backendHealth={backendHealth}
                latestSession={latestSession}
                onViewHistory={() => setCurrentTab('history')}
                onViewAlerts={() => setCurrentTab('alerts')}
                onViewSettings={() => setCurrentTab('settings')}
              />

              {/* 2. Risk Assessment */}
              <ErrorBoundary>
                <RiskAssessment
                  riskData={liveTelemetry?.risk}
                  fatigueData={liveTelemetry?.fatigue}
                  distractionData={liveTelemetry?.distraction}
                  phoneData={liveTelemetry?.phone}
                  isLiveMonitoring={isMonitoringActive}
                  latestResults={latestSession?.latest_results}
                />
              </ErrorBoundary>

              {/* 3. Driver Behaviour Telemetry */}
              <ErrorBoundary>
                <DriverBehaviour
                  fatigueData={liveTelemetry?.fatigue}
                  distractionData={liveTelemetry?.distraction}
                  phoneData={liveTelemetry?.phone}
                  isLiveMonitoring={isMonitoringActive}
                  latestResults={latestSession?.latest_results}
                />
              </ErrorBoundary>

              {/* 4. Recent Safety Alerts Preview */}
              <SafetyAlerts
                alerts={alerts.slice(0, 5)}
                sessions={sessions}
                isLoading={isLoading}
                onSelectSession={(sId) => {
                  setSelectedSessionId(sId);
                  setCurrentTab('history');
                }}
              />
            </>
          )}

          {currentTab === 'live' && (
            <>
              {/* Live Webcam & WebSocket Streaming Console */}
              <LiveMonitoring
                onLiveTelemetry={handleLiveTelemetry}
                onNewAlert={handleNewAlert}
                backendHealth={backendHealth}
                isMonitoringActive={isMonitoringActive}
                setIsMonitoringActive={setIsMonitoringActive}
              />

              {/* Live Risk Assessment */}
              <ErrorBoundary>
                <RiskAssessment
                  riskData={liveTelemetry?.risk}
                  fatigueData={liveTelemetry?.fatigue}
                  distractionData={liveTelemetry?.distraction}
                  phoneData={liveTelemetry?.phone}
                  isLiveMonitoring={isMonitoringActive}
                  latestResults={latestSession?.latest_results}
                />
              </ErrorBoundary>

              {/* Live Driver Behaviour Telemetry */}
              <ErrorBoundary>
                <DriverBehaviour
                  fatigueData={liveTelemetry?.fatigue}
                  distractionData={liveTelemetry?.distraction}
                  phoneData={liveTelemetry?.phone}
                  isLiveMonitoring={isMonitoringActive}
                  latestResults={latestSession?.latest_results}
                />
              </ErrorBoundary>
            </>
          )}

          {currentTab === 'history' && (
            <SessionHistory
              sessions={sessions}
              isLoading={isLoading}
              selectedSessionId={selectedSessionId}
              setSelectedSessionId={setSelectedSessionId}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              sessions={sessions}
              alerts={alerts}
            />
          )}

          {currentTab === 'alerts' && (
            <SafetyAlerts
              alerts={alerts}
              sessions={sessions}
              isLoading={isLoading}
              onSelectSession={(sId) => {
                setSelectedSessionId(sId);
                setCurrentTab('history');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              backendHealth={backendHealth}
              onRefreshBackend={() => fetchData(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
