from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid
from fastapi import HTTPException
from api.models.marketplace import MarketplaceListing, CartItem, Order, OrderItem
from api.schemas.marketplace import ListingCreate, CartItemAdd, CheckoutRequest

class MarketplaceService:
    @staticmethod
    async def get_active_listings(db: AsyncSession):
        result = await db.execute(select(MarketplaceListing).where(MarketplaceListing.status == "ACTIVE"))
        return result.scalars().all()

    @staticmethod
    async def get_listing_by_id(listing_id: uuid.UUID, db: AsyncSession):
        result = await db.execute(select(MarketplaceListing).where(MarketplaceListing.id == listing_id))
        listing = result.scalars().first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return listing

    @staticmethod
    async def create_listing(listing_in: ListingCreate, uid: str, db: AsyncSession):
        user_uuid = MarketplaceService._get_uuid(uid)
        new_listing = MarketplaceListing(
            seller_id=user_uuid,
            **listing_in.dict()
        )
        db.add(new_listing)
        await db.commit()
        await db.refresh(new_listing)
        return new_listing

    @staticmethod
    async def add_to_cart(item_in: CartItemAdd, uid: str, db: AsyncSession):
        user_uuid = MarketplaceService._get_uuid(uid)
        new_item = CartItem(
            buyer_id=user_uuid,
            listing_id=item_in.listing_id,
            quantity=item_in.quantity
        )
        db.add(new_item)
        await db.commit()
        return {"message": "Added to cart"}

    @staticmethod
    async def get_user_cart(uid: str, db: AsyncSession):
        user_uuid = MarketplaceService._get_uuid(uid)
        result = await db.execute(select(CartItem).where(CartItem.buyer_id == user_uuid))
        return result.scalars().all()

    @staticmethod
    async def process_checkout(checkout_in: CheckoutRequest, uid: str, db: AsyncSession):
        user_uuid = MarketplaceService._get_uuid(uid)

        # 1. Get cart items
        result = await db.execute(select(CartItem).where(CartItem.buyer_id == user_uuid))
        cart_items = result.scalars().all()
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # 2. Calculate total and prepare order items
        total = 0
        order_items_data = []
        for item in cart_items:
            listing_res = await db.execute(select(MarketplaceListing).where(MarketplaceListing.id == item.listing_id))
            listing = listing_res.scalars().first()
            if listing:
                total += listing.price_per_unit * item.quantity
                order_items_data.append({
                    "listing_id": item.listing_id,
                    "quantity": item.quantity,
                    "price_at_purchase": listing.price_per_unit
                })

        # 3. Create Order
        new_order = Order(
            buyer_id=user_uuid,
            total_price=total,
            delivery_address=checkout_in.delivery_address
        )
        db.add(new_order)
        await db.flush()

        # 4. Create Order Items
        for item_data in order_items_data:
            db.add(OrderItem(order_id=new_order.id, **item_data))

        # 5. Clear Cart
        await db.execute(delete(CartItem).where(CartItem.buyer_id == user_uuid))
        
        await db.commit()
        return {"order_id": new_order.id, "total": total}

    @staticmethod
    def _get_uuid(uid: str):
        try:
            return uuid.UUID(uid)
        except:
            return uuid.uuid5(uuid.NAMESPACE_DNS, uid)
