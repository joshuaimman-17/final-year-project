from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import sys
import os
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import get_database
from shared.rbac import RequirePermission, get_current_user
from shared.event_bus import publish_event

app = FastAPI(title="Ingestion Service")

class SensorTelemetry(BaseModel):
    sensor_id: str
    field_id: str
    soil_moisture: float
    soil_temperature: float
    npk_n: float
    npk_p: float
    npk_k: float

async def get_db():
    return get_database("ingestion_db")

@app.post("/telemetry")
async def receive_telemetry(data: SensorTelemetry, db=Depends(get_db)):
    """ Endpoint for ESP32 Gateway to push MQTT/HTTP telemetry """
    record = data.dict()
    await db.sensor_data.insert_one(record)
    
    # Simple threshold check
    if data.soil_moisture < 20.0:
        await publish_event("ThresholdBreached", {
            "sensor_id": data.sensor_id,
            "field_id": data.field_id,
            "issue": "Low Soil Moisture"
        })
    return {"status": "success"}

@app.post("/images/upload", dependencies=[Depends(RequirePermission("upload_image"))])
async def upload_crop_image(background_tasks: BackgroundTasks, file: UploadFile = File(...), user=Depends(get_current_user), db=Depends(get_db)):
    """ Farmer uploads an image for AI diagnosis """
    image_id = str(uuid.uuid4())
    # In reality, save file to S3 or persistent volume
    file_path = f"/storage/images/{image_id}.jpg"
    
    metadata = {
        "_id": image_id,
        "owner_id": user["sub"],
        "filename": file.filename,
        "status": "pending_analysis"
    }
    await db.images.insert_one(metadata)
    
    # Emit event for Analysis Service
    background_tasks.add_task(publish_event, "ImageUploaded", {
        "image_id": image_id,
        "owner_id": user["sub"]
    })
    
    return {"image_id": image_id, "message": "Image queued for diagnosis"}
