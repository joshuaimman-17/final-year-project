import asyncio
from api.db.session import engine, Base
from sqlalchemy import text

async def reset_db():
    print("Dropping Marketplace Service tables...")
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS reviews CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS order_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS orders CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS listings CASCADE"))
    print("Done!")

if __name__ == "__main__":
    asyncio.run(reset_db())
