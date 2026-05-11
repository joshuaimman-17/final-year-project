import uuid
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from api.db.session import get_db
from api.core.security import verify_token
from api.models.marketplace import Order, Review, OrderStatus
from api.schemas.marketplace import ReviewCreate, ReviewRead

router = APIRouter()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.post("/orders/{order_id}/reviews", response_model=ReviewRead)
async def create_review(
    order_id: uuid.UUID,
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Creates a review for a completed order.
    Only the buyer can review after DELIVERED status.
    """
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    # 1. Validate Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if str(order.buyer_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Only the buyer can review the order")
        
    if order.status not in [OrderStatus.DELIVERED.value, OrderStatus.COMPLETED.value]:
        raise HTTPException(status_code=400, detail="Order must be delivered before reviewing")

    # 2. Check for existing review
    result = await db.execute(select(Review).where(Review.order_id == order_id))
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Review already exists for this order")

    # 3. Create Review
    review = Review(
        order_id=order_id,
        author_id=user_id,
        target_user_id=order.seller_id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

@router.get("/users/{user_id}/reviews", response_model=List[ReviewRead])
async def get_user_reviews(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Fetch all reviews for a specific seller."""
    result = await db.execute(select(Review).where(Review.target_user_id == user_id))
    return result.scalars().all()
