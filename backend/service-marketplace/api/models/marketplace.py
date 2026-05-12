import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Float, Boolean, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from api.db.session import Base

class CropCategory(str, enum.Enum):
    CEREALS    = "CEREALS"
    VEGETABLES = "VEGETABLES"
    FRUITS     = "FRUITS"
    PULSES     = "PULSES"
    OTHER      = "OTHER"

class WeightUnit(str, enum.Enum):
    KG      = "KG"
    QUINTAL = "QUINTAL"
    TON     = "TON"

class ListingStatus(str, enum.Enum):
    ACTIVE   = "ACTIVE"
    SOLD_OUT = "SOLD_OUT"
    ARCHIVED = "ARCHIVED"

class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PLACED          = "PLACED"
    CONFIRMED       = "CONFIRMED"
    SHIPPED         = "SHIPPED"
    DELIVERED       = "DELIVERED"
    COMPLETED       = "COMPLETED"
    CANCELLED       = "CANCELLED"
    RETURNED        = "RETURNED"

class Listing(Base):
    __tablename__ = "listings"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id          = Column(UUID(as_uuid=True), nullable=False, index=True)
    farm_id            = Column(UUID(as_uuid=True), nullable=False, index=True)
    crop_name          = Column(String, nullable=False)
    category           = Column(String, default=CropCategory.OTHER.value)
    price_per_unit     = Column(Numeric(12, 2), nullable=False)
    unit               = Column(String, default=WeightUnit.KG.value)
    available_quantity = Column(Float, nullable=False)
    status             = Column(String, default=ListingStatus.ACTIVE.value)
    is_organic         = Column(Boolean, default=False)
    image_urls         = Column(ARRAY(String), default=[])
    created_at         = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id         = Column(UUID(as_uuid=True), nullable=False, index=True)
    buyer_name       = Column(String, nullable=True) # Cached for easy display
    seller_id        = Column(UUID(as_uuid=True), nullable=False, index=True)
    total_amount     = Column(Numeric(12, 2), nullable=False)
    platform_fee     = Column(Numeric(10, 2), nullable=False)
    status           = Column(String, default=OrderStatus.PENDING_PAYMENT.value)
    shipping_address = Column(JSON, nullable=False) # {street, city, state, zip}
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id          = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    listing_id        = Column(UUID(as_uuid=True), nullable=False)
    quantity          = Column(Float, nullable=False)
    price_at_purchase = Column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")

class Review(Base):
    __tablename__ = "reviews"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id       = Column(UUID(as_uuid=True), nullable=False, unique=True)
    author_id      = Column(UUID(as_uuid=True), nullable=False)
    target_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    rating         = Column(Integer, nullable=False) # 1-5
    comment        = Column(Text)
    created_at     = Column(DateTime, default=datetime.utcnow)
