from fastapi import FastAPI
from api.routers.users import router as users_router
from api.routers.admin import router as admin_router
from api.services.email_service import email_service
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dr.Plant Users Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

@app.get("/health")

def health_check():
    return {"status": "healthy", "service": "users"}

class EmailTestRequest(BaseModel):
    to_email: str
    subject: str = "Dr. Plant Test Email"
    body: str = "This is a test email from the Dr. Plant SMTP service."

@app.post("/api/v1/test-email", tags=["debug"])
async def test_email(request: EmailTestRequest):
    success = await email_service.send_email(
        subject=request.subject,
        recipients=[request.to_email],
        body=request.body
    )
    if success:
        return {"message": "Email sent successfully"}
    return {"message": "Failed to send email", "status": "error"}
