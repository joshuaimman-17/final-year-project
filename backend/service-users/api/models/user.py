from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Text, Uuid
import uuid
from datetime import datetime
import enum
from api.db.session import Base

class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    EXPERT = "EXPERT"
    BUYER = "BUYER"
    ADMIN = "ADMIN"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True)
    full_name = Column(String, nullable=False)
    avatar_url = Column(String)
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    trust_score = Column(String, default="0.0") # Aggregated rating placeholder
    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    license_number = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    credentials_url = Column(String)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    rejection_reason = Column(Text)
    verified_at = Column(DateTime)
    verified_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))

class Follows(Base):
    __tablename__ = "follows"

    follower_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    following_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

