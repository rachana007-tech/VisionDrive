
import cv2
from backend.fatigue.fatigue_detector import FatigueDetector

detector = None
camera = None

try:
    detector = FatigueDetector()
    print("Fatigue detector initialized successfully!")

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        raise RuntimeError("Cannot access webcam")

    print("Webcam opened successfully!")
    print("Press Q to exit.")

    while True:
        success, frame = camera.read()

        if not success:
            print("Could not read webcam frame.")
            break

        results = detector.process_frame(frame)

        print(results)

        cv2.imshow("Fatigue Detection Test", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:
    if camera is not None:
        camera.release()

    if detector is not None:
        detector.close()

    cv2.destroyAllWindows()
