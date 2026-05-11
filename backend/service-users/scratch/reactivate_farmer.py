import asyncio
from api.db.session import AsyncSessionLocal
from api.models.user import User
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == 'farmer@test.com'))
        user = res.scalars().first()
        if user:
            user.is_active = True
            await db.commit()
            print("Farmer Reactivated")
        else:
            print("Farmer not found")

if __name__ == "__main__":
    asyncio.run(run())
