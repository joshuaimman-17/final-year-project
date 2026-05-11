import uuid
import hashlib
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from api.db.session import get_db
from api.core.security import verify_token
from api.models.marketplace import Listing, ListingStatus
from api.schemas.marketplace import ListingCreate, ListingRead

router = APIRouter()

def _firebase_uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.UUID(hashlib.md5(uid.encode()).hexdigest())

@router.post("/listings", response_model=ListingRead)
async def create_listing(
    payload: ListingCreate,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Creates a new agricultural listing."""
    user_id = _firebase_uid_to_uuid(token["uid"])
    
    listing = Listing(
        farmer_id=user_id,
        farm_id=payload.farm_id,
        crop_name=payload.crop_name,
        category=payload.category,
        price_per_unit=payload.price_per_unit,
        unit=payload.unit,
        available_quantity=payload.available_quantity,
        is_organic=payload.is_organic,
        image_urls=payload.image_urls
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing

@router.get("/listings", response_model=List[ListingRead])
async def search_listings(
    crop: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Search for listings with various filters."""
    query = select(Listing).where(Listing.status == ListingStatus.ACTIVE.value)
    
    if crop:
        query = query.where(Listing.crop_name.ilike(f"%{crop}%"))
    if category:
        query = query.where(Listing.category == category)
    if min_price:
        query = query.where(Listing.price_per_unit >= min_price)
    if max_price:
        query = query.where(Listing.price_per_unit <= max_price)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/listings/{listing_id}", response_model=ListingRead)
async def get_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Fetch details of a specific listing."""
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
