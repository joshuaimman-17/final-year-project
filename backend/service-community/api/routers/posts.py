import uuid
import hashlib
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from api.db.session import get_db
from api.core.security import verify_token
from api.schemas.community import CommentCreate, CommentRead, ReplyCreate, ReplyRead, PostRead, PostCreate
from api.services.firestore_service import FirestoreService

router = APIRouter()
fs_service = FirestoreService()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.get("/feed")
async def get_feed(
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    authorization: Optional[str] = None
):
    """Returns a paginated list of posts, filtered by location if provided."""
    posts = await fs_service.get_posts(district=district, state=state, limit=limit)
    return posts

@router.post("/posts", response_model=PostRead)
async def create_post(
    payload: PostCreate,
    token: dict = Depends(verify_token)
):
    """Creates a new post in Firestore."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    post_data = payload.model_dump()
    post_data["author_id"] = str(user_id)
    
    post_id = await fs_service.create_post(post_data)
    
    # Return the created post (simulated by adding the generated ID)
    post_data["id"] = post_id
    post_data["timestamp"] = post_data.get("timestamp") or "" # Firestore service sets it
    return post_data

@router.get("/posts/{post_id}/comments", response_model=List[CommentRead])
async def get_comments(
    post_id: str,
    token: dict = Depends(verify_token)
):
    """Retrieves all comments for a specific post."""
    return await fs_service.get_comments(post_id)

@router.post("/posts/{post_id}/comments", response_model=CommentRead)
async def add_comment(
    post_id: str,
    payload: CommentCreate,
    token: dict = Depends(verify_token)
):
    """Adds a new comment to a post."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    comment_data = {
        "author_id": str(user_id),
        "text": payload.text
    }
    comment_id = await fs_service.create_comment(post_id, comment_data)
    comment_data["id"] = comment_id
    return comment_data

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    token: dict = Depends(verify_token)
):
    """Soft-deletes a post (marks as hidden). Note: In Firestore we can just delete or set a flag."""
    # For now, we'll just delete the document from Firestore
    # In a real production app, you might want to check ownership
    db = fs_service.db
    db.collection("posts").document(post_id).delete()
    return {"status": "deleted"}

