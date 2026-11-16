import time
import cv2
import mediapipe as mp
import numpy as np

from collections import deque, Counter
from .distraction_detection import DistractionDetector


# --------------------------------------------------
# 1. HEAD DIRECTION CLASSIFICATION
# --------------------------------------------------

def get_head_direction(yaw, pitch):

    baseline_yaw = -7
    baseline_pitch = -178

    yaw_diff = yaw - baseline_yaw

    pitch_diff = (pitch - baseline_pitch + 180) % 360 - 180

    yaw_threshold = 12
    pitch_threshold = 12

    if pitch_diff <= -pitch_threshold:
        return "Looking Up"

    elif pitch_diff >= pitch_threshold:
        return "Looking Down"

    elif yaw_diff <= -yaw_threshold:
        return "Looking Left"

    elif yaw_diff >= yaw_threshold:
        return "Looking Right"

    else:
        return "Forward"


# --------------------------------------------------
# 2. HEAD DIRECTION SMOOTHING
# --------------------------------------------------

class DirectionSmoother:

    def __init__(self, window_size=5, required_count=3):

        self.history = deque(maxlen=window_size)
        self.required_count = required_count
        self.current_direction = "Forward"

    def update(self, direction):

        self.history.append(direction)

        counts = Counter(self.history)

        most_common_direction, count = counts.most_common(1)[0]

        if count >= self.required_count:
            self.current_direction = most_common_direction

        return self.current_direction

    def reset(self):

        self.history.clear()
        self.current_direction = "Forward"


# --------------------------------------------------
# 3. HEAD POSE DETECTOR CLASS
# --------------------------------------------------

class HeadPoseDetector:

    def __init__(self):

        # Load MediaPipe Face Landmarker model
        model_path = r"C:\VisionDriveModels\face_landmarker.task"

        options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(
                model_asset_path=model_path
            ),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_faces=1
        )

        self.landmarker = (
            mp.tasks.vision.FaceLandmarker.create_from_options(options)
        )

        # Timestamp tracking for VIDEO mode
        self.start_time = time.monotonic()
        self.last_timestamp_ms = -1

        # 3D face reference points
        self.model_points = np.array([

            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0)

        ], dtype=np.float64)

        # Initialize distraction components
        self.distraction_detector = DistractionDetector(
            threshold=2.0
        )

        self.direction_smoother = DirectionSmoother(
            window_size=5,
            required_count=3
        )

    # --------------------------------------------------
    # 4. PROCESS ONE FRAME
    # --------------------------------------------------

    def process_frame(self, frame):

        height, width, _ = frame.shape

        # Generate increasing timestamp
        current_time = time.monotonic()

        timestamp_ms = int(
            (current_time - self.start_time) * 1000
        )

        timestamp_ms = max(
            timestamp_ms,
            self.last_timestamp_ms + 1
        )

        self.last_timestamp_ms = timestamp_ms

        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        # Detect face landmarks
        results = self.landmarker.detect_for_video(
            mp_image,
            timestamp_ms
        )

        # Default output
        output = {
            "face_detected": False,
            "yaw": None,
            "pitch": None,
            "roll": None,
            "head_direction": "No Face Detected",
            "looking_away_duration": 0.0,
            "prolonged_looking_away": False
        }

        # --------------------------------------------------
        # 5. CHECK FACE
        # --------------------------------------------------

        if not results.face_landmarks:

            self.distraction_detector.update(None)
            self.direction_smoother.reset()

            return output

        face_landmarks = results.face_landmarks[0]

        landmark_ids = [1, 152, 33, 263, 61, 291]

        image_points = []

        for idx in landmark_ids:

            landmark = face_landmarks[idx]

            x = int(landmark.x * width)
            y = int(landmark.y * height)

            image_points.append((x, y))

        image_points = np.array(
            image_points,
            dtype=np.float64
        )

        # --------------------------------------------------
        # 6. CAMERA MATRIX
        # --------------------------------------------------

        focal_length = width

        camera_matrix = np.array([

            [focal_length, 0, width / 2],
            [0, focal_length, height / 2],
            [0, 0, 1]

        ], dtype=np.float64)

        distortion_coefficients = np.zeros((4, 1))

        # --------------------------------------------------
        # 7. ESTIMATE HEAD POSE
        # --------------------------------------------------

        success, rotation_vector, translation_vector = cv2.solvePnP(

            self.model_points,
            image_points,
            camera_matrix,
            distortion_coefficients

        )

        if not success:

            self.distraction_detector.update(None)
            self.direction_smoother.reset()

            return output

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

        angles, _, _, _, _, _ = cv2.RQDecomp3x3(
            rotation_matrix
        )

        pitch = float(angles[0])
        yaw = float(angles[1])
        roll = float(angles[2])

        # --------------------------------------------------
        # 8. CLASSIFY HEAD DIRECTION
        # --------------------------------------------------

        raw_direction = get_head_direction(
            yaw,
            pitch
        )

        direction = self.direction_smoother.update(
            raw_direction
        )

        # --------------------------------------------------
        # 9. CHECK PROLONGED DISTRACTION
        # --------------------------------------------------

        distraction_result = self.distraction_detector.update(
            direction
        )

        # --------------------------------------------------
        # 10. RETURN RESULTS
        # --------------------------------------------------

        output = {
            "face_detected": True,
            "yaw": round(yaw, 2),
            "pitch": round(pitch, 2),
            "roll": round(roll, 2),
            "head_direction": direction,
            "looking_away_duration": distraction_result["duration"],
            "prolonged_looking_away": distraction_result[
                "prolonged_looking_away"
            ]
        }

        return output

    # --------------------------------------------------
    # 11. RELEASE MEDIAPIPE RESOURCES
    # --------------------------------------------------

    def close(self):

        self.landmarker.close()
