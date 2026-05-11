from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from api.models.farm import SoilType, IrrigationType, CropStatus, GrowthStage

# -- Crop Cycle --
class CropCycleBase(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    planting_date: datetime
    expected_harvest_date: Optional[datetime] = None
    initial_quantity_seeds: Optional[float] = None

class CropCycleCreateDTO(CropCycleBase):
    expected_duration_days: Optional[int] = None

class CropCycleRead(CropCycleBase):
    id: UUID
    field_id: UUID
    actual_harvest_date: Optional[datetime] = None
    status: CropStatus
    current_growth_stage: GrowthStage

    model_config = {"from_attributes": True}

# -- Environmental Cache --
class EnvironmentalCacheRead(BaseModel):
    id: UUID
    field_id: UUID
    ndvi_score: Optional[float] = None
    soil_moisture_index: Optional[float] = None
    accumulated_gdd: Optional[float] = None
    evapotranspiration: Optional[float] = None
    captured_at: datetime

    model_config = {"from_attributes": True}

# -- Soil Report --
class SoilReportRead(BaseModel):
    id: UUID
    field_id: UUID
    ph_level: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_matter: Optional[float] = None
    recorded_at: datetime

    model_config = {"from_attributes": True}

# -- Field --
class FieldBase(BaseModel):
    polygon: Dict[str, Any]
    soil_type_baseline: Optional[SoilType] = None
    irrigation_type: Optional[IrrigationType] = None

class FieldCreate(FieldBase):
    pass

class FieldRead(FieldBase):
    id: UUID
    farm_id: UUID
    agromonitoring_id: Optional[str] = None
    area_hectares: Optional[float] = None

    model_config = {"from_attributes": True}

class FieldDetailedDTO(BaseModel):
    metadata: FieldRead
    active_crop: Optional[CropCycleRead] = None
    latest_health: Optional[EnvironmentalCacheRead] = None
    weather_forecast: List[Dict[str, Any]] = []

# -- Farm --
class FarmBase(BaseModel):
    name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmRead(FarmBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    fields: List[FieldRead] = []

    model_config = {"from_attributes": True}
