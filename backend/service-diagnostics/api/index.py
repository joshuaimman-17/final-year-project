from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers.diagnose import router as diagnose_router
from api.routers.expert import router as expert_router

app = FastAPI(title="Dr. Plant - Diagnosis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose_router, prefix="/api/v1")
app.include_router(expert_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "diagnostics"}
