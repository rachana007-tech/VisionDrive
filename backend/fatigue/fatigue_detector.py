
import time
from pathlib import Path

import cv2
import mediapipe as mp

from .blink_detection import BlinkDetector
from .ear_calculation import calculate_ear
from .perclos import PerclosCalculator
from .yawn_detection import YawnDetector, calculate_mar
from .fatigue_classification import FatigueClassifier

from .eye_detection import (
    EYE_A,
    EYE_B,
    get_eye_coordinates,
)


class FatigueDetector:

    def __init__(self):
        # Configure MediaPipe Face Landmarker
        options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(
                model_asset_path=r"C:\VisionDriveModels\face_landmarker.task"
            ),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_faces=1
        )

        self.landmarker = (
            mp.tasks.vision.FaceLandmarker.create_from_options(
                options
            )
        )

        # Initialize existing fatigue detection components
        self.blink_detector = BlinkDetector()
        self.perclos_calculator = PerclosCalculator(
            window_seconds=60
        )
        self.yawn_detector = YawnDetector()
        self.fatigue_classifier = FatigueClassifier()

        self.start_time = time.monotonic()
        self.last_timestamp_ms = -1

    def process_frame(self, frame):
        """
        Process one BGR webcam frame.
        Does not open or control the webcam.
        """

        current_timestamp = time.monotonic()

        # MediaPipe VIDEO timestamps must increase
        timestamp_ms = int(
            (current_timestamp - self.start_time) * 1000
        )
        timestamp_ms = max(
            timestamp_ms,
            self.last_timestamp_ms + 1
        )
        self.last_timestamp_ms = timestamp_ms

        height, width, _ = frame.shape

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
        result = self.landmarker.detect_for_video(
            mp_image,
            timestamp_ms
        )

        # Handle missing face
        if not result.face_landmarks:

            perclos_info = self.perclos_calculator.update(
                None,
                current_timestamp
            )

            yawn_info = self.yawn_detector.update(
                None,
                current_timestamp
            )

            fatigue_info = self.fatigue_classifier.update(
                perclos=perclos_info["perclos"],
                prolonged_closure=False,
                yawn_detected=False,
                timestamp=current_timestamp
            )

            return {
                "face_detected": False,
                "fatigue_level": fatigue_info["fatigue_level"],
                "perclos": perclos_info["perclos"],
                "fatigue_info": fatigue_info
            }

        landmarks = result.face_landmarks[0]

        # Extract eye coordinates
        eye_a = get_eye_coordinates(
            landmarks, EYE_A, width, height
        )

        eye_b = get_eye_coordinates(
            landmarks, EYE_B, width, height
        )

        # Calculate EAR
        ear_a = calculate_ear(eye_a)
        ear_b = calculate_ear(eye_b)

        average_ear = (ear_a + ear_b) / 2

        # Blink detection
        blink_info = self.blink_detector.update(
            average_ear,
            current_timestamp
        )

        # PERCLOS calculation
        perclos_info = self.perclos_calculator.update(
            blink_info["eye_closed"],
            current_timestamp
        )

        # Yawn detection
        mar = calculate_mar(
            landmarks,
            width,
            height
        )

        yawn_info = self.yawn_detector.update(
            mar,
            current_timestamp
        )

        # Fatigue classification
        fatigue_info = self.fatigue_classifier.update(
            perclos=perclos_info["perclos"],
            prolonged_closure=blink_info["prolonged_closure"],
            yawn_detected=yawn_info["yawn_detected"],
            timestamp=current_timestamp
        )

        # Return structured results to the backend
        return {
            "face_detected": True,
            "ear_a": ear_a,
            "ear_b": ear_b,
            "average_ear": average_ear,
            "blink_count": blink_info["blink_count"],
            "eye_closed": blink_info["eye_closed"],
            "prolonged_closure": blink_info["prolonged_closure"],
            "perclos": perclos_info["perclos"],
            "mar": mar,
            "yawn_count": yawn_info["yawn_count"],
            "yawn_detected": yawn_info["yawn_detected"],
            "mouth_open": yawn_info["mouth_open"],
            "fatigue_level": fatigue_info["fatigue_level"],
            "fatigue_info": fatigue_info
        }

    def close(self):
        """Release MediaPipe resources."""
        self.landmarker.close()
