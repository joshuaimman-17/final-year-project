import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from api.db.session import Base

class InteractionType(str, enum.Enum):
    LIKE = "LIKE"
    FLAG = "FLAG"

class TargetType(str, enum.Enum):
    POST    = "POST"
    COMMENT = "COMMENT"
    REPLY   = "REPLY"

class Follow(Base):
    __tablename__ = "follows"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id  = Column(UUID(as_uuid=True), nullable=False, index=True)
    following_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    # Prevent following the same person twice
    __table_args__ = (UniqueConstraint('follower_id', 'following_id', name='_follower_following_uc'),)

class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), nullable=False, index=True)
    target_type      = Column(String, nullable=False) # POST, COMMENT, REPLY (stored as VARCHAR for OID compatibility)
    target_id        = Column(UUID(as_uuid=True), nullable=False, index=True)
    interaction_type = Column(String, nullable=False) # LIKE, FLAG (stored as VARCHAR)
    created_at       = Column(DateTime, default=datetime.utcnow)

    # Prevent duplicate interactions of the same type on the same target
    __table_args__ = (UniqueConstraint('user_id', 'target_id', 'interaction_type', name='_user_target_interaction_uc'),)
