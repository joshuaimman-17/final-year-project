from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers.posts import router as posts_router
from api.routers.engagement import router as engagement_router
from api.routers.social import router as social_router

app = FastAPI(title="Dr. Plant - Community Service")
# Registering consolidated routes for posts and engagement

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts_router, prefix="/api/v1")
app.include_router(engagement_router, prefix="/api/v1")
app.include_router(social_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "community"}
