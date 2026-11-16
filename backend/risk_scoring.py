
class RiskScorer:

    def __init__(self):
        self.fatigue_weights = {
            "LOW": 0,
            "MODERATE": 50,
            "HIGH": 100
        }

    # -----------------------------------
    # 1. CALCULATE FATIGUE SCORE
    # -----------------------------------

    def calculate_fatigue_score(self, fatigue_output):

        if not fatigue_output.get("face_detected", False):
            return None

        fatigue_level = fatigue_output.get(
            "fatigue_level", "LOW"
        )

        return self.fatigue_weights.get(fatigue_level, 0)

    # -----------------------------------
    # 2. CALCULATE DISTRACTION SCORE
    # -----------------------------------

    def calculate_distraction_score(self, head_output, phone_output):

        score = 0

        if head_output.get("face_detected", False):

            duration = head_output.get(
                "looking_away_duration", 0
            )

            if duration >= 2:
                score = max(score, 60)

            if duration >= 4:
                score = max(score, 80)

            if head_output.get("prolonged_looking_away", False):
                score = max(score, 80)

        # Phone detection
        if phone_output.get("phone_detected", False):
            score = max(score, 100)

        return score

    # -----------------------------------
    # 3. CALCULATE OVERALL RISK
    # -----------------------------------

    def calculate_overall_risk(self, fatigue_score, distraction_score):

        if fatigue_score is None and distraction_score == 0:
            return {
                "overall_risk_score": None,
                "overall_risk_level": "NOT_ASSESSED"
            }

        available_scores = []

        if fatigue_score is not None:
            available_scores.append(fatigue_score)

        available_scores.append(distraction_score)

        overall_score = max(available_scores)

        if overall_score >= 80:
            risk_level = "HIGH"

        elif overall_score >= 40:
            risk_level = "MODERATE"

        else:
            risk_level = "LOW"

        return {
            "overall_risk_score": overall_score,
            "overall_risk_level": risk_level
        }

    # -----------------------------------
    # 4. PROCESS ALL DETECTION RESULTS
    # -----------------------------------

    def process(self, fatigue_output, head_output, phone_output):

        fatigue_score = self.calculate_fatigue_score(
            fatigue_output
        )

        distraction_score = self.calculate_distraction_score(
            head_output,
            phone_output
        )

        overall = self.calculate_overall_risk(
            fatigue_score,
            distraction_score
        )

        return {
            "fatigue_score": fatigue_score,
            "distraction_score": distraction_score,
            **overall
        }
