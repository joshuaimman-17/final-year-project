from fastapi import FastAPI
import sys
import os
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import get_database
from shared.event_bus import consume_event, publish_event

app = FastAPI(title="Analysis Service - ML Inference")

async def get_db():
    return get_database("analysis_db")

async def process_image_uploaded_event(payload: dict):
    print(f"Received ImageUploaded event: {payload}")
    image_id = payload.get("image_id")
    owner_id = payload.get("owner_id")
    
    # Simulate ML inference delay
    await asyncio.sleep(2)
    
    # Mock result
    diagnosis = {
        "image_id": image_id,
        "owner_id": owner_id,
        "disease_detected": "Leaf Blight",
        "confidence": 0.92,
        "status": "completed"
    }
    
    db = await get_db()
    await db.diagnoses.insert_one(diagnosis)
    
    # Emit DiagnosisCompleted event for Advisory Service
    await publish_event("DiagnosisCompleted", diagnosis)

@app.on_event("startup")
async def startup_event():
    # Start consumer in the background
    asyncio.create_task(consume_event("ImageUploaded", "analysis_image_queue", process_image_uploaded_event))

@app.get("/health")
def health_check():
    return {"status": "ok"}
