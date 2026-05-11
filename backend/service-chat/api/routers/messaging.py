import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from api.db.session import get_db
from api.core.security import verify_token
from api.models.chat import MessageArchive, UserSettings
from api.schemas.chat import ChatRoomRead, MessageRead, MessageReaction, InitiateChatRequest
from api.services.firestore_chat_service import FirestoreChatService

router = APIRouter()
fs_service = FirestoreChatService()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.post("/chat/initiate", response_model=str)
async def initiate_chat(
    payload: InitiateChatRequest,
    token: dict = Depends(verify_token)
):
    """Creates a 1:1 or Group room."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    participants = payload.participants
    if str(user_id) not in [str(p) for p in participants]:
        participants.append(user_id)
        
    p_ids = [str(p) for p in participants]
    metadata = {"name": payload.name} if payload.name else {}
    
    room_id = await fs_service.initiate_room(p_ids, payload.is_group, metadata)
    return room_id

@router.post("/chat/rooms/{room_id}/messages")
async def send_message(
    room_id: str,
    text: str = Body(...),
    type: str = Body("TEXT"),
    attachment_url: Optional[str] = Body(None),
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Sends a message and archives it in PostgreSQL."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    # 1. Send to Firestore
    msg_id = await fs_service.send_message(room_id, str(user_id), text, type, attachment_url)
    
    # 2. Archive in PostgreSQL (Auditing)
    archive = MessageArchive(
        room_id=uuid.UUID(hashlib.md5(room_id.encode()).hexdigest()),
        sender_id=user_id,
        message_body=text[:1000] # Cap archive size
    )
    db.add(archive)
    await db.commit()
    
    return {"message_id": msg_id}

@router.post("/chat/rooms/{room_id}/messages/{message_id}/react")
async def react_to_message(
    room_id: str,
    message_id: str,
    payload: MessageReaction,
    token: dict = Depends(verify_token)
):
    """Adds or removes a reaction."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    await fs_service.add_reaction(room_id, message_id, str(user_id), payload.emoji, payload.action)
    return {"status": "updated"}
