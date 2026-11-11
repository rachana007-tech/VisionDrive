
import cv2
import mediapipe as mp


# --------------------------------------------------
# 1. CALCULATE EYE POSITION
# --------------------------------------------------

def calculate_eye_position(
    landmarks, iris_index, corner1, corner2, upper, lower
):

    x1 = landmarks[corner1].x
    x2 = landmarks[corner2].x

    iris_x = landmarks[iris_index].x
    iris_y = landmarks[iris_index].y

    upper_y = landmarks[upper].y
    lower_y = landmarks[lower].y

    eye_width = abs(x2 - x1)

    if eye_width < 0.001:
        return 0.5, 0.5

    horizontal_ratio = (
        iris_x - min(x1, x2)
    ) / eye_width

    eye_top = min(upper_y, lower_y)
    eye_bottom = max(upper_y, lower_y)

    eye_height = eye_bottom - eye_top

    if eye_height < 0.001:
        return horizontal_ratio, 0.5

    vertical_ratio = (
        iris_y - eye_top
    ) / eye_height

    return horizontal_ratio, vertical_ratio


# --------------------------------------------------
# 2. CLASSIFY GAZE DIRECTION
# --------------------------------------------------

def get_gaze_direction(face_landmarks):

    landmarks = face_landmarks.landmark

    left_horizontal, left_vertical = calculate_eye_position(
        landmarks, 468, 33, 133, 159, 145
    )

    right_horizontal, right_vertical = calculate_eye_position(
        landmarks, 473, 362, 263, 386, 374
    )

    horizontal = (
        left_horizontal + right_horizontal
    ) / 2

    vertical = (
        left_vertical + right_vertical
    ) / 2

    if horizontal < 0.40:
        direction = "Gaze Right"

    elif horizontal > 0.62:
        direction = "Gaze Left"

    elif vertical < 0.42:
        direction = "Gaze Up"

    elif vertical > 0.52:
        direction = "Gaze Down"

    else:
        direction = "Gaze Center"

    return direction, horizontal, vertical


# --------------------------------------------------
# 3. GAZE DETECTOR CLASS
# --------------------------------------------------

class GazeDetector:

    def __init__(self):

        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    # --------------------------------------------------
    # 4. PROCESS ONE FRAME
    # --------------------------------------------------

    def process_frame(self, frame):

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:

            return {
                "gaze_detected": False,
                "gaze_direction": "No Face Detected",
                "horizontal_ratio": None,
                "vertical_ratio": None
            }

        face_landmarks = results.multi_face_landmarks[0]

        direction, horizontal, vertical = (
            get_gaze_direction(face_landmarks)
        )

        return {
            "gaze_detected": True,
            "gaze_direction": direction,
            "horizontal_ratio": round(horizontal, 3),
            "vertical_ratio": round(vertical, 3)
        }

    # --------------------------------------------------
    # 5. RELEASE RESOURCES
    # --------------------------------------------------

    def close(self):

        self.face_mesh.close()


# --------------------------------------------------
# 6. STANDALONE TESTING
# --------------------------------------------------

if __name__ == "__main__":

    detector = GazeDetector()

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():

        print("Camera could not be opened!")

        detector.close()
        exit()

    print("VisionDrive Gaze Detection Started!")
    print("Keep your head straight and move only your eyes.")
    print("Press Q to exit.")

    try:

        while True:

            ret, frame = cap.read()

            if not ret:
                break

            output = detector.process_frame(frame)

            if output["gaze_detected"]:

                cv2.putText(
                    frame,
                    f"Gaze: {output['gaze_direction']}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Horizontal: {output['horizontal_ratio']}",
                    (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Vertical: {output['vertical_ratio']}",
                    (20, 120),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 0),
                    2
                )

            else:

                cv2.putText(
                    frame,
                    "No Face Detected",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )

            cv2.imshow(
                "VisionDrive - Gaze Detection",
                frame
            )

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:

        cap.release()
        detector.close()
        cv2.destroyAllWindows()

        print("Gaze Detection Stopped!")
