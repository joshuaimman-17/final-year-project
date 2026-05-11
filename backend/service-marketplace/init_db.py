import asyncio
from api.db.session import engine, Base
from api.models import marketplace # registers models

async def init_db():
    print("Creating Marketplace Service tables in Neon DB...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(init_db())
