class RiskService:
    @staticmethod
    def analyze_outbreak_risk(temp: float, humidity: float) -> dict:
        """
        Predicts pest/disease outbreak risk based on environmental data.
        Thresholds inspired by AgriTech (omroy07).
        """
        # Thermodynamic thresholds
        is_high_temp = temp > 28.0
        is_high_humidity = humidity > 75.0

        if is_high_temp and is_high_humidity:
            risk_level = "HIGH"
            message = "High Outbreak Risk: Warm and humid conditions are ideal for fungal growth and pest rapid reproduction."
        elif is_high_temp or is_high_humidity:
            risk_level = "MEDIUM"
            message = "Elevated Risk: Monitor crops closely as conditions are becoming favorable for pests."
        else:
            risk_level = "LOW"
            message = "Normal Conditions: Outbreak risk is currently low."

        return {
            "risk_level": risk_level,
            "message": message,
            "thresholds_exceeded": {
                "temperature": is_high_temp,
                "humidity": is_high_humidity
            }
        }

risk_service = RiskService()
