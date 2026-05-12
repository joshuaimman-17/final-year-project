from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from api.db.session import get_db
from api.schemas.user import ExpertProfileRead, ExpertReview, UserRead
from api.core.security import verify_token, check_role
from api.controllers.user_controller import UserController

router = APIRouter(prefix="/admin/users", tags=["admin"])

@router.get("/pending-experts", response_model=List[ExpertProfileRead])
async def list_pending_experts(
    decoded_token: dict = Depends(check_role("ADMIN")), 
    db: AsyncSession = Depends(get_db)
):
    return await UserController.list_pending_experts(db)

@router.patch("/{target_user_id}/verify")
async def verify_expert(
    target_user_id: uuid.UUID, 
    review: ExpertReview, 
    decoded_token: dict = Depends(check_role("ADMIN")), 
    db: AsyncSession = Depends(get_db)
):
    # Get admin ID from token
    admin_res = await UserController.get_me(decoded_token, db)
    return await UserController.verify_expert(target_user_id, admin_res.id, review, db)

@router.patch("/{id}/status")
async def toggle_user_status(
    id: uuid.UUID, 
    decoded_token: dict = Depends(check_role("ADMIN")), 
    db: AsyncSession = Depends(get_db)
):
    return await UserController.toggle_status(id, db)

@router.get("/", response_model=List[UserRead])
async def list_all_users(
    decoded_token: dict = Depends(check_role("ADMIN")), 
    db: AsyncSession = Depends(get_db)
):
    return await UserController.list_users(db)

@router.get("/stats")
async def get_platform_stats(
    decoded_token: dict = Depends(check_role("ADMIN")), 
    db: AsyncSession = Depends(get_db)
):
    return await UserController.get_stats(db)
