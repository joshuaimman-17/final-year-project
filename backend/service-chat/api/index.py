from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers.discovery import router as discovery_router
from api.routers.messaging import router as messaging_router
from api.routers.broadcast import router as broadcast_router

app = FastAPI(title="Dr. Plant - Chat Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(discovery_router, prefix="/api/v1")
app.include_router(messaging_router, prefix="/api/v1")
app.include_router(broadcast_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "chat"}
