
import cv2
import numpy as np

from bson import ObjectId
from fastapi import HTTPException

from backend.database import monitoring_collection

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.fatigue.fatigue_detector import FatigueDetector
from backend.distraction import HeadPoseDetector, PhoneDetector
from backend.risk_scoring import RiskScorer

from backend.database import (
    create_session,
    save_monitoring_result,
    end_session,
    save_alert,
    get_alerts
)

app = FastAPI(
    title="VisionDrive API",
    description="AI-powered Driver Monitoring System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {
        "message": "Welcome to VisionDrive API!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "VisionDrive"
    }


# Get all monitoring sessions
@app.get("/sessions")
def get_sessions():

    sessions = monitoring_collection.find(
        {},
        {"recent_results": 0}
    ).sort("start_time", -1).limit(50)

    result = []

    for session in sessions:
        session["_id"] = str(session["_id"])
        result.append(session)

    return {
        "total_sessions": len(result),
        "sessions": result
    }

@app.get("/alerts")
def get_all_alerts():
    return get_alerts()


@app.get("/alerts/{session_id}")
def get_session_alerts(session_id: str):
    return get_alerts(session_id)


# Get a particular monitoring session
@app.get("/sessions/{session_id}")
def get_session(session_id: str):

    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID"
        )

    session = monitoring_collection.find_one({
        "_id": ObjectId(session_id)
    })

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Monitoring session not found"
        )

    session["_id"] = str(session["_id"])

    return session


def generate_alerts(fatigue, distraction, phone, risk):

    alerts = []

    # Overall high-risk alert
    if risk.get("overall_risk_level") == "HIGH":
        alerts.append({
            "type": "HIGH_RISK",
            "severity": "critical",
            "message": "High-risk driving detected!"
        })

    # Phone detection alert
    if phone.get("phone_detected", False):
        alerts.append({
            "type": "PHONE_DETECTED",
            "severity": "high",
            "message": "Please put your phone away!"
        })

    # Prolonged eye closure alert
    if fatigue.get("prolonged_closure", False):
        alerts.append({
            "type": "DROWSINESS",
            "severity": "critical",
            "message": "Warning! Prolonged eye closure detected."
        })

    # Prolonged distraction alert
    if distraction.get("prolonged_looking_away", False):
        alerts.append({
            "type": "DISTRACTION",
            "severity": "high",
            "message": "Keep your eyes on the road!"
        })

    return alerts



@app.websocket("/ws/monitor")
async def monitor(websocket: WebSocket):

    await websocket.accept()

    fatigue_detector = None
    head_detector = None
    phone_detector = None
    session_id = None

    try:
        # Initialize AI detectors
        fatigue_detector = FatigueDetector()
        head_detector = HeadPoseDetector()
        phone_detector = PhoneDetector()

        risk_scorer = RiskScorer()
        # Track alerts for database storage only
        saved_active_alerts = set()

        # Create a MongoDB monitoring session
        session_id = create_session()

        await websocket.send_json({
            "message": "VisionDrive monitoring connected",
            "session_id": session_id
        })

        while True:

            # Receive webcam frame
            image_bytes = await websocket.receive_bytes()

            image_array = np.frombuffer(
                image_bytes,
                dtype=np.uint8
            )

            frame = cv2.imdecode(
                image_array,
                cv2.IMREAD_COLOR
            )

            if frame is None:
                continue

            # Run AI detection
            fatigue_output = fatigue_detector.process_frame(frame)

            head_output = head_detector.process_frame(frame)

            phone_output = phone_detector.process_frame(frame)

            # Calculate overall risk
            risk_output = risk_scorer.process(
                fatigue_output,
                head_output,
                phone_output
            )

            # Generate all current alerts
            alerts = generate_alerts(
                fatigue_output,
                head_output,
                phone_output,
                risk_output
            )

            # Store each newly activated alert once per session
            current_alert_types = {
                alert["type"] for alert in alerts
            }

            new_alerts_for_storage = [
                alert for alert in alerts
                if alert["type"] not in saved_active_alerts
            ]

            for alert in new_alerts_for_storage:
                save_alert(session_id, alert)

            saved_active_alerts = current_alert_types

            # Save results in MongoDB
            save_monitoring_result(
                session_id,
                fatigue_output,
                head_output,
                phone_output,
                risk_output
            )

            # Send results to frontend
            await websocket.send_json({
                "fatigue": fatigue_output,
                "distraction": head_output,
                "phone": phone_output,
                "risk": risk_output,
                "alerts": alerts
            })

    except WebSocketDisconnect:
        print("Frontend disconnected from VisionDrive")

    except Exception as error:
        print("WebSocket error:", error)

    finally:

        # Mark monitoring session as completed
        if session_id:
            end_session(session_id)

        if fatigue_detector:
            fatigue_detector.close()

        if head_detector:
            head_detector.close()

        print("VisionDrive monitoring stopped")
