import time
from collections import deque


class PerclosCalculator:
    def __init__(self, window_seconds=60):
        self.window_seconds = window_seconds
        self.intervals = deque()
        self.last_timestamp = None
        self.last_eye_closed = None

    def update(self, eye_closed, timestamp=None):
        if timestamp is None:
            timestamp = time.monotonic()

        if (
            self.last_timestamp is not None
            and timestamp < self.last_timestamp
        ):
            raise ValueError("Timestamp must be increasing")

        # Count the interval only if the previous observation was valid.
        if self.last_timestamp is not None and self.last_eye_closed is not None:
            self.intervals.append(
                (self.last_timestamp, timestamp, self.last_eye_closed)
            )

        self.last_timestamp = timestamp
        self.last_eye_closed = (
            None if eye_closed is None else bool(eye_closed)
        )

        # Keep only intervals inside the rolling time window.
        window_start = timestamp - self.window_seconds

        while self.intervals and self.intervals[0][1] <= window_start:
            self.intervals.popleft()

        if self.intervals and self.intervals[0][0] < window_start:
            start, end, closed = self.intervals[0]
            self.intervals[0] = (window_start, end, closed)

        # Calculate only from valid face-observation time.
        closed_duration = sum(
            end - start
            for start, end, closed in self.intervals
            if closed
        )

        valid_duration = sum(
            end - start
            for start, end, closed in self.intervals
        )

        perclos = (
            (closed_duration / valid_duration) * 100
            if valid_duration > 0
            else 0.0
        )

        return {
            "perclos": perclos,
            "closed_duration": closed_duration,
            "observation_duration": valid_duration
        }