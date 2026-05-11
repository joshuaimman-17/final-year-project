import uuid
import hashlib
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks
from api.core.security import verify_token
from api.schemas.chat import BroadcastCreate
from api.services.firestore_chat_service import FirestoreChatService

router = APIRouter()
fs_service = FirestoreChatService()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

async def _process_broadcast(broadcast_id: str, sender_id: str, recipient_ids: List[str], text: str):
    """Background task to deliver messages to individual DMs."""
    # In a real app, you'd iterate and call send_message for each recipient
    # This might involve creating/finding 1:1 rooms for each.
    pass

@router.post("/chat/broadcast")
async def send_broadcast(
    payload: BroadcastCreate,
    background: BackgroundTasks,
    token: dict = Depends(verify_token)
):
    """Initiates a broadcast message."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    # 1. Log in Firestore
    broadcast_id = await fs_service.create_broadcast(
        str(user_id), 
        [str(r) for r in payload.recipient_ids],
        {"text": payload.content, "attachment_url": payload.attachment_url}
    )
    
    # 2. Run delivery in background
    background.add_task(
        _process_broadcast, 
        broadcast_id, 
        str(user_id), 
        [str(r) for r in payload.recipient_ids], 
        payload.content
    )
    
    return {"broadcast_id": broadcast_id, "status": "SENDING"}
