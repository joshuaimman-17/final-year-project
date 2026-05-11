from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
from api.db.session import get_db
from api.schemas.user import (
    UserCreate, UserRead, UserLogin, TokenResponse, UserUpdate,
    ExpertProfileCreate, ExpertProfileRead, ExpertReview, ForgotPasswordRequest
)
from api.core.security import get_current_user_uid, verify_token
from api.controllers.user_controller import UserController

router = APIRouter(tags=["users"])

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    return await UserController.register(user_in, db)

@router.post("/login", response_model=TokenResponse)
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    return await UserController.login(login_in, db)

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    return await UserController.forgot_password(req.email)

@router.get("/me", response_model=UserRead)
async def get_me(decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    return await UserController.get_me(decoded_token, db)

@router.patch("/profile", response_model=UserRead)
@router.put("/me", response_model=UserRead) # Maintain alias
async def update_profile(user_update: UserUpdate, decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    email = decoded_token.get("email")
    return await UserController.update_profile(email, user_update, db)

@router.post("/expert-apply", response_model=ExpertProfileRead)
async def apply_expert(profile_in: ExpertProfileCreate, decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    user = await UserController.get_me(decoded_token, db)
    return await UserController.expert_apply(user.id, profile_in, db)

@router.delete("/account")
async def deactivate_account(decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    user = await UserController.get_me(decoded_token, db)
    return await UserController.deactivate(user.id, db)

# Social
@router.get("/experts", response_model=List[UserRead])
async def list_experts(specialization: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    return await UserController.get_experts(specialization, db)

@router.post("/follow/{target_id}")
async def follow_user(target_id: uuid.UUID, decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    user = await UserController.get_me(decoded_token, db)
    return await UserController.follow(user.id, target_id, db)

@router.delete("/follow/{target_id}")
async def unfollow_user(target_id: uuid.UUID, decoded_token: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    user = await UserController.get_me(decoded_token, db)
    return await UserController.unfollow(user.id, target_id, db)

@router.get("/{id}/followers", response_model=List[UserRead])
async def get_followers(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await UserController.get_followers(id, db)


