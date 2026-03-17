from fastapi import FastAPI, Depends
from pydantic import BaseModel
import sys
import os
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import get_database
from shared.rbac import RequirePermission, get_current_user
from shared.event_bus import consume_event

app = FastAPI(title="Advisory Service")

async def get_db():
    return get_database("advisory_db")

async def process_diagnosis_completed_event(payload: dict):
    disease = payload.get("disease_detected")
    owner_id = payload.get("owner_id")
    
    # Mocking advisory generation logic
    recommendation = {
        "owner_id": owner_id,
        "related_disease": disease,
        "advice": f"Apply copper-based fungicide for {disease}.",
        "status": "pending_expert_review" # Needs expert validation
    }
    
    db = await get_db()
    await db.recommendations.insert_one(recommendation)
    
    # Optionally notify the user via a push notification service

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume_event("DiagnosisCompleted", "advisory_diagnosis_queue", process_diagnosis_completed_event))

class ExpertValidation(BaseModel):
    recommendation_id: str
    status: str # 'approved' or 'overridden'
    override_advice: str = ""

@app.post("/advisories/validate", dependencies=[Depends(RequirePermission("approve_diagnosis"))])
async def validate_advisory(payload: ExpertValidation, user=Depends(get_current_user), db=Depends(get_db)):
    """ Expert reviews and validates the AI recommendation """
    from bson import ObjectId
    
    update_data = {
        "status": payload.status,
        "reviewed_by": user["sub"]
    }
    if payload.status == 'overridden':
        update_data["advice"] = payload.override_advice
        
    await db.recommendations.update_one(
        {"_id": ObjectId(payload.recommendation_id)},
        {"$set": update_data}
    )
    return {"message": f"Recommendation {payload.status}"}
