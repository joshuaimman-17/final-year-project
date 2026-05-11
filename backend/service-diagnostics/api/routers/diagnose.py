import hashlib
import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional

from api.db.session import get_db
from api.models.diagnosis import Diagnosis, AIDiagnosisResult, DiagnosisStatus
from api.schemas.diagnosis import DiagnoseRequest, DiagnosisRead
from api.core.security import verify_token
from api.services.ai_service import run_inference
from api.services.treatment_service import treatment_service
from api.services.risk_service import risk_service
from pydantic import Field, BaseModel

router = APIRouter()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

async def _process_diagnosis(diagnosis_id: uuid.UUID, image_url: str, crop_type: Optional[str]):
    """Background task: calls the AI, stores the result, updates status."""
    from api.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
        diag = result.scalars().first()
        if not diag:
            return

        try:
            ai_data = await run_inference(image_url, crop_type)

            ai_result = AIDiagnosisResult(
                diagnosis_id      = diagnosis_id,
                suggested_disease = ai_data["suggested_disease"],
                confidence_score  = ai_data["confidence_score"],
                raw_ai_output     = ai_data["raw_ai_output"],
                model_used        = ai_data["model_used"],
                priority_review   = ai_data["priority_review"],
                processed_at      = datetime.utcnow(),
            )
            
            # Add advisory treatment logic
            ai_result.suggested_treatment = treatment_service.get_suggested_treatment(ai_result.suggested_disease)
            
            db.add(ai_result)

            if ai_data.get("auto_complete"):
                diag.status = DiagnosisStatus.COMPLETED.value
            elif ai_data["priority_review"]:
                diag.status = DiagnosisStatus.EXPERT_REVIEWING.value
            else:
                diag.status = DiagnosisStatus.AI_DIAGNOSED.value

        except Exception as e:
            diag.status = DiagnosisStatus.FAILED
            print(f"Diagnosis background task failed: {e}")

        await db.commit()


@router.post("/diagnose", response_model=DiagnosisRead)
async def submit_diagnosis(
    payload:    DiagnoseRequest,
    background: BackgroundTasks,
    db:         AsyncSession = Depends(get_db),
    token:      dict = Depends(verify_token),
):
    user_uuid = _firebase_uid_to_uuid(token["uid"])

    diag = Diagnosis(
        field_id  = payload.field_id,
        user_id   = user_uuid,
        image_url = payload.image_url,
        crop_type = payload.crop_type,
        status    = DiagnosisStatus.PROCESSING.value,
    )
    db.add(diag)
    await db.commit()
    await db.refresh(diag)

    # Fire-and-forget AI inference in background
    background.add_task(_process_diagnosis, diag.id, diag.image_url, diag.crop_type)

    # Eagerly load relationships for the response
    result = await db.execute(
        select(Diagnosis)
        .options(selectinload(Diagnosis.ai_result), selectinload(Diagnosis.expert_recommendation))
        .where(Diagnosis.id == diag.id)
    )
    return result.scalars().first()


@router.get("/diagnose/history", response_model=list[DiagnosisRead])
async def get_history(
    field_id: Optional[uuid.UUID] = Query(default=None),
    db:       AsyncSession = Depends(get_db),
    token:    dict = Depends(verify_token),
):
    user_uuid = _firebase_uid_to_uuid(token["uid"])
    query = (
        select(Diagnosis)
        .options(selectinload(Diagnosis.ai_result), selectinload(Diagnosis.expert_recommendation))
        .where(Diagnosis.user_id == user_uuid)
        .order_by(Diagnosis.created_at.desc())
    )
    if field_id:
        query = query.where(Diagnosis.field_id == field_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/diagnose/{diagnosis_id}", response_model=DiagnosisRead)
async def get_diagnosis(
    diagnosis_id: uuid.UUID,
    db:           AsyncSession = Depends(get_db),
    token:        dict = Depends(verify_token),
):
    result = await db.execute(
        select(Diagnosis)
        .options(selectinload(Diagnosis.ai_result), selectinload(Diagnosis.expert_recommendation))
        .where(Diagnosis.id == diagnosis_id)
    )
    diag = result.scalars().first()
    if not diag:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return diag

class RiskAssessmentRequest(BaseModel):
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative Humidity percentage")

@router.post("/risk-assessment", tags=["advisory"])
async def get_outbreak_risk(payload: RiskAssessmentRequest):
    """Analyze environmental risk for pest/disease outbreaks."""
    return risk_service.analyze_outbreak_risk(payload.temperature, payload.humidity)
