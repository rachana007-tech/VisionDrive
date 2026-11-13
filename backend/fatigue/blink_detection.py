
import time


class BlinkDetector:

    def __init__(
        self,
        close_threshold=0.20,
        open_threshold=0.23,
        min_blink_duration=0.08,
        max_blink_duration=0.80
    ):

        self.close_threshold = close_threshold
        self.open_threshold = open_threshold

        self.min_blink_duration = min_blink_duration
        self.max_blink_duration = max_blink_duration

        self.eye_closed = False
        self.closed_start_time = None

        self.blink_count = 0

    def update(self, ear, timestamp=None):

        if timestamp is None:
            timestamp = time.monotonic()

        blink_detected = False
        prolonged_closure = False
        blink_duration = 0.0

        # Check whether eyes are open
        if not self.eye_closed:

            if ear < self.close_threshold:
                self.eye_closed = True
                self.closed_start_time = timestamp

        # Check whether eyes are closed
        else:

            blink_duration = (
                timestamp - self.closed_start_time
            )

            # Detect reopening
            if ear > self.open_threshold:

                self.eye_closed = False

                if (
                    self.min_blink_duration
                    <= blink_duration
                    <= self.max_blink_duration
                ):

                    self.blink_count += 1
                    blink_detected = True

                self.closed_start_time = None

            # Detect prolonged closure
            elif blink_duration > self.max_blink_duration:

                prolonged_closure = True

        return {
            "blink_detected": blink_detected,
            "blink_count": self.blink_count,
            "eye_closed": self.eye_closed,
            "blink_duration": blink_duration,
            "prolonged_closure": prolonged_closure
        }
