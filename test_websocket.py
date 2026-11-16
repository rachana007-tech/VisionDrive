
import cv2
import json
import asyncio
import websockets


async def test_visiondrive():

    uri = "ws://127.0.0.1:8000/ws/monitor"

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Could not open webcam!")
        return

    try:
        async with websockets.connect(uri) as websocket:

            print("Connected to VisionDrive!")

            message = await websocket.recv()
            print(message)

            while True:

                ret, frame = cap.read()

                if not ret:
                    break

                # Encode webcam frame as JPEG
                success, buffer = cv2.imencode(".jpg", frame)

                if not success:
                    continue

                # Send frame to FastAPI
                await websocket.send(buffer.tobytes())

                # Receive AI detection results
                response = await websocket.recv()
                data = json.loads(response)

                print("\nOverall Risk:", data["risk"])

                # Display generated alerts
                # Display newly triggered alerts only
                if data.get("alerts"):
                    print("\n🚨 NEW ALERTS:")
                    for alert in data["alerts"]:
                        print(alert["type"], "-", alert["message"])

                else:
                    print("\nNo new alerts.")

# Display currently active alert conditions
                print("Active alerts:", [
                    alert["type"]
                    for alert in data.get("active_alerts", [])
                ])

                cv2.imshow("VisionDrive WebSocket Test", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

    except Exception as error:
        print("Error:", error)

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("WebSocket test stopped.")


if __name__ == "__main__":
    asyncio.run(test_visiondrive())
