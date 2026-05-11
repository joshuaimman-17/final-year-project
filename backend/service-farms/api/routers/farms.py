from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
import hashlib

from api.db.session import get_db
from api.models.farm import Farm, Field, CropCycle, SoilReport, EnvironmentalCache
from api.schemas.farm import FarmCreate, FarmRead, FieldCreate, FieldRead, CropCycleCreateDTO, CropCycleRead
from api.core.security import verify_token, check_role
from api.services.farm_service import FarmService
from api.services.insight_service import InsightService
from api.services.weather_service import WeatherService
from api.services.ndvi_service import NDVIService

router = APIRouter()

@router.post("/farms", response_model=FarmRead)
async def create_farm(
    farm_in: FarmCreate, 
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(check_role("FARMER"))
):
    owner_id = uuid.UUID(token["uid"]) if "-" in token.get("uid", "") else uuid.uuid4() # Fallback for dev if needed
    # In a real app we'd map firebase_uid to Postgres UUID. For simplicity, we assume we have a way.
    # Let's just generate a UUID or use a deterministic one based on Firebase UID for now.
    user_uuid = uuid.UUID(hashlib.md5(token["uid"].encode()).hexdigest())

    new_farm = Farm(
        owner_id=user_uuid,
        name=farm_in.name,
        village=farm_in.village,
        district=farm_in.district,
        state=farm_in.state
    )
    db.add(new_farm)
    await db.commit()
    await db.refresh(new_farm)
    # Eagerly load fields to avoid MissingGreenlet lazy load error
    result = await db.execute(
        select(Farm).options(selectinload(Farm.fields)).where(Farm.id == new_farm.id)
    )
    return result.scalars().first()

@router.post("/fields", response_model=FieldRead)
async def create_field(
    farm_id: uuid.UUID,
    field_in: FieldCreate,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(check_role("FARMER"))
):
    # Verify Farm exists
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    farm = result.scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Validate GeoJSON and calculate area
    ring = FarmService.validate_geojson_polygon(field_in.polygon)
    area_ha = FarmService.calculate_area_hectares(ring)

    # GIS Integration: Create polygon on Agromonitoring
    poly_id = await NDVIService.create_polygon(
        name=f"Field_{farm.name}_{uuid.uuid4().hex[:4]}",
        geojson_polygon=field_in.polygon
    )

    new_field = Field(
        farm_id=farm_id,
        polygon=field_in.polygon,
        area_hectares=area_ha,
        soil_type_baseline=field_in.soil_type_baseline,
        irrigation_type=field_in.irrigation_type,
        agromonitoring_id=poly_id
    )
    db.add(new_field)
    await db.commit()
    await db.refresh(new_field)
    return new_field

@router.post("/fields/{field_id}/crop-cycle", response_model=CropCycleRead)
async def create_crop_cycle(
    field_id: uuid.UUID,
    cycle_in: CropCycleCreateDTO,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(check_role("FARMER"))
):
    # Verify Field exists
    result = await db.execute(select(Field).where(Field.id == field_id))
    field = result.scalars().first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    import datetime
    expected_harvest = cycle_in.expected_harvest_date
    if not expected_harvest and cycle_in.expected_duration_days:
        expected_harvest = cycle_in.planting_date + datetime.timedelta(days=cycle_in.expected_duration_days)

    new_cycle = CropCycle(
        field_id=field_id,
        crop_name=cycle_in.crop_name,
        variety=cycle_in.variety,
        planting_date=cycle_in.planting_date,
        expected_harvest_date=expected_harvest,
        initial_quantity_seeds=cycle_in.initial_quantity_seeds
    )
    db.add(new_cycle)
    await db.commit()
    await db.refresh(new_cycle)
    return new_cycle

