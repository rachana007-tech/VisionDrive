
import sys
from pathlib import Path

import cv2

# Add VisionDrive project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

# Import risk scoring
from backend.risk_scoring import RiskScorer


# Import fatigue and distraction modules
from backend.fatigue.fatigue_detector import FatigueDetector
from backend.distraction import HeadPoseDetector, PhoneDetector


def main():

    # Initialize all detection modules
    print("Initializing VisionDrive detectors...")

    fatigue_detector = FatigueDetector()
    head_detector = HeadPoseDetector()
    phone_detector = PhoneDetector()
    risk_scorer = RiskScorer()

    # Open one webcam
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Camera could not be opened!")

        fatigue_detector.close()
        head_detector.close()
        return

    print("\nVisionDrive Integrated Monitoring Started!")
    print("Press Q to stop the camera.\n")

    try:

        while True:

            # Capture one frame
            ret, frame = cap.read()

            if not ret:
                print("Unable to read camera frame.")
                break

            # -----------------------------------
            # 1. FATIGUE DETECTION
            # -----------------------------------

            fatigue_output = fatigue_detector.process_frame(frame)

            # -----------------------------------
            # 2. HEAD POSE DETECTION
            # -----------------------------------

            head_output = head_detector.process_frame(frame)

            # -----------------------------------
            # 3. PHONE DETECTION
            # -----------------------------------

            phone_output = phone_detector.process_frame(frame)
            risk_output = risk_scorer.process(
            fatigue_output,
            head_output,
            phone_output
            )

            # -----------------------------------
            # DISPLAY FATIGUE STATUS
            # -----------------------------------

            if fatigue_output["face_detected"]:
                fatigue_status = fatigue_output["fatigue_level"]
            else:
                fatigue_status = "NOT ASSESSED"

            cv2.putText(
                frame,
                f"Fatigue: {fatigue_status}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # -----------------------------------
            # DISPLAY HEAD DIRECTION
            # -----------------------------------

            cv2.putText(
                frame,
                f"Head: {head_output['head_direction']}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 0),
                2
            )

            # -----------------------------------
            # DISPLAY LOOKING-AWAY DURATION
            # -----------------------------------

            cv2.putText(
                frame,
                f"Looking Away: {head_output['looking_away_duration']} sec",
                (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2
            )

            # -----------------------------------
            # DISPLAY PHONE DETECTION
            # -----------------------------------

            if phone_output["phone_detected"]:
                phone_status = "PHONE DETECTED"
                phone_color = (0, 0, 255)
            else:
                phone_status = "No Phone"
                phone_color = (0, 255, 0)

            cv2.putText(
                frame,
                phone_status,
                (20, 160),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                phone_color,
                2
            )

            # Display overall driver risk
            risk_level = risk_output["overall_risk_level"]
            risk_score = risk_output["overall_risk_score"]

            if risk_score is None:
              risk_text = "Overall Risk: NOT ASSESSED"
              risk_color = (128, 128, 128)

            else:
              risk_text = f"Overall Risk: {risk_level} ({risk_score})"

            if risk_level == "HIGH":
              risk_color = (0, 0, 255)

            elif risk_level == "MODERATE":
               risk_color = (0, 165, 255)

            else:
               risk_color = (0, 255, 0)

            cv2.putText(
            frame,
            risk_text,
            (20, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            risk_color,
            2
        )

            # -----------------------------------
            # DISPLAY DISTRACTION WARNING
            # -----------------------------------

            if head_output["prolonged_looking_away"]:

                cv2.putText(
                    frame,
                    "DISTRACTION WARNING!",
                    (20, 200),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )

            # -----------------------------------
            # DISPLAY THE CAMERA WINDOW
            # -----------------------------------

            cv2.imshow(
                "VisionDrive - Integrated Driver Monitoring",
                frame
            )

            # Press Q to stop
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:

        # Release camera and detection resources
        cap.release()

        fatigue_detector.close()
        head_detector.close()

        cv2.destroyAllWindows()

        print("\nVisionDrive monitoring stopped!")


if __name__ == "__main__":
    main()
