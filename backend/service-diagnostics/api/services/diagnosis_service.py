from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import os
import uuid
from fastapi import HTTPException
from api.models.diagnosis import Diagnosis, ExpertReview
from api.schemas.diagnosis import DiagnosisCreate, ExpertReviewCreate

HF_API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224"
HF_TOKEN = os.getenv("HF_TOKEN")

class DiagnosisService:
    @staticmethod
    async def analyze_crop(diag_in: DiagnosisCreate, uid: str, db: AsyncSession):
        try:
            user_uuid = uuid.UUID(uid)
        except:
            user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, uid)

        # Trigger AI Inference
        ai_result = await DiagnosisService._get_ai_inference(diag_in.image_url)

        # Process AI result
        top_prediction = ai_result[0] if ai_result else {"label": "Unknown", "score": 0}
        
        new_diag = Diagnosis(
            farmer_id=user_uuid,
            farm_id=diag_in.farm_id,
            image_url=diag_in.image_url,
            ai_raw_result=ai_result,
            disease_name=top_prediction.get("label"),
            confidence=top_prediction.get("score"),
            status="AI_REVIEWED"
        )
        db.add(new_diag)
        await db.commit()
        await db.refresh(new_diag)
        return new_diag

    @staticmethod
    async def get_farm_history(farm_id: uuid.UUID, db: AsyncSession):
        result = await db.execute(select(Diagnosis).where(Diagnosis.farm_id == farm_id))
        return result.scalars().all()

    @staticmethod
    async def get_pending_queue(db: AsyncSession):
        result = await db.execute(select(Diagnosis).where(Diagnosis.status == "AI_REVIEWED"))
        return result.scalars().all()

    @staticmethod
    async def submit_expert_review(diagnosis_id: uuid.UUID, review_in: ExpertReviewCreate, db: AsyncSession):
        result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
        diag = result.scalars().first()
        if not diag:
            raise HTTPException(status_code=404, detail="Diagnosis not found")
        
        diag.status = "EXPERT_REVIEWED"
        diag.disease_name = review_in.disease_name
        
        new_review = ExpertReview(
            diagnosis_id=diagnosis_id,
            expert_id=review_in.expert_id,
            overridden=review_in.overridden,
            disease_name=review_in.disease_name,
            treatment_plan=review_in.treatment_plan
        )
        db.add(new_review)
        await db.commit()
        return {"message": "Review submitted successfully"}

    @staticmethod
    async def _get_ai_inference(image_url: str):
        async with httpx.AsyncClient() as client:
            if HF_TOKEN:
                resp = await client.post(
                    HF_API_URL,
                    headers={"Authorization": f"Bearer {HF_TOKEN}"},
                    json={"inputs": image_url}
                )
                if resp.status_code == 200:
                    return resp.json()
            return [{"label": "Healthy", "score": 0.95}]
