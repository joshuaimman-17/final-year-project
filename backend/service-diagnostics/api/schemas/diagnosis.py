from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from api.models.diagnosis import DiagnosisStatus, Severity

# -- AI Result --
class AIDiagnosisResultRead(BaseModel):
    diagnosis_id: UUID
    suggested_disease: Optional[str]
    confidence_score: Optional[float]
    raw_ai_output: Optional[Dict[str, Any]]
    suggested_treatment: Optional[str]
    model_used: Optional[str]
    priority_review: Optional[bool]
    processed_at: datetime

    model_config = {"from_attributes": True}

# -- Expert Recommendation --
class ExpertRecommendationCreate(BaseModel):
    diagnosis_id: UUID
    confirmed_disease: str
    severity: Severity
    treatment_plan: str

class ExpertRecommendationRead(BaseModel):
    diagnosis_id: UUID
    expert_id: UUID
    confirmed_disease: str
    severity: Severity
    treatment_plan: str
    reviewed_at: datetime

    model_config = {"from_attributes": True}

# -- Diagnosis --
class DiagnoseRequest(BaseModel):
    field_id: UUID
    image_url: str
    crop_type: Optional[str] = None  # e.g. "Potato", "Rice", "Peanut"

class DiagnosisRead(BaseModel):
    id: UUID
    field_id: UUID
    user_id: UUID
    image_url: str
    crop_type: Optional[str]
    status: DiagnosisStatus
    created_at: datetime
    ai_result: Optional[AIDiagnosisResultRead] = None
    expert_recommendation: Optional[ExpertRecommendationRead] = None

    model_config = {"from_attributes": True}
