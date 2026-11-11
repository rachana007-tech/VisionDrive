
import cv2
from ultralytics import YOLO


# --------------------------------------------------
# 1. PHONE DETECTOR CLASS
# --------------------------------------------------

class PhoneDetector:

    def __init__(self, confidence_threshold=0.25):

        # Load YOLO model only once
        self.model = YOLO("yolo11n.pt")

        self.confidence_threshold = confidence_threshold

        # COCO class ID for mobile phone
        self.phone_class_id = 67

    # --------------------------------------------------
    # 2. PROCESS ONE FRAME
    # --------------------------------------------------

    def process_frame(self, frame):

        # Detect mobile phones
        results = self.model(
            frame,
            conf=self.confidence_threshold,
            classes=[self.phone_class_id],
            verbose=False
        )

        phone_detected = False
        phone_confidence = 0.0
        detection_count = 0

        # Examine detected phones
        for box in results[0].boxes:

            phone_detected = True
            detection_count += 1

            confidence = float(box.conf[0])

            phone_confidence = max(
                phone_confidence,
                confidence
            )

            # Get bounding box coordinates
            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            # Draw bounding box
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 0, 255),
                2
            )

            cv2.putText(
                frame,
                f"Phone: {confidence * 100:.1f}%",
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2
            )

        # Return backend-friendly results
        output = {
            "phone_detected": phone_detected,
            "phone_confidence": round(phone_confidence, 2),
            "phone_detection_count": detection_count
        }

        return output

    # --------------------------------------------------
    # 3. STANDALONE TESTING
    # --------------------------------------------------

if __name__ == "__main__":

    detector = PhoneDetector()

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():

        print("Camera could not be opened!")
        exit()

    print("Phone Detection Started!")

    try:

        while True:

            ret, frame = cap.read()

            if not ret:
                break

            # Process frame
            output = detector.process_frame(frame)

            # Display detection status
            if output["phone_detected"]:

                cv2.putText(
                    frame,
                    "MOBILE PHONE DETECTED!",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )

            else:

                cv2.putText(
                    frame,
                    "No Phone Detected",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2
                )

            cv2.imshow(
                "VisionDrive - Phone Detection",
                frame
            )

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:

        cap.release()
        cv2.destroyAllWindows()

        print("Phone Detection Stopped!")
