import httpx
import os
import datetime
import uuid
from typing import Dict, Any

class NDVIService:
    API_KEY = os.getenv("AGROMONITORING_API_KEY")
    BASE_URL = "https://api.agromonitoring.com/agro/1.0"

    @staticmethod
    async def create_polygon(name: str, geojson_polygon: Dict[str, Any]) -> str:
        """
        Creates a polygon on Agromonitoring and returns the polyid.
        """
        if not NDVIService.API_KEY:
            return f"mock_{uuid.uuid4().hex[:8]}"

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{NDVIService.BASE_URL}/polygons?appid={NDVIService.API_KEY}",
                    json={
                        "name": name,
                        "geo_json": geojson_polygon
                    }
                )
                if res.status_code in [200, 201]:
                    return res.json()["id"]
                else:
                    print(f"Agromonitoring Polygon Creation Failed: {res.text}")
                    return f"err_{uuid.uuid4().hex[:8]}"
        except Exception as e:
            print(f"Agromonitoring Connection Error: {e}")
            return f"err_{uuid.uuid4().hex[:8]}"

    @staticmethod
    async def get_ndvi(polyid: str) -> Dict[str, Any]:
        """
        Fetches the latest NDVI for a given Agromonitoring polyid.
        """
        if not NDVIService.API_KEY or "mock" in polyid or "err" in polyid:
            return NDVIService._get_simulated_ndvi(0, 0)

        try:
            # 1. Search for latest satellite images
            # Sentinel-2 images for the last 30 days
            end = int(datetime.datetime.now().timestamp())
            start = end - (30 * 24 * 3600)
            
            async with httpx.AsyncClient() as client:
                search_url = f"{NDVIService.BASE_URL}/image/search?polyid={polyid}&start={start}&end={end}&appid={NDVIService.API_KEY}"
                res = await client.get(search_url)
                
                if res.status_code != 200:
                    return NDVIService._get_simulated_ndvi(0, 0)
                
                images = res.json()
                if not images:
                    return NDVIService._get_simulated_ndvi(0, 0)
                
                # Get latest image with NDVI stats
                latest = images[0]
                stats = latest.get("stats", {})
                ndvi_score = stats.get("ndvi", 0.65)
                
                return {
                    "ndvi_score": round(ndvi_score, 2),
                    "captured_at": datetime.datetime.fromtimestamp(latest["dt"]).isoformat(),
                    "source": "Sentinel-2 (via Agromonitoring)",
                    "vegetation_cover": round(ndvi_score * 100, 1),
                    "moisture_index": 0.45 # Usually requires separate NDWI fetch
                }
        except Exception as e:
            print(f"Agromonitoring NDVI Fetch Failed ({e}), falling back")
            return NDVIService._get_simulated_ndvi(0, 0)

    @staticmethod
    def _get_simulated_ndvi(lat: float, lon: float) -> Dict[str, Any]:
        # Stable fallback for demo/offline purposes
        ndvi_score = 0.72
        return {
            "ndvi_score": round(ndvi_score, 2),
            "captured_at": (datetime.datetime.now() - datetime.timedelta(days=3)).isoformat(),
            "source": "Sentinel-2 (Simulated)",
            "vegetation_cover": round(ndvi_score * 100, 1),
            "moisture_index": 0.42
        }
