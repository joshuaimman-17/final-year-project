import hashlib
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from api.db.session import get_db
from api.models.diagnosis import Diagnosis, ExpertRecommendation, DiagnosisStatus
from api.schemas.diagnosis import ExpertRecommendationCreate, ExpertRecommendationRead, DiagnosisRead
from api.core.security import verify_token

router = APIRouter()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())


@router.get("/expert/queue", response_model=list[DiagnosisRead])
async def get_expert_queue(
    db:         AsyncSession = Depends(get_db),
    token:      dict = Depends(verify_token),
    sort_by:    str = Query(default="confidence_asc", description="confidence_asc | created_at"),
):
    """
    Returns all AI_DIAGNOSED cases for expert review.
    Low-confidence cases appear first (priority review).
    """
    result = await db.execute(
        select(Diagnosis)
        .options(selectinload(Diagnosis.ai_result), selectinload(Diagnosis.expert_recommendation))
        .where(Diagnosis.status.in_([DiagnosisStatus.AI_DIAGNOSED.value, DiagnosisStatus.EXPERT_REVIEWING.value]))
        .order_by(Diagnosis.created_at.asc())
    )
    diagnoses = result.scalars().all()

    # Sort: priority (low confidence) first
    if sort_by == "confidence_asc":
        diagnoses = sorted(
            diagnoses,
            key=lambda d: d.ai_result.confidence_score if d.ai_result else 1.0
        )

    return diagnoses


@router.post("/expert/recommend", response_model=ExpertRecommendationRead)
async def submit_recommendation(
    payload: ExpertRecommendationCreate,
    db:      AsyncSession = Depends(get_db),
    token:   dict = Depends(verify_token),
):
    """
    Expert confirms / overrides the AI result and attaches a treatment plan.
    Updates diagnosis status to COMPLETED.
    """
    expert_uuid = _firebase_uid_to_uuid(token["uid"])

    # Fetch diagnosis
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == payload.diagnosis_id))
    diag = result.scalars().first()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnosis not found")

    # Check no duplicate recommendation
    existing = await db.execute(
        select(ExpertRecommendation).where(ExpertRecommendation.diagnosis_id == payload.diagnosis_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Recommendation already submitted")

    rec = ExpertRecommendation(
        diagnosis_id      = payload.diagnosis_id,
        expert_id         = expert_uuid,
        confirmed_disease = payload.confirmed_disease,
        severity          = payload.severity,
        treatment_plan    = payload.treatment_plan,
        reviewed_at       = datetime.utcnow(),
    )
    db.add(rec)

    # Update diagnosis status → COMPLETED
    diag.status = DiagnosisStatus.COMPLETED.value
    await db.commit()
    await db.refresh(rec)
    return rec
