import math
from fastapi import HTTPException

class FarmService:
    @staticmethod
    def validate_geojson_polygon(polygon: dict):
        if polygon.get("type") != "Polygon":
            raise HTTPException(status_code=400, detail="GeoJSON must be of type 'Polygon'")
        
        coords = polygon.get("coordinates")
        if not coords or not isinstance(coords, list) or len(coords) == 0:
            raise HTTPException(status_code=400, detail="Invalid coordinates structure")
        
        ring = coords[0]
        if len(ring) < 4:
            raise HTTPException(status_code=400, detail="Polygon must have at least 4 points (3 distinct + 1 closing)")
        
        first_point = ring[0]
        last_point = ring[-1]
        
        if first_point[0] != last_point[0] or first_point[1] != last_point[1]:
            raise HTTPException(status_code=400, detail="Polygon ring must be closed (first and last points must match)")
            
        return ring

    @staticmethod
    def calculate_area_hectares(ring: list) -> float:
        # Approximate area on spherical earth using a basic conversion 
        # (Shoelace formula on planar projection or spherical excess)
        # Using a simplified planar approximation for small agricultural fields:
        # 1 deg lat ~ 111.32 km. 1 deg lon ~ 111.32 * cos(lat) km.
        
        if not ring or len(ring) < 4:
            return 0.0
            
        # Calculate centroid latitude for projection
        lats = [pt[1] for pt in ring]
        avg_lat = sum(lats) / len(lats)
        
        # Earth radius in meters
        R = 6378137.0
        
        # Convert degrees to radians and then to local flat meters
        meters_pts = []
        for lon, lat in ring:
            x = math.radians(lon) * R * math.cos(math.radians(avg_lat))
            y = math.radians(lat) * R
            meters_pts.append((x, y))
            
        # Shoelace formula for area in square meters
        area_sq_m = 0.0
        n = len(meters_pts)
        for i in range(n - 1):
            x1, y1 = meters_pts[i]
            x2, y2 = meters_pts[i+1]
            area_sq_m += (x1 * y2 - x2 * y1)
            
        area_sq_m = abs(area_sq_m) / 2.0
        
        # Convert to hectares (1 hectare = 10,000 sq meters)
        return round(area_sq_m / 10000.0, 4)
