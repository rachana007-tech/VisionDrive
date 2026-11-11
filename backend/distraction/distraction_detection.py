import time


class DistractionDetector:

    def __init__(self, threshold=2.0):

        # Maximum permitted looking-away duration
        self.threshold = threshold

        # Stores the starting time
        self.looking_away_start = None

    def update(self, direction):

        # Handle missing face
        if direction is None or direction == "No Face Detected":

            self.looking_away_start = None

            return {
                "direction": "No Face Detected",
                "duration": 0.0,
                "prolonged_looking_away": False
            }

        # Reset timer when driver looks forward
        if direction == "Forward":

            self.looking_away_start = None

            return {
                "direction": direction,
                "duration": 0.0,
                "prolonged_looking_away": False
            }

        # Start timer when driver looks away
        if self.looking_away_start is None:

            self.looking_away_start = time.monotonic()

        # Calculate elapsed time
        duration = time.monotonic() - self.looking_away_start

        # Check prolonged looking away
        prolonged = duration >= self.threshold

        return {
            "direction": direction,
            "duration": round(duration, 2),
            "prolonged_looking_away": prolonged
        }