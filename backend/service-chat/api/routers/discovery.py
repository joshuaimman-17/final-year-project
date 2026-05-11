import uuid
import hashlib
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from api.core.security import verify_token
from api.schemas.chat import PresenceRead
from api.services.firestore_chat_service import FirestoreChatService

router = APIRouter()
fs_service = FirestoreChatService()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.get("/chat/presence/{user_id}", response_model=PresenceRead)
async def get_presence(user_id: uuid.UUID, token: dict = Depends(verify_token)):
    """Fetches the current online status and 'last seen' of a specific user."""
    presence = await fs_service.get_presence(str(user_id))
    if not presence:
        raise HTTPException(status_code=404, detail="Presence info not found")
    return presence

@router.post("/chat/heartbeat")
async def heartbeat(token: dict = Depends(verify_token)):
    """Updates the authenticated user's presence to ONLINE."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    await fs_service.update_presence(str(user_id), "ONLINE")
    return {"status": "updated"}

# Search Users endpoint would normally call User Service
@router.get("/chat/search-users")
async def search_users(
    query: str = Query(...),
    role: Optional[str] = Query(None),
    token: dict = Depends(verify_token)
):
    """In a real app, this would proxy to User Service."""
    return {"message": "Search proxy not implemented - please use User Service direct"}
