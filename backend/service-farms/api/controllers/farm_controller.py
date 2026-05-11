from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from api.services.farm_service import FarmService
from api.schemas.farm import FarmCreate, FieldCreate, CropCycleCreate

class FarmController:
    # --- Farm Methods ---
    @staticmethod
    async def create_farm(farm_in: FarmCreate, uid: str, db: AsyncSession):
        return await FarmService.create_farm(farm_in, uid, db)

    @staticmethod
    async def list_farms(uid: str, db: AsyncSession):
        return await FarmService.list_user_farms(uid, db)

    @staticmethod
    async def get_farm(farm_id: uuid.UUID, db: AsyncSession):
        return await FarmService.get_farm_by_id(farm_id, db)

    # --- Field Methods ---
    @staticmethod
    async def create_field(field_in: FieldCreate, db: AsyncSession):
        return await FarmService.create_field(field_in, db)
        
    @staticmethod
    async def start_crop_cycle(field_id: uuid.UUID, cycle_in: CropCycleCreate, db: AsyncSession):
        return await FarmService.start_crop_cycle(field_id, cycle_in, db)

    @staticmethod
    async def get_field_summary(field_id: uuid.UUID, db: AsyncSession):
        return await FarmService.get_field_summary(field_id, db)

    @staticmethod
    async def get_field_weather(field_id: uuid.UUID, db: AsyncSession):
        return await FarmService.get_field_weather(field_id, db)

    @staticmethod
    async def get_soil_history(field_id: uuid.UUID, db: AsyncSession):
        return await FarmService.get_soil_history(field_id, db)

    @staticmethod
    async def get_satellite_gallery(field_id: uuid.UUID, db: AsyncSession):
        return await FarmService.get_satellite_gallery(field_id, db)
