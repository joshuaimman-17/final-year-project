from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class Role(BaseModel):
    name: str # e.g., 'farmer', 'expert', 'admin'
    permissions: List[str]

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    role: str
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str # 'farmer', 'expert', 'admin'

class UserLogin(BaseModel):
    email: EmailStr
    password: str
