import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field

# ─── Firestore-backed Entities ──────────────────────────────────────────────

class LocationContext(BaseModel):
    district: str
    state: str

class PostBase(BaseModel):
    content: str
    image_urls: List[str] = []
    tags: List[str] = []
    location_context: Optional[LocationContext] = None

class PostCreate(PostBase):
    pass

class PostRead(PostBase):
    id: str
    author_id: str = ""
    author_name: Optional[str] = "Unknown User"
    author_role: Optional[str] = "FARMER"
    likes_count: int = 0
    comments_count: int = 0
    timestamp: Optional[datetime] = None
    created_at: Optional[str] = None
    image_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CommentCreate(BaseModel):
    text: str

class CommentRead(BaseModel):
    id: str
    author_id: str
    author_name: Optional[str] = "Farmer"
    author_role: Optional[str] = "FARMER"
    text: str
    likes_count: int = 0
    replies_count: int = 0
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ReplyCreate(BaseModel):
    text: str

class ReplyRead(BaseModel):
    id: str
    author_id: uuid.UUID
    text: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ─── PostgreSQL-backed Entities ─────────────────────────────────────────────

class FollowRead(BaseModel):
    id: uuid.UUID
    follower_id: uuid.UUID
    following_id: uuid.UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserInteractionRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    target_type: str
    target_id: uuid.UUID
    interaction_type: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
