import asyncio
from api.db.session import engine, Base
from sqlalchemy import text

async def reset_db():
    print("Dropping stale Community Service tables...")
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS follows CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS user_interactions CASCADE"))
    print("Done. Re-run init_db.py to recreate.")

if __name__ == "__main__":
    asyncio.run(reset_db())
