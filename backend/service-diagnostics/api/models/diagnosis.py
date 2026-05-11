import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from api.db.session import Base

# Python-side enum definitions (used by Pydantic schemas for validation)
class DiagnosisStatus(str, enum.Enum):
    PROCESSING        = "PROCESSING"
    AI_DIAGNOSED      = "AI_DIAGNOSED"
    EXPERT_REVIEWING  = "EXPERT_REVIEWING"
    COMPLETED         = "COMPLETED"
    FAILED            = "FAILED"

class Severity(str, enum.Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"

class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id  = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id   = Column(UUID(as_uuid=True), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    crop_type = Column(String)
    # Store as VARCHAR — avoids PostgreSQL type OID caching issues with Neon pooler
    status    = Column(String, default=DiagnosisStatus.PROCESSING.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    ai_result             = relationship("AIDiagnosisResult",     back_populates="diagnosis", uselist=False, cascade="all, delete-orphan")
    expert_recommendation = relationship("ExpertRecommendation",  back_populates="diagnosis", uselist=False, cascade="all, delete-orphan")


class AIDiagnosisResult(Base):
    __tablename__ = "ai_diagnosis_results"

    diagnosis_id      = Column(UUID(as_uuid=True), ForeignKey("diagnoses.id"), primary_key=True)
    suggested_disease = Column(String)
    confidence_score  = Column(Float)
    raw_ai_output     = Column(JSONB)
    suggested_treatment = Column(Text)
    model_used        = Column(String)
    priority_review   = Column(Boolean, default=False)
    processed_at      = Column(DateTime, default=datetime.utcnow)

    diagnosis = relationship("Diagnosis", back_populates="ai_result")


class ExpertRecommendation(Base):
    __tablename__ = "expert_recommendations"

    diagnosis_id      = Column(UUID(as_uuid=True), ForeignKey("diagnoses.id"), primary_key=True)
    expert_id         = Column(UUID(as_uuid=True), nullable=False, index=True)
    confirmed_disease = Column(String, nullable=False)
    severity          = Column(String, nullable=False)   # VARCHAR, validated by Pydantic
    treatment_plan    = Column(Text, nullable=False)
    reviewed_at       = Column(DateTime, default=datetime.utcnow)

    diagnosis = relationship("Diagnosis", back_populates="expert_recommendation")
