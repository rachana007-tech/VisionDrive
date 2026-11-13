
import cv2
import mediapipe as mp
import time
import math


# Mouth landmark indices
MOUTH_TOP = 13
MOUTH_BOTTOM = 14
MOUTH_LEFT = 78
MOUTH_RIGHT = 308

# Additional vertical mouth landmarks
MOUTH_TOP_LEFT = 82
MOUTH_BOTTOM_LEFT = 87
MOUTH_TOP_RIGHT = 312
MOUTH_BOTTOM_RIGHT = 317


def calculate_mar(landmarks, width, height):
    """Calculate Mouth Aspect Ratio (MAR)."""

    def get_point(index):
        landmark = landmarks[index]
        return (
            int(landmark.x * width),
            int(landmark.y * height)
        )

    top = get_point(MOUTH_TOP)
    bottom = get_point(MOUTH_BOTTOM)
    left = get_point(MOUTH_LEFT)
    right = get_point(MOUTH_RIGHT)

    top_left = get_point(MOUTH_TOP_LEFT)
    bottom_left = get_point(MOUTH_BOTTOM_LEFT)
    top_right = get_point(MOUTH_TOP_RIGHT)
    bottom_right = get_point(MOUTH_BOTTOM_RIGHT)

    vertical_1 = math.dist(top, bottom)
    vertical_2 = math.dist(top_left, bottom_left)
    vertical_3 = math.dist(top_right, bottom_right)

    horizontal = math.dist(left, right)

    if horizontal == 0:
        return 0.0

    mar = (
        vertical_1 + vertical_2 + vertical_3
    ) / (3.0 * horizontal)

    return mar


class YawnDetector:

    def __init__(self, mar_threshold=0.6, min_yawn_duration=1.0):
        self.mar_threshold = mar_threshold
        self.min_yawn_duration = min_yawn_duration

        self.mouth_open = False
        self.open_start_time = None
        self.yawn_count = 0

    def update(self, mar, timestamp=None):

        if timestamp is None:
            timestamp = time.monotonic()

        # Handle missing face observation
        if mar is None:
            self.mouth_open = False
            self.open_start_time = None
            return {
                "yawn_detected": False,
                "yawn_count": self.yawn_count,
                "mouth_open": False
            }

        yawn_detected = False

        if mar > self.mar_threshold:

            if not self.mouth_open:
                self.mouth_open = True
                self.open_start_time = timestamp

        else:

            if self.mouth_open:
                duration = timestamp - self.open_start_time

                if duration >= self.min_yawn_duration:
                    self.yawn_count += 1
                    yawn_detected = True

                self.mouth_open = False
                self.open_start_time = None

        return {
            "yawn_detected": yawn_detected,
            "yawn_count": self.yawn_count,
            "mouth_open": self.mouth_open
        }


def main():

    BaseOptions = mp.tasks.BaseOptions
    FaceLandmarker = mp.tasks.vision.FaceLandmarker
    FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
    RunningMode = mp.tasks.vision.RunningMode

    from pathlib import Path

    model_path = (
        Path(__file__).resolve().parent
        / "models"
        / "face_landmarker.task"
    )

    options = FaceLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(model_path)
        ),
        running_mode=RunningMode.VIDEO,
        num_faces=1
    )

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Cannot access webcam")
        return

    detector = YawnDetector()

    print("DriveAware Yawn Detection Started")
    print("Press Q to exit")

    try:
        with FaceLandmarker.create_from_options(options) as landmarker:

            start_time = time.monotonic()

            while True:

                success, frame = camera.read()

                if not success:
                    break

                height, width, _ = frame.shape

                rgb_frame = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB
                )

                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame
                )

                current_time = time.monotonic()

                timestamp_ms = int(
                    (current_time - start_time) * 1000
                )

                result = landmarker.detect_for_video(
                    mp_image,
                    timestamp_ms
                )

                if result.face_landmarks:

                    landmarks = result.face_landmarks[0]

                    mar = calculate_mar(
                        landmarks,
                        width,
                        height
                    )

                    yawn_info = detector.update(
                        mar,
                        current_time
                    )

                    cv2.putText(
                        frame,
                        f"MAR: {mar:.3f}",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Yawn Count: {yawn_info['yawn_count']}",
                        (20, 80),
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
                        (20, 120),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 255),
                        2
                    )

                    if yawn_info["yawn_detected"]:
                        cv2.putText(
                            frame,
                            "YAWN DETECTED!",
                            (20, 165),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.9,
                            (0, 0, 255),
                            2
                        )

                else:

                    # Handle missing face observation
                    detector.update(None, current_time)

                    cv2.putText(
                        frame,
                        "No face detected",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255),
                        2
                    )

                cv2.imshow(
                    "DriveAware - Yawn Detection",
                    frame
                )

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("DriveAware Yawn Detection Stopped")


if __name__ == "__main__":
    main()
