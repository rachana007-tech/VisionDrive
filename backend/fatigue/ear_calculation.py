
import math


def calculate_ear(eye_points):
    """
    Calculate Eye Aspect Ratio (EAR).

    eye_points must contain 6 points in this order:
    P1, P2, P3, P4, P5, P6
    """

    if len(eye_points) != 6:
        raise ValueError("Exactly 6 eye landmarks are required")

    # Extract the six landmark points
    p1, p2, p3, p4, p5, p6 = eye_points

    # Calculate vertical distances
    vertical_1 = math.dist(p2, p6)
    vertical_2 = math.dist(p3, p5)

    # Calculate horizontal distance
    horizontal = math.dist(p1, p4)

    if horizontal == 0:
        raise ValueError("Horizontal eye distance cannot be zero")

    # Calculate EAR
    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)

    return ear
