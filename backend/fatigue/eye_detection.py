
from .blink_detection import BlinkDetector
from .ear_calculation import calculate_ear
from .perclos import PerclosCalculator
from .yawn_detection import YawnDetector, calculate_mar
from .fatigue_classification import FatigueClassifier

import cv2
import mediapipe as mp
import time
from pathlib import Path


# Model location
MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "face_landmarker.task"
)


# Six landmark points required for EAR calculation
EYE_A = [33, 160, 158, 133, 153, 144]
EYE_B = [362, 385, 387, 263, 373, 380]


def get_eye_coordinates(landmarks, indices, width, height):
    """Extract eye landmark coordinates."""

    points = []

    for index in indices:
        landmark = landmarks[index]

        x = int(landmark.x * width)
        y = int(landmark.y * height)

        points.append((x, y))

    return points


def draw_eye(frame, points, label):
    """Draw eye landmarks and contour."""

    # Draw landmark points
    for point in points:
        cv2.circle(frame, point, 3, (0, 255, 0), -1)

    # Connect the points
    for i in range(len(points)):
        next_index = (i + 1) % len(points)

        cv2.line(
            frame,
            points[i],
            points[next_index],
            (255, 255, 0),
            1
        )

    # Display eye label
    x, y = points[0]

    cv2.putText(
        frame,
        label,
        (x - 20, y - 15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (0, 255, 255),
        1
    )


def main():

    # MediaPipe Tasks API
    BaseOptions = mp.tasks.BaseOptions
    FaceLandmarker = mp.tasks.vision.FaceLandmarker
    FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
    RunningMode = mp.tasks.vision.RunningMode

    # Configure Face Landmarker
    options = FaceLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(MODEL_PATH)
        ),
        running_mode=RunningMode.VIDEO,
        num_faces=1
    )

    # Open webcam
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Cannot access webcam")
        return

    print("DriveAware Fatigue Detection Started")
    print("Press Q to exit")

    try:
        with FaceLandmarker.create_from_options(options) as landmarker:

            start_time = time.monotonic()

            blink_detector = BlinkDetector()
            perclos_calculator = PerclosCalculator(window_seconds=60)
            yawn_detector = YawnDetector()
            fatigue_classifier = FatigueClassifier()

            perclos_info = {"perclos": 0.0}

            while True:

                success, frame = camera.read()

                if not success:
                    print("Unable to capture frame")
                    break

                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB
                )

                # Create MediaPipe image
                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame
                )

                # Generate timestamp
                current_timestamp = time.monotonic()

                timestamp_ms = int(
                    (current_timestamp - start_time) * 1000
                )

                # Detect facial landmarks
                result = landmarker.detect_for_video(
                    mp_image,
                    timestamp_ms
                )

                height, width, _ = frame.shape

                if result.face_landmarks:

                    landmarks = result.face_landmarks[0]

                    # -------------------------------
                    # EYE DETECTION AND EAR
                    # -------------------------------

                    eye_a = get_eye_coordinates(
                        landmarks,
                        EYE_A,
                        width,
                        height
                    )

                    eye_b = get_eye_coordinates(
                        landmarks,
                        EYE_B,
                        width,
                        height
                    )

                    # Calculate EAR for both eyes
                    ear_a = calculate_ear(eye_a)
                    ear_b = calculate_ear(eye_b)

                    # Calculate average EAR
                    average_ear = (ear_a + ear_b) / 2

                    # Process blink detection
                    blink_info = blink_detector.update(
                        average_ear,
                        current_timestamp
                    )

                    blink_count = blink_info["blink_count"]
                    eye_closed = blink_info["eye_closed"]
                    prolonged_closure = blink_info["prolonged_closure"]

                    # Update PERCLOS
                    perclos_info = perclos_calculator.update(
                        eye_closed,
                        current_timestamp
                    )

                    # Draw both eyes
                    draw_eye(frame, eye_a, "Eye A")
                    draw_eye(frame, eye_b, "Eye B")

                    # -------------------------------
                    # YAWN DETECTION AND MAR
                    # -------------------------------

                    mar = calculate_mar(
                        landmarks,
                        width,
                        height
                    )

                    yawn_info = yawn_detector.update(
                        mar,
                        current_timestamp
                    )

                    # -------------------------------
                    # FATIGUE CLASSIFICATION
                    # -------------------------------

                    fatigue_info = fatigue_classifier.update(
                        perclos=perclos_info["perclos"],
                        prolonged_closure=prolonged_closure,
                        yawn_detected=yawn_info["yawn_detected"],
                        timestamp=current_timestamp
                    )

                    fatigue_level = fatigue_info["fatigue_level"]

                    # Select display color
                    if fatigue_level == "HIGH":
                        fatigue_color = (0, 0, 255)

                    elif fatigue_level == "MODERATE":
                        fatigue_color = (0, 165, 255)

                    else:
                        fatigue_color = (0, 255, 0)

                    # -------------------------------
                    # DISPLAY EYE INFORMATION
                    # -------------------------------

                    cv2.putText(
                        frame,
                        "Eye Landmarks Detected",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Eye A EAR: {ear_a:.3f}",
                        (20, 75),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.65,
                        (0, 255, 255),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Eye B EAR: {ear_b:.3f}",
                        (20, 105),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.65,
                        (0, 255, 255),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Average EAR: {average_ear:.3f}",
                        (20, 140),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Blink Count: {blink_count}",
                        (20, 175),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    eye_status = "CLOSED" if eye_closed else "OPEN"

                    cv2.putText(
                        frame,
                        f"Eye Status: {eye_status}",
                        (20, 210),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255) if eye_closed else (0, 255, 0),
                        2
                    ) 
                    
                    cv2.putText(
                        frame,
                        f"Prolonged Closure: {prolonged_closure}",
                        (20, 530),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 0, 255) if prolonged_closure else (0, 255, 0),
                        2
                    )

                    

                    cv2.putText(
                        frame,
                        f"PERCLOS: {perclos_info['perclos']:.2f}%",
                        (20, 245),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    if prolonged_closure:
                        cv2.putText(
                            frame,
                            "WARNING: PROLONGED EYE CLOSURE",
                            (20, 280),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 0, 255),
                            2
                        )

                    # -------------------------------
                    # DISPLAY YAWN INFORMATION
                    # -------------------------------

                    cv2.putText(
                        frame,
                        f"MAR: {mar:.3f}",
                        (20, 320),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Yawn Count: {yawn_info['yawn_count']}",
                        (20, 355),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 0),
                        2
                    )

                    mouth_status = (
                        "OPEN" if yawn_info["mouth_open"] else "CLOSED"
                    )

                    cv2.putText(
                        frame,
                        f"Mouth Status: {mouth_status}",
                        (20, 390),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 255),
                        2
                    )

                    if yawn_info["yawn_detected"]:
                        cv2.putText(
                            frame,
                            "YAWN DETECTED!",
                            (20, 430),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.9,
                            (0, 0, 255),
                            2
                        )

                    # -------------------------------
                    # DISPLAY FATIGUE LEVEL
                    # -------------------------------

                    cv2.putText(
                        frame,
                        f"FATIGUE LEVEL: {fatigue_level}",
                        (20, 465),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        fatigue_color,
                        2
                    )
                    reason_text = ", ".join(fatigue_info["reasons"])

                    cv2.putText(
                        frame,
                        f"Reason: {reason_text}",
                        (20, 500),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        fatigue_color,
                        2
                    )

                else:

                    # Handle missing face observation
                    perclos_info = perclos_calculator.update(
                        None,
                        current_timestamp
                    )

                    # Reset yawn tracking when face is missing
                    yawn_detector.update(
                        None,
                        current_timestamp
                    )

                    # Update classifier to expire old yawns
                    fatigue_classifier.update(
                        perclos=perclos_info["perclos"],
                        prolonged_closure=False,
                        yawn_detected=False,
                        timestamp=current_timestamp
                    )

                    cv2.putText(
                        frame,
                        "No face detected",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"PERCLOS: {perclos_info['perclos']:.2f}%",
                        (20, 75),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        "FATIGUE LEVEL: NOT ASSESSED",
                        (20, 115),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 165, 255),
                        2
                    )

                # Display webcam output
                # Resize camera frame to a larger display size
                display_frame = cv2.resize(
                    frame,
                    (1280, 720)
                )

                cv2.imshow(
                    "DriveAware - Fatigue Detection",
                    display_frame
                )
                

                # Press Q to exit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("DriveAware Detection Stopped")


if __name__ == "__main__":
    main()
