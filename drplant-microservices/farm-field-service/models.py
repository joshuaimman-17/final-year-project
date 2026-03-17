from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class FieldModel(BaseModel):
    id: str
    name: str
    area_hectares: float
    soil_type: str

class FarmCreate(BaseModel):
    name: str
    location: Dict # GeoJSON e.g., {"type": "Point", "coordinates": [long, lat]}
    fields: List[FieldModel] = []
    
class Farm(FarmCreate):
    id: Optional[str] = Field(None, alias="_id")
    owner_id: str
