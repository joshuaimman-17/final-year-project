import random
from typing import Dict, Any, List

class InsightService:
    @staticmethod
    def calculate_scores(weather_data: Dict[str, Any], soil_data: Dict[str, Any], ndvi_data: Dict[str, Any]) -> Dict[str, Any]:
        # Extract variables
        ndvi = ndvi_data.get("ndvi_score", 0.6) # Default to decent NDVI
        soil_moisture = ndvi_data.get("soil_moisture_index", 0.4)
        temp = weather_data.get("temperature_c", 25)
        humidity = weather_data.get("humidity", 60)
        
        # Temperature Suitability (Ideal 22-28°C for most crops)
        temp_suitability = 1.0 - (abs(temp - 25) / 15)
        temp_suitability = max(0, min(1, temp_suitability))
        
        # Humidity Suitability (Ideal 50-70%)
        hum_suitability = 1.0 - (abs(humidity - 60) / 40)
        hum_suitability = max(0, min(1, hum_suitability))
        
        # Crop Health Score = (NDVI * 50) + (SoilMoisture * 20) + (TempSuit * 15) + (HumSuit * 15)
        crop_health_score = (ndvi * 50) + (soil_moisture * 20) + (temp_suitability * 15) + (hum_suitability * 15)
        
        # NDVI Interpretation
        ndvi_status = "HEALTHY"
        if ndvi < 0.3:
            ndvi_status = "CRITICAL"
        elif ndvi < 0.5:
            ndvi_status = "WEAK"

        # Soil Fertility Score (Simplified)
        nitrogen = soil_data.get("nitrogen", 50)
        phosphorus = soil_data.get("phosphorus", 50)
        potassium = soil_data.get("potassium", 50)
        soil_fertility = (nitrogen + phosphorus + potassium) / 3.0
        
        # Irrigation Need Level
        irrigation_need = (1.0 - soil_moisture) * 100
        # If real rainfall > 3mm, significantly reduce irrigation need
        if weather_data.get("precipitation_mm", 0) > 3:
            irrigation_need -= 40
        irrigation_need = max(0, min(100, irrigation_need))
        
        # Pest Risk Level
        pest_risk = (humidity / 100.0) * 60 + (temp / 40.0) * 40
        pest_risk = max(0, min(100, pest_risk))
        
        # Spraying Safety (Wind constraint)
        spraying_safe = weather_data.get("wind_speed_kmh", 0) <= 15.0
        
        return {
            "crop_health": {
                "score": round(crop_health_score, 1),
                "status": ndvi_status,
                "ndvi": round(ndvi, 2)
            },
            "soil_fertility": {
                "score": round(soil_fertility, 1),
                "status": "HEALTHY" if soil_fertility > 60 else "DEPLETED"
            },
            "irrigation_need": {
                "score": round(irrigation_need, 1),
                "status": "HIGH" if irrigation_need > 70 else "LOW"
            },
            "pest_risk": {
                "score": round(pest_risk, 1),
                "status": "HIGH" if pest_risk > 70 else "LOW"
            },
            "spraying_safe": spraying_safe
        }

    @staticmethod
    def generate_recommendations(scores: Dict[str, Any], weather_data: Dict[str, Any]) -> List[str]:
        recommendations = []
        
        if scores["irrigation_need"]["status"] == "HIGH":
            recommendations.append("Irrigate in the next 24 hours to maintain crop health.")
        
        if not scores["spraying_safe"]:
            recommendations.append(f"Avoid spraying — high wind speed ({weather_data.get('wind_speed_kmh', 0):.1f} km/h) detected.")
        elif weather_data.get("precipitation_probability", 0) > 60:
            recommendations.append("Avoid spraying pesticides — high probability of rain expected.")
        
        if scores["soil_fertility"]["status"] == "DEPLETED":
            recommendations.append("Add nitrogen-rich fertilizer to improve soil fertility.")
            
        if scores["crop_health"]["status"] == "CRITICAL":
            recommendations.append("CRITICAL: Severe crop stress detected. Inspect field immediately.")
        elif scores["crop_health"]["status"] == "WEAK":
            recommendations.append("Crop health is declining. Check for nutrient deficiencies.")
            
        if not recommendations:
            recommendations.append("All conditions are optimal. Continue regular monitoring.")
            
        return recommendations
