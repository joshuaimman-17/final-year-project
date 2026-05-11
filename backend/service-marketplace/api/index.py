from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers.listings import router as listings_router
from api.routers.orders import router as orders_router
from api.routers.reviews import router as reviews_router

app = FastAPI(title="Dr. Plant - Marketplace Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(listings_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "marketplace"}