@router.get("/farms", response_model=List[FarmRead])
async def list_farms(
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    user_uuid = uuid.UUID(hashlib.md5(token["uid"].encode()).hexdigest())
    result = await db.execute(select(Farm).options(selectinload(Farm.fields)).where(Farm.owner_id == user_uuid))
    return result.scalars().all()

@router.get("/farms/{farm_id}/spraying-window")
async def get_spraying_window(
    farm_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    from api.services.weather_service import WeatherService
    
    # Get farm and first field to get location
    result = await db.execute(
        select(Farm).options(selectinload(Farm.fields)).where(Farm.id == farm_id)
    )
    farm = result.scalars().first()
    if not farm or not farm.fields:
        return {
            "status": "UNKNOWN",
            "reason": "No fields found for this farm to determine location",
            "next_optimal_window": None
        }
    
    # Calculate centroid from the first field's polygon
    field = farm.fields[0]
    ring = field.polygon.get("coordinates")[0]
    lons = [pt[0] for pt in ring]
    lats = [pt[1] for pt in ring]
    centroid_lon = sum(lons) / len(lons)
    centroid_lat = sum(lats) / len(lats)
    
    # Get forecast
    forecast = await WeatherService.get_7_day_forecast(centroid_lat, centroid_lon)
    
    # Find first safe window
    today_forecast = forecast[0]
    if today_forecast["spraying_safe"]:
        return {
            "status": "OPTIMAL",
            "reason": today_forecast["alert"] or "Weather conditions are safe for spraying",
            "next_optimal_window": today_forecast["date"]
        }
    
    # Look for next safe day
    for day in forecast[1:]:
        if day["spraying_safe"]:
            return {
                "status": "WARNING",
                "reason": f"Current conditions unsafe: {today_forecast['alert']}",
                "next_optimal_window": day["date"]
            }
            
    return {
        "status": "DANGER",
        "reason": "No safe spraying window found in the next 7 days",
        "next_optimal_window": None
    }

@router.get("/farms/{farm_id}/insights")
async def get_farm_insights(
    farm_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    # 1. Fetch Farm with Fields and their latest environmental data
    result = await db.execute(
        select(Farm)
        .options(
            selectinload(Farm.fields).selectinload(Field.environmental_caches),
            selectinload(Farm.fields).selectinload(Field.soil_reports),
            selectinload(Farm.fields).selectinload(Field.crop_cycles)
        )
        .where(Farm.id == farm_id)
    )
    farm = result.scalars().first()
    if not farm or not farm.fields:
        raise HTTPException(status_code=404, detail="Farm not found or has no fields")
    
    # 2. Get location for APIs
    field = farm.fields[0]
    coords = field.polygon.get("coordinates")[0]
    lat = sum(p[1] for p in coords) / len(coords)
    lon = sum(p[0] for p in coords) / len(coords)
    
    # 3. Fetch Real-Time & Near-Real-Time Data
    # Weather is Real-Time
    current_weather = await WeatherService.get_current_weather(lat, lon)
    forecast = await WeatherService.get_7_day_forecast(lat, lon)
    
    # NDVI is Near-Real-Time (Satellite)
    ndvi_data = await NDVIService.get_ndvi(field.agromonitoring_id)
    
    # Soil Data is Semi-Static (Fetch from DB or latest report)
    soil_report = field.soil_reports[-1] if field.soil_reports else None
    if soil_report:
        soil_dict = {
            "nitrogen": getattr(soil_report, "nitrogen", 45),
            "phosphorus": getattr(soil_report, "phosphorus", 32),
            "potassium": getattr(soil_report, "potassium", 50),
            "ph": getattr(soil_report, "ph_level", 6.5)
        }
    else:
        # Fallback to defaults if no report exists
        soil_dict = {"nitrogen": 45, "phosphorus": 32, "potassium": 50, "ph": 6.5}
        
    # Latest cached environmental data (if any)
    env_cache = field.environmental_caches[-1] if field.environmental_caches else None
    env_dict = {
        "ndvi_score": ndvi_data["ndvi_score"], # Use fresh satellite data
        "soil_moisture_index": getattr(env_cache, "soil_moisture_index", 0.45)
    }
        
    # 4. Compute Scores via Logic Engine
    scores = InsightService.calculate_scores(current_weather, soil_dict, env_dict)
    recommendations = InsightService.generate_recommendations(scores, current_weather)
    
    # 5. Build Comprehensive Response
    return {
        "scores": scores,
        "recommendations": recommendations,
        "weather": {
            "current": current_weather,
            "forecast": forecast
        },
        "satellite": {
            "ndvi": ndvi_data["ndvi_score"],
            "last_capture": ndvi_data["captured_at"],
            "source": ndvi_data["source"]
        },
        "soil": soil_dict,
        "crop": {
            "name": field.crop_cycles[0].crop_name if field.crop_cycles else "Unknown",
            "stage": field.crop_cycles[0].current_growth_stage if field.crop_cycles else "SEEDLING",
            "planting_date": field.crop_cycles[0].planting_date if field.crop_cycles else None
        },
        "field": {
            "id": field.id,
            "polygon": field.polygon,
            "area": field.area_hectares
        }
    }
