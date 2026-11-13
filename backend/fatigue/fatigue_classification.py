
import time
from collections import deque


class FatigueClassifier:

    def __init__(
        self,
        moderate_perclos=15.0,
        high_perclos=25.0,
        moderate_yawns=2,
        high_yawns=3,
        yawn_window_seconds=300
    ):
        self.moderate_perclos = moderate_perclos
        self.high_perclos = high_perclos

        self.moderate_yawns = moderate_yawns
        self.high_yawns = high_yawns

        self.yawn_window_seconds = yawn_window_seconds
        self.yawn_timestamps = deque()

    def update(
        self,
        perclos,
        prolonged_closure,
        yawn_detected,
        timestamp=None
    ):

        if timestamp is None:
            timestamp = time.monotonic()

        # Record a newly detected yawn
        if yawn_detected:
            self.yawn_timestamps.append(timestamp)

        # Remove yawns outside the five-minute window
        window_start = timestamp - self.yawn_window_seconds

        while (
            self.yawn_timestamps
            and self.yawn_timestamps[0] < window_start
        ):
            self.yawn_timestamps.popleft()

        recent_yawns = len(self.yawn_timestamps)

        # Validate PERCLOS input
        if not 0 <= perclos <= 100:
            raise ValueError("PERCLOS must be between 0 and 100")

        reasons = []

        # HIGH fatigue
        if prolonged_closure:
            reasons.append("Prolonged eye closure")

        if perclos >= self.high_perclos:
            reasons.append("High PERCLOS")

        if recent_yawns >= self.high_yawns:
            reasons.append("Frequent yawning")

        if reasons:
            level = "HIGH"

        # MODERATE fatigue
        elif (
            perclos >= self.moderate_perclos
            or recent_yawns >= self.moderate_yawns
        ):
            level = "MODERATE"

            if perclos >= self.moderate_perclos:
                reasons.append("Elevated PERCLOS")

            if recent_yawns >= self.moderate_yawns:
                reasons.append("Repeated yawning")

        # LOW fatigue
        else:
            level = "LOW"
            reasons.append("No significant indicators")

        return {
            "fatigue_level": level,
            "recent_yawns": recent_yawns,
            "reasons": reasons
        }
