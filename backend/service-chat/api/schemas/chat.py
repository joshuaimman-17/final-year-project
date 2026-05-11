import uuid
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field

# ─── Requests ─────────────────────────────────────────────────────────────

class InitiateChatRequest(BaseModel):
    participants: List[uuid.UUID]
    is_group: bool = False
    name: Optional[str] = None

# ─── Firestore Entities ─────────────────────────────────────────────────────

class MessageReaction(BaseModel):
    emoji: str
    action: str # ADD, REMOVE

class MessageRead(BaseModel):
    id: str
    sender_id: uuid.UUID
    text: str
    type: str = "TEXT" # TEXT, IMAGE, VOICE, VIDEO, FILE
    reactions: Dict[str, List[uuid.UUID]] = {}
    reply_to_id: Optional[uuid.UUID] = None
    attachment_url: Optional[str] = None
    is_seen: bool = False
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatRoomRead(BaseModel):
    id: str
    is_group: bool = False
    participants: List[uuid.UUID]
    admins: List[uuid.UUID] = []
    metadata: Dict[str, str] = {} # {name, avatar}
    last_message: Optional[Dict] = None # {text, sender_id, timestamp}
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PresenceRead(BaseModel):
    user_id: uuid.UUID
    status: str # ONLINE, OFFLINE
    last_seen: datetime

class BroadcastCreate(BaseModel):
    recipient_ids: List[uuid.UUID]
    content: str
    attachment_url: Optional[str] = None

# ─── PostgreSQL Entities ────────────────────────────────────────────────────

class UserSettingsRead(BaseModel):
    user_id: uuid.UUID
    blocked_users: List[uuid.UUID]
    muted_rooms: List[uuid.UUID]
    allow_dms_from: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
