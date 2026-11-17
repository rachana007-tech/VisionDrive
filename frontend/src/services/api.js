/**
 * VisionDrive API Service
 * Integrates with FastAPI backend running on http://127.0.0.1:8000
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';

export const getBaseUrl = () => {
  return localStorage.getItem('visiondrive_api_url') || DEFAULT_BASE_URL;
};

export const setBaseUrl = (url) => {
  if (!url) {
    localStorage.removeItem('visiondrive_api_url');
  } else {
    localStorage.setItem('visiondrive_api_url', url.replace(/\/+$/, ''));
  }
};

/**
 * Generic request helper with timeout and robust error catching
 */
async function request(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string' 
            ? errorJson.detail 
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Not JSON
      }
      const err = new Error(errorDetail);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error(`Connection timeout reaching ${url}`);
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw error;
  }
}

export const api = {
  /**
   * Root welcome endpoint: GET /
   * Expected response: { message: string, status: string }
   */
  async getRoot() {
    return request('/');
  },

  /**
   * Health check endpoint: GET /health
   * Expected response: { status: "healthy", application: "VisionDrive" }
   */
  async checkHealth() {
    const startTime = performance.now();
    try {
      const data = await request('/health', { timeout: 4000 });
      const latency = Math.round(performance.now() - startTime);
      return {
        isHealthy: data.status === 'healthy',
        application: data.application || 'VisionDrive',
        latency,
        data,
        error: null
      };
    } catch (err) {
      return {
        isHealthy: false,
        application: 'VisionDrive',
        latency: null,
        data: null,
        error: err.message || 'Cannot reach VisionDrive backend'
      };
    }
  },

  /**
   * Monitoring sessions list: GET /sessions
   * Expected response: { total_sessions: number, sessions: Array<Session> }
   */
  async getSessions() {
    return request('/sessions');
  },

  /**
   * Specific session details: GET /sessions/{session_id}
   * Expected response: Session object with recent_results array
   */
  async getSessionById(sessionId) {
    if (!sessionId) throw new Error('Session ID is required');
    return request(`/sessions/${encodeURIComponent(sessionId)}`);
  },

  /**
   * All safety alerts: GET /alerts
   * Expected response: Array<Alert>
   */
  async getAllAlerts() {
    return request('/alerts');
  },

  /**
   * Alerts for a particular session: GET /alerts/{session_id}
   * Expected response: Array<Alert>
   */
  async getSessionAlerts(sessionId) {
    if (!sessionId) throw new Error('Session ID is required');
    return request(`/alerts/${encodeURIComponent(sessionId)}`);
  }
};

export default api;
