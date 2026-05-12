import uuid
import hashlib
from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.orm import selectinload
from api.db.session import get_db
from api.core.security import verify_token
from api.models.marketplace import Listing, Order, OrderItem, OrderStatus, ListingStatus
from api.schemas.marketplace import OrderCreate, OrderRead

router = APIRouter()

def _get_user_id(token: dict) -> uuid.UUID:
    """
    Returns the Postgres User UUID. 
    Prioritizes 'db_id' from custom claims. 
    Falls back to hashing the Firebase UID for legacy items.
    """
    db_id = token.get("db_id")
    if db_id:
        try:
            return uuid.UUID(db_id)
        except ValueError:
            pass
    
    # Legacy fallback
    uid = token.get("uid")
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.post("/orders", response_model=OrderRead)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Creates an order with inventory locking.
    Logic:
    1. Validate availability for all items.
    2. Atomic decrement of inventory.
    3. Create Order and OrderItems.
    """
    buyer_id = _get_user_id(token)
    
    total_amount = Decimal("0.00")
    order_items = []
    seller_id = None
    
    # 1. & 2. Validate and Lock Inventory
    for item in payload.items:
        result = await db.execute(select(Listing).where(Listing.id == item.listing_id))
        listing = result.scalars().first()
        
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {item.listing_id} not found")
        
        if listing.available_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient inventory for {listing.crop_name}")
            
        if not seller_id:
            seller_id = listing.farmer_id
            
        # Atomic Update
        await db.execute(
            update(Listing)
            .where(Listing.id == listing.id, Listing.available_quantity >= item.quantity)
            .values(available_quantity=Listing.available_quantity - item.quantity)
        )
        
        item_total = listing.price_per_unit * Decimal(str(item.quantity))
        total_amount += item_total
        
        order_items.append(OrderItem(
            listing_id=listing.id,
            quantity=item.quantity,
            price_at_purchase=listing.price_per_unit
        ))

    # 3. Create Order
    platform_fee = total_amount * Decimal("0.05") # 5% Platform Fee
    
    new_order = Order(
        buyer_id=buyer_id,
        buyer_name=payload.buyer_name,
        seller_id=seller_id,
        total_amount=total_amount,
        platform_fee=platform_fee,
        status=OrderStatus.PLACED.value, # Simulating successful payment for now
        shipping_address=payload.shipping_address,
        items=order_items
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    # Refresh to include items in response
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == new_order.id))
    return result.scalars().first()

@router.get("/orders/seller", response_model=List[OrderRead])
async def get_seller_orders(
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Retrieve orders where the current user is the seller."""
    user_id = _get_user_id(token)
    legacy_id = uuid.UUID(hashlib.md5(token["uid"].encode()).hexdigest())
    
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where((Order.seller_id == user_id) | (Order.seller_id == legacy_id))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    # Normalize IDs for the frontend
    for o in orders:
        if o.seller_id == legacy_id:
            o.seller_id = user_id
            
    return orders

@router.get("/orders/history", response_model=List[OrderRead])
async def get_order_history(
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Retrieve order history for the current user (as buyer or seller)."""
    user_id = _get_user_id(token)
    legacy_id = uuid.UUID(hashlib.md5(token["uid"].encode()).hexdigest())
    
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            (Order.buyer_id == user_id) | 
            (Order.seller_id == user_id) |
            (Order.buyer_id == legacy_id) |
            (Order.seller_id == legacy_id)
        )
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()

@router.get("/orders/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Retrieve order details."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: uuid.UUID,
    status: OrderStatus = Body(...),
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Update order status (e.g., mark as SHIPPED)."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = status.value
    await db.commit()
    return {"status": "updated", "new_status": status.value}
