import cv2

from backend.distraction import (
    HeadPoseDetector,
    GazeDetector,
    DistractionDetector,
    PhoneDetector
)


# Initialize all four modules
head_detector = HeadPoseDetector()
gaze_detector = GazeDetector()
phone_detector = PhoneDetector()
distraction_detector = DistractionDetector()


# Open webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Camera could not be opened!")
    exit()


print("VisionDrive - Integrated Distraction Test Started!")
print("Press Q to exit.")

try:

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        # 1. Head pose detection
        head_output = head_detector.process_frame(frame)

        # 2. Gaze detection
        gaze_output = gaze_detector.process_frame(frame)

        # 3. Prolonged looking-away detection
        distraction_output = distraction_detector.update(
            head_output["head_direction"]
        )

        # 4. Phone detection
        phone_output = phone_detector.process_frame(frame)

        # Display head direction
        cv2.putText(
            frame,
            f"Head: {head_output['head_direction']}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

        # Display gaze direction
        cv2.putText(
            frame,
            f"Gaze: {gaze_output['gaze_direction']}",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2
        )

        # Display looking-away duration
        cv2.putText(
            frame,
            f"Away: {distraction_output['duration']} sec",
            (20, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 255),
            2
        )

        # Display phone status
        phone_status = (
            "Phone Detected"
            if phone_output["phone_detected"]
            else "No Phone"
        )

        cv2.putText(
            frame,
            phone_status,
            (20, 160),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 255),
            2
        )

        # Display prolonged distraction warning
        if distraction_output["prolonged_looking_away"]:

            cv2.putText(
                frame,
                "PROLONGED LOOKING AWAY!",
                (20, 200),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2
            )

        cv2.imshow(
            "VisionDrive - Integrated Test",
            frame
        )

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

finally:

    cap.release()

    head_detector.close()
    gaze_detector.close()

    cv2.destroyAllWindows()

    print("Integrated test stopped!")
    