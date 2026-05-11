import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load from service-users/.env
load_dotenv("service-users/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found")
    exit(1)

if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def init_master():
    print("Re-creating master database schema from schema.sql...")
    
    with open("database/schema.sql", "r") as f:
        schema_sql = f.read()

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Executing schema.sql...")
        await conn.execute(schema_sql)
        print("Master schema created successfully.")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(init_master())
