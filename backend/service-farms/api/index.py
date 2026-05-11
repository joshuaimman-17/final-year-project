from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from api.routers.farms import router as farms_router
from api.routers.fields import router as fields_router

app = FastAPI(title="Dr. Plant - Farm Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(farms_router, prefix="/api/v1")
app.include_router(fields_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "farms"}
