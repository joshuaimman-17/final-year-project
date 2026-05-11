from sqlalchemy.ext.asyncio import AsyncSession
from api.services.marketplace_service import MarketplaceService
from api.schemas.marketplace import ListingCreate, CartItemAdd, CheckoutRequest

class MarketplaceController:
    @staticmethod
    async def get_listings(db: AsyncSession):
        return await MarketplaceService.get_active_listings(db)

    @staticmethod
    async def get_listing(listing_id: uuid.UUID, db: AsyncSession):
        return await MarketplaceService.get_listing_by_id(listing_id, db)

    @staticmethod
    async def create_listing(listing_in: ListingCreate, uid: str, db: AsyncSession):
        return await MarketplaceService.create_listing(listing_in, uid, db)

    @staticmethod
    async def add_to_cart(item_in: CartItemAdd, uid: str, db: AsyncSession):
        return await MarketplaceService.add_to_cart(item_in, uid, db)

    @staticmethod
    async def get_cart(uid: str, db: AsyncSession):
        return await MarketplaceService.get_user_cart(uid, db)

    @staticmethod
    async def checkout(checkout_in: CheckoutRequest, uid: str, db: AsyncSession):
        return await MarketplaceService.process_checkout(checkout_in, uid, db)
