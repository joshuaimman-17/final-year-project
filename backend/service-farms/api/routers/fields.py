from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from api.db.session import get_db
from api.models.farm import Field, CropCycle, SoilReport, EnvironmentalCache
from api.schemas.farm import FieldDetailedDTO, CropCycleRead, EnvironmentalCacheRead
from api.core.security import verify_token
from api.services.weather_service import WeatherService

router = APIRouter()

@router.get("/fields/{field_id}/summary", response_model=FieldDetailedDTO)
async def get_field_summary(
    field_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    # Fetch Field with eager loading
    result = await db.execute(
        select(Field)
        .options(
            selectinload(Field.crop_cycles),
            selectinload(Field.environmental_caches)
        )
        .where(Field.id == field_id)
    )
    field = result.scalars().first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # Find active crop cycle
    active_crop = next((c for c in field.crop_cycles if c.status == "ACTIVE"), None)
    if not active_crop and len(field.crop_cycles) > 0:
        active_crop = sorted(field.crop_cycles, key=lambda c: c.planting_date, reverse=True)[0]

    # Find latest health cache
    latest_health = None
    if field.environmental_caches:
        latest_health = sorted(field.environmental_caches, key=lambda h: h.captured_at, reverse=True)[0]

    # Fetch weather
    # Extract lat/lon from polygon centroid for weather
    try:
        ring = field.polygon["coordinates"][0]
        lats = [pt[1] for pt in ring]
        lons = [pt[0] for pt in ring]
        avg_lat = sum(lats)/len(lats)
        avg_lon = sum(lons)/len(lons)
    except:
        avg_lat, avg_lon = 0.0, 0.0
        
    weather = await WeatherService.get_7_day_forecast(avg_lat, avg_lon)

    return {
        "metadata": field,
        "active_crop": active_crop,
        "latest_health": latest_health,
        "weather_forecast": weather
    }

@router.get("/fields/{field_id}/weather")
async def get_field_weather(
    field_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    result = await db.execute(select(Field).where(Field.id == field_id))
    field = result.scalars().first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    # Mocking location from DB
    return await WeatherService.get_7_day_forecast(15.0, 75.0)

@router.get("/fields/{field_id}/soil-history")
async def get_soil_history(
    field_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    result = await db.execute(select(SoilReport).where(SoilReport.field_id == field_id).order_by(SoilReport.recorded_at.desc()))
    return result.scalars().all()

@router.get("/fields/{field_id}/satellite-gallery")
async def get_satellite_gallery(
    field_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    # Mocking Agromonitoring historical imagery
    return [
        {"date": "2026-04-01", "image_url": "https://agromonitoring.com/image1.png", "type": "NDVI"},
        {"date": "2026-04-15", "image_url": "https://agromonitoring.com/image2.png", "type": "NDVI"}
    ]
