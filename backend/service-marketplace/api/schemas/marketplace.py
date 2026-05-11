import uuid
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal

# ─── Listing Schemas ────────────────────────────────────────────────────────

class ListingBase(BaseModel):
    farm_id: uuid.UUID
    crop_name: str
    category: str = "OTHER"
    price_per_unit: Decimal
    unit: str = "KG"
    available_quantity: float
    is_organic: bool = False
    image_urls: List[str] = []

class ListingCreate(ListingBase):
    pass

class ListingRead(ListingBase):
    id: uuid.UUID
    farmer_id: uuid.UUID
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ─── Order Schemas ──────────────────────────────────────────────────────────

class OrderItemBase(BaseModel):
    listing_id: uuid.UUID
    quantity: float

class OrderCreate(BaseModel):
    items: List[OrderItemBase]
    shipping_address: Dict[str, str] # {street, city, state, zip}
    payment_method_id: str

class OrderItemRead(OrderItemBase):
    id: uuid.UUID
    price_at_purchase: Decimal
    
    model_config = ConfigDict(from_attributes=True)

class OrderRead(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    total_amount: Decimal
    platform_fee: Decimal
    status: str
    shipping_address: Dict[str, str]
    created_at: datetime
    items: List[OrderItemRead]
    
    model_config = ConfigDict(from_attributes=True)

# ─── Review Schemas ─────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    author_id: uuid.UUID
    target_user_id: uuid.UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
