from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from api.db.session import get_db
from api.schemas.diagnosis import DiagnosisCreate, DiagnosisRead, ExpertReviewCreate
from api.core.security import get_current_user_uid
from api.controllers.diagnosis_controller import DiagnosisController

router = APIRouter(tags=["diagnostics"])

@router.post("/analyze", response_model=DiagnosisRead)
async def analyze_crop(diag_in: DiagnosisCreate, uid: str = Depends(get_current_user_uid), db: AsyncSession = Depends(get_db)):
    return await DiagnosisController.analyze_crop(diag_in, uid, db)

@router.get("/farm/{farm_id}", response_model=List[DiagnosisRead])
async def get_farm_history(farm_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await DiagnosisController.get_farm_history(farm_id, db)

@router.get("/queue", response_model=List[DiagnosisRead])
async def get_expert_queue(db: AsyncSession = Depends(get_db)):
    return await DiagnosisController.get_expert_queue(db)

@router.post("/{diagnosis_id}/review")
async def submit_review(diagnosis_id: uuid.UUID, review_in: ExpertReviewCreate, db: AsyncSession = Depends(get_db)):
    return await DiagnosisController.submit_review(diagnosis_id, review_in, db)

