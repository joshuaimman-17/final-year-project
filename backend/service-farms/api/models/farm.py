import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from api.db.session import Base

class SoilType(str, enum.Enum):
    CLAY = "CLAY"
    LOAMY = "LOAMY"
    SANDY = "SANDY"
    BLACK = "BLACK"
    RED = "RED"

class IrrigationType(str, enum.Enum):
    DRIP = "DRIP"
    SPRINKLER = "SPRINKLER"
    RAINFED = "RAINFED"
    CANAL = "CANAL"

class CropStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    HARVESTED = "HARVESTED"
    FAILED = "FAILED"

class GrowthStage(str, enum.Enum):
    SEEDLING = "SEEDLING"
    VEGETATIVE = "VEGETATIVE"
    FLOWERING = "FLOWERING"
    RIPENING = "RIPENING"

class Farm(Base):
    __tablename__ = "farms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), index=True, nullable=False) # FK to User Service (logical)
    name = Column(String, nullable=False)
    village = Column(String)
    district = Column(String)
    state = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False)
    agromonitoring_id = Column(String)
    polygon = Column(JSONB, nullable=False)
    area_hectares = Column(Float)
    soil_type_baseline = Column(Enum(SoilType))
    irrigation_type = Column(Enum(IrrigationType))
    
    farm = relationship("Farm", back_populates="fields")
    crop_cycles = relationship("CropCycle", back_populates="field", cascade="all, delete-orphan")
    soil_reports = relationship("SoilReport", back_populates="field", cascade="all, delete-orphan")
    environmental_caches = relationship("EnvironmentalCache", back_populates="field", cascade="all, delete-orphan")

class CropCycle(Base):
    __tablename__ = "crop_cycles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    variety = Column(String)
    planting_date = Column(DateTime, nullable=False)
    expected_harvest_date = Column(DateTime)
    actual_harvest_date = Column(DateTime)
    initial_quantity_seeds = Column(Float)
    status = Column(Enum(CropStatus), default=CropStatus.PLANNED)
    current_growth_stage = Column(Enum(GrowthStage), default=GrowthStage.SEEDLING)
    
    field = relationship("Field", back_populates="crop_cycles")

class SoilReport(Base):
    __tablename__ = "soil_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False)
    ph_level = Column(Float)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    organic_matter = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    field = relationship("Field", back_populates="soil_reports")

class EnvironmentalCache(Base):
    __tablename__ = "environmental_caches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False)
    ndvi_score = Column(Float)
    soil_moisture_index = Column(Float)
    accumulated_gdd = Column(Float)
    evapotranspiration = Column(Float)
    captured_at = Column(DateTime, default=datetime.utcnow)
    
    field = relationship("Field", back_populates="environmental_caches")
