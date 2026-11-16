
from datetime import datetime, timezone

from pymongo import MongoClient
from bson import ObjectId

MONGO_URI = "mongodb://localhost:27017/"

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

database = client["visiondrive"]
monitoring_collection = database["monitoring_sessions"]
alerts_collection = database["alerts"]

def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        print("Database:", database.name)
        print("Collection:", monitoring_collection.name)
        return True

    except Exception as error:
        print("MongoDB connection failed:", error)
        return False


def create_session():
    session = {
        "start_time": datetime.now(timezone.utc),
        "end_time": None,
        "status": "active",
        "frame_count": 0,
        "latest_results": {},
        "risk_summary": {
            "LOW": 0,
            "MODERATE": 0,
            "HIGH": 0,
            "NOT_ASSESSED": 0
        },
        "recent_results": []
    }

    result = monitoring_collection.insert_one(session)
    return str(result.inserted_id)


def save_monitoring_result(session_id, fatigue, distraction, phone, risk):

    risk_level = risk.get("overall_risk_level", "NOT_ASSESSED")

    result = {
        "timestamp": datetime.now(timezone.utc),
        "fatigue_score": risk.get("fatigue_score"),
        "distraction_score": risk.get("distraction_score"),
        "overall_risk_score": risk.get("overall_risk_score"),
        "overall_risk_level": risk_level,
        "fatigue_level": fatigue.get("fatigue_level"),
        "head_direction": distraction.get("head_direction"),
        "phone_detected": phone.get("phone_detected", False)
    }

    monitoring_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$inc": {
                "frame_count": 1,
                f"risk_summary.{risk_level}": 1
            },
            "$set": {
                "latest_results": result
            },
            "$push": {
                "recent_results": {
                    "$each": [result],
                    "$slice": -100
                }
            }
        }
    )


def end_session(session_id):
    monitoring_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "end_time": datetime.now(timezone.utc),
                "status": "completed"
            }
        }
    )

def save_alert(session_id, alert):

    alert_document = {
        "session_id": ObjectId(session_id),
        "type": alert["type"],
        "severity": alert["severity"],
        "message": alert["message"],
        "timestamp": datetime.now(timezone.utc)
    }

    result = alerts_collection.insert_one(alert_document)

    return str(result.inserted_id)
    

def get_alerts(session_id=None):
    if session_id:
        query = {"session_id": ObjectId(session_id)}
    else:
        query = {}

    alerts = list(
        alerts_collection.find(query).sort("timestamp", -1)
    )

    for alert in alerts:
        alert["_id"] = str(alert["_id"])
        alert["session_id"] = str(alert["session_id"])
        alert["timestamp"] = alert["timestamp"].isoformat()

    return alerts