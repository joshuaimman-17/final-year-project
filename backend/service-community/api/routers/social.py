import uuid
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from api.db.session import get_db
from api.core.security import verify_token
from api.models.community import Follow
from api.schemas.community import FollowRead

router = APIRouter()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.post("/follow/{following_id}")
async def follow_user(
    following_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Creates a follow relationship."""
    follower_id = _firebase_uid_to_uuid(token["uid"])
    
    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check if already following
    result = await db.execute(
        select(Follow).where(Follow.follower_id == follower_id, Follow.following_id == following_id)
    )
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Already following")

    follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(follow)
    await db.commit()
    return {"status": "following"}

@router.delete("/follow/{following_id}")
async def unfollow_user(
    following_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Removes a follow relationship."""
    follower_id = _firebase_uid_to_uuid(token["uid"])
    
    await db.execute(
        delete(Follow).where(Follow.follower_id == follower_id, Follow.following_id == following_id)
    )
    await db.commit()
    return {"status": "unfollowed"}

@router.get("/users/{user_id}/followers", response_model=List[FollowRead])
async def get_followers(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Returns a list of users following the target."""
    result = await db.execute(select(Follow).where(Follow.following_id == user_id))
    return result.scalars().all()

@router.get("/users/{user_id}/following", response_model=List[FollowRead])
async def get_following(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Returns a list of users the target is following."""
    result = await db.execute(select(Follow).where(Follow.follower_id == user_id))
    return result.scalars().all()
