import asyncio
import asyncpg
import os
import sys
from dotenv import load_dotenv

# Load from service-users/.env
load_dotenv("service-users/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in service-users/.env")
    sys.exit(1)

# Ensure we use the correct driver for asyncpg if it has a prefix
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def clear_neon():
    print(f"Connecting to Neon DB...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Wiping database (dropping and recreating 'public' schema)...")
        
        # This is the most complete way to clear all tables, types, and indexes
        await conn.execute("DROP SCHEMA public CASCADE")
        await conn.execute("CREATE SCHEMA public")
        await conn.execute("GRANT ALL ON SCHEMA public TO public")
        await conn.execute("COMMENT ON SCHEMA public IS 'standard public schema'")
        
        print("Neon DB cleared successfully.")
        await conn.close()
    except Exception as e:
        print(f"Error clearing Neon DB: {e}")

if __name__ == "__main__":
    asyncio.run(clear_neon())
