from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    role: str = "FARMER"
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserRead(UserBase):
    id: UUID
    firebase_uid: Optional[str] = None
    is_active: bool = True
    trust_score: Optional[str] = "0.0"
    last_active_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class ExpertProfileBase(BaseModel):
    license_number: str
    specialization: str
    credentials_url: str

class ExpertProfileCreate(ExpertProfileBase):
    pass

class ExpertProfileRead(ExpertProfileBase):
    user_id: UUID
    verification_status: str
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None

    class Config:
        from_attributes = True

class ExpertReview(BaseModel):
    status: str # APPROVED | REJECTED
    reason: Optional[str] = None

class FollowRead(BaseModel):
    follower_id: UUID
    following_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

