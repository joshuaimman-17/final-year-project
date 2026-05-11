import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from api.db.session import Base

class DMPermission(str, enum.Enum):
    EVERYONE      = "EVERYONE"
    FOLLOWED_ONLY = "FOLLOWED_ONLY"

class UserSettings(Base):
    __tablename__ = "chat_user_settings"

    user_id        = Column(UUID(as_uuid=True), primary_key=True)
    blocked_users  = Column(ARRAY(UUID(as_uuid=True)), default=[])
    muted_rooms    = Column(ARRAY(UUID(as_uuid=True)), default=[])
    allow_dms_from = Column(String, default=DMPermission.EVERYONE.value)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MessageArchive(Base):
    __tablename__ = "message_archive"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id      = Column(UUID(as_uuid=True), nullable=False, index=True)
    sender_id    = Column(UUID(as_uuid=True), nullable=False)
    message_body = Column(Text, nullable=False)
    sent_at      = Column(DateTime, default=datetime.utcnow)
