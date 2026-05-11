import asyncio
import os
import sys

# Add current directory to path to import api
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.db.session import engine, Base
# Import models to register them with Base
from api.models.farm import Farm, Field

async def init_db():
    print("Creating Farms Service tables in Neon DB...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(init_db())
