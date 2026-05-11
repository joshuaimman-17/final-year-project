import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from api.db.session import get_db
from api.core.security import verify_token
from api.models.community import UserInteraction
from api.schemas.community import CommentCreate, CommentRead, ReplyCreate, ReplyRead
from api.services.firestore_service import FirestoreService

router = APIRouter()
fs_service = FirestoreService()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())


@router.post("/comments/{comment_id}/replies", response_model=ReplyRead)
async def add_reply(
    comment_id: str,
    post_id: str = Body(...), # We need post_id to find the comment in Firestore hierarchy
    payload: ReplyCreate = Body(...),
    token: dict = Depends(verify_token)
):
    user_id = _firebase_uid_to_uuid(token["uid"])
    reply_data = {
        "author_id": str(user_id),
        "text": payload.text
    }
    reply_id = await fs_service.create_reply(post_id, comment_id, reply_data)
    reply_data["id"] = reply_id
    return reply_data

@router.post("/{target_type}/{target_id}/like")
async def like_target(
    target_type: str,
    target_id: str,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Likes a post, comment, or reply."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    # Use the same MD5 hash logic to convert Firestore ID strings to UUIDs for PostgreSQL
    target_uuid = _firebase_uid_to_uuid(target_id)
    
    # 1. Check for existing like
    result = await db.execute(
        select(UserInteraction).where(
            UserInteraction.user_id == user_id,
            UserInteraction.target_id == target_uuid,
            UserInteraction.interaction_type == "LIKE"
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Already liked")

    # 2. Save interaction in PostgreSQL
    interaction = UserInteraction(
        user_id=user_id,
        target_id=target_uuid,
        target_type=target_type.upper(),
        interaction_type="LIKE"
    )
    db.add(interaction)
    
    # 3. Increment in Firestore
    # We need to know the parent IDs for comments/replies. 
    # For now, simplify and just update the main document if target_type is POST
    await fs_service.update_likes(target_type.upper().rstrip('S'), target_id, increment=1)
    
    await db.commit()
    return {"status": "liked"}

@router.post("/{target_type}/{target_id}/flag")
async def flag_content(
    target_type: str,
    target_id: str,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Reports content. If 5 flags accumulate, content is hidden (future logic).
    """
    user_id = _firebase_uid_to_uuid(token["uid"])
    target_uuid = uuid.UUID(hashlib.md5(target_id.encode()).hexdigest())

    interaction = UserInteraction(
        user_id=user_id,
        target_id=target_uuid,
        target_type=target_type.upper(),
        interaction_type="FLAG"
    )
    db.add(interaction)
    await db.commit()
    
    # Check flag count (Simplified moderation)
    result = await db.execute(
        select(UserInteraction).where(
            UserInteraction.target_id == target_uuid,
            UserInteraction.interaction_type == "FLAG"
        )
    )
    flag_count = len(result.scalars().all())
    if flag_count >= 5:
        # In a real app, you'd hide the content in Firestore here
        pass

    return {"status": "flagged", "count": flag_count}
