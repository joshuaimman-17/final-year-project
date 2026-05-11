from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from api.services.diagnosis_service import DiagnosisService
from api.schemas.diagnosis import DiagnosisCreate, ExpertReviewCreate

class DiagnosisController:
    @staticmethod
    async def analyze_crop(diag_in: DiagnosisCreate, uid: str, db: AsyncSession):
        return await DiagnosisService.analyze_crop(diag_in, uid, db)

    @staticmethod
    async def get_farm_history(farm_id: uuid.UUID, db: AsyncSession):
        return await DiagnosisService.get_farm_history(farm_id, db)

    @staticmethod
    async def get_expert_queue(db: AsyncSession):
        return await DiagnosisService.get_pending_queue(db)

    @staticmethod
    async def submit_review(diagnosis_id: uuid.UUID, review_in: ExpertReviewCreate, db: AsyncSession):
        return await DiagnosisService.submit_expert_review(diagnosis_id, review_in, db)
