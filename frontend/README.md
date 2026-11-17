# VisionDrive – Aurora Frontend & Driver Monitoring Console

**Member 4 Contribution: Frontend UI/UX, Real-Time Telemetry & Dashboard Integration**

---

## Overview

VisionDrive Aurora is a commercial-grade automotive safety monitoring dashboard built with React 18, Vite, Lucide Icons, and Recharts. It connects to the VisionDrive FastAPI AI backend to monitor driver fatigue and distraction in real time through webcam video frames and WebSocket streaming, while displaying historical session data and safety incidents stored in MongoDB.

### Design Concept: VisionDrive – Aurora
- **Background**: Soft lavender-grey (`#F4F3F8`)
- **Sidebar**: Deep indigo (`#111222`)
- **Card Surfaces**: Muted blue-grey & crisp white with subtle violet borders
- **Primary Accent**: Royal violet (`#6366F1`)
- **Secondary Accent**: Soft teal (`#0D9488` / `#14B8A6`)
- **Typography**: Dark navy (`#0F172A`) with Inter & Manrope typefaces

---

## Project Structure

```
frontend/
├── index.html                 # Entry HTML with Inter & Manrope fonts
├── package.json               # React 18, Recharts, Lucide React, Vite
├── vite.config.js             # Vite configuration pinned to port 5173
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Layout orchestrator & tab routing
│   ├── index.css              # Aurora design system styles & animations
│   ├── components/
│   │   ├── Sidebar.jsx        # Navigation, branding & AI status indicators
│   │   ├── Header.jsx         # Live clock, driver profile, backend ping
│   │   ├── OverviewCards.jsx  # 4 high-level session & health metrics
│   │   ├── RiskAssessment.jsx # Fatigue, distraction & composite gauges
│   │   ├── LiveMonitoring.jsx # Webcam feed, WS streaming & live HUD
│   │   ├── DriverBehaviour.jsx# EAR, blink, MAR, yawn, 3D pose, phone
│   │   ├── SafetyAlerts.jsx   # Filterable alerts list & incident timeline
│   │   ├── SessionHistory.jsx # Session table & detail inspection modal
│   │   ├── AnalyticsView.jsx  # Recharts risk distributions & trends
│   │   └── SettingsView.jsx   # Base URL config, health test, team matrix
│   ├── services/
│   │   ├── api.js             # REST API service for all backend routes
│   │   └── websocket.js       # Live binary frame streamer (/ws/monitor)
│   └── utils/
│       └── formatters.js      # Timestamps, duration, and score formatters
```

---

## How to Run the Frontend

1. Open a terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser at:
   ```
   http://localhost:5173
   ```
   *(Port 5173 matches the FastAPI backend's CORS whitelist configured in `backend/main.py`)*

---

## Backend Requirements

The frontend integrates with the FastAPI backend running at `http://127.0.0.1:8000`:
- **Root**: `GET /`
- **Health**: `GET /health`
- **Sessions**: `GET /sessions` and `GET /sessions/{session_id}`
- **Alerts**: `GET /alerts` and `GET /alerts/{session_id}`
- **Live Video Streaming**: `ws://127.0.0.1:8000/ws/monitor`

> **Backend Note**: Ensure MongoDB is running and `pymongo` is installed in the Python environment (`pip install pymongo`). Run the backend using:
> ```bash
> uvicorn backend.main:app --reload --port 8000
> ```
