import os
import httpx
import datetime
from typing import List, Dict, Any
from collections import defaultdict
import time

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    MOCK_MODE = os.getenv("MOCK_EXTERNAL_SERVICES", "false").lower() == "true"
    
    # Simple in-memory cache
    _cache = {}

    @staticmethod
    async def get_current_weather(lat: float, lon: float) -> Dict[str, Any]:
        """Fetches real-time current weather using Open-Meteo."""
        if WeatherService.MOCK_MODE:
            return WeatherService._get_simulated_current_weather(lat, lon)

        cache_key = f"current_{lat}_{lon}"
        if cache_key in WeatherService._cache:
            data, timestamp = WeatherService._cache[cache_key]
            if time.time() - timestamp < 600: # 10 minutes
                return data

        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": "true",
            "hourly": "relative_humidity_2m,precipitation_probability",
            "timezone": "auto"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(WeatherService.BASE_URL, params=params, timeout=5.0)
                if res.status_code != 200:
                    print(f"Open-Meteo Error ({res.status_code}), falling back to simulation")
                    return WeatherService._get_simulated_current_weather(lat, lon)
                
                data = res.json()
                current = data["current_weather"]
                # Get current hour index for humidity/pop
                now_hour = datetime.datetime.now().hour
                humidity = data.get("hourly", {}).get("relative_humidity_2m", [0]*24)[now_hour]
                pop = data.get("hourly", {}).get("precipitation_probability", [0]*24)[now_hour]

                result = {
                    "temperature_c": current["temperature"],
                    "humidity": humidity,
                    "precipitation_mm": 0, # Current rain usually not in summary
                    "wind_speed_kmh": current["windspeed"],
                    "condition": "Clear" if current["weathercode"] < 3 else "Cloudy", # Simplified
                    "precipitation_probability": pop,
                    "irrigation_hint": "RECOMMENDED" if pop < 20 and current["temperature"] > 30 else "NO",
                    "heat_stress": current["temperature"] > 35,
                    "fungal_risk": humidity > 80,
                    "source": "Open-Meteo"
                }
                
                WeatherService._cache[cache_key] = (result, time.time())
                return result
        except Exception as e:
            print(f"Open-Meteo request failed ({e}), falling back to simulation")
            return WeatherService._get_simulated_current_weather(lat, lon)

    @staticmethod
    async def get_7_day_forecast(lat: float, lon: float) -> List[Dict[str, Any]]:
        """
        Fetches 7-day forecast from Open-Meteo.
        """
        if WeatherService.MOCK_MODE:
            return WeatherService._get_simulated_forecast(lat, lon)

        cache_key = f"forecast_{lat}_{lon}"
        if cache_key in WeatherService._cache:
            data, timestamp = WeatherService._cache[cache_key]
            if time.time() - timestamp < 1800: # 30 minutes
                return data

        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_max",
            "timezone": "auto"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(WeatherService.BASE_URL, params=params, timeout=5.0)
                if res.status_code != 200:
                    print(f"Open-Meteo Forecast Error ({res.status_code}), falling back to simulation")
                    return WeatherService._get_simulated_forecast(lat, lon)
                
                data = res.json()["daily"]
                
            daily_forecasts = []
            for i in range(len(data["time"])):
                max_temp = data["temperature_2m_max"][i]
                max_hum = data["relative_humidity_2m_max"][i]
                total_rain = data["precipitation_sum"][i]
                max_wind = data["windspeed_10m_max"][i]
                max_pop = data["precipitation_probability_max"][i]

                spraying_safe = (max_wind <= 12.0 and max_pop <= 50.0 and max_hum < 85.0)
                
                alert_reason = None
                if max_wind > 12.0: alert_reason = "High Wind"
                elif max_pop > 50.0: alert_reason = "Rain Likely"
                elif max_hum > 85.0: alert_reason = "High Humidity"

                daily_forecasts.append({
                    "date": data["time"][i],
                    "temperature_c": max_temp,
                    "humidity": max_hum,
                    "precipitation_mm": total_rain,
                    "wind_speed_kmh": max_wind,
                    "precipitation_probability": max_pop,
                    "spraying_safe": spraying_safe,
                    "alert": alert_reason,
                    "irrigation_hint": "RECOMMENDED" if total_rain < 2 and max_temp > 30 else "NO",
                    "heat_stress": max_temp > 35,
                    "fungal_risk": max_hum > 80,
                    "source": "Open-Meteo"
                })
                
            result = daily_forecasts
            WeatherService._cache[cache_key] = (result, time.time())
            return result
        except Exception as e:
            print(f"Open-Meteo Forecast failed ({e}), falling back to simulation")
            return WeatherService._get_simulated_forecast(lat, lon)

    @staticmethod
    def _get_simulated_current_weather(lat: float, lon: float) -> Dict[str, Any]:
        return {
            "temperature_c": 28.5,
            "humidity": 65,
            "precipitation_mm": 0,
            "wind_speed_kmh": 8.5,
            "condition": "Sunny",
            "precipitation_probability": 10,
            "irrigation_hint": "RECOMMENDED",
            "heat_stress": False,
            "fungal_risk": False,
            "source": "Simulation"
        }

    @staticmethod
    def _get_simulated_forecast(lat: float, lon: float) -> List[Dict[str, Any]]:
        today = datetime.datetime.now()
        forecast = []
        for i in range(7):
            day = today + datetime.timedelta(days=i)
            forecast.append({
                "date": day.strftime("%Y-%m-%d"),
                "temperature_c": 27.0 + i,
                "humidity": 60 + i,
                "precipitation_mm": 0,
                "wind_speed_kmh": 10.0,
                "precipitation_probability": 20,
                "spraying_safe": True,
                "alert": None,
                "irrigation_hint": "NO",
                "heat_stress": False,
                "fungal_risk": False,
                "source": "Simulation"
            })
        return forecast
