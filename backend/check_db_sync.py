import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("service-users/.env")

async def check():
    url = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)
    try:
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        print("Tables in public schema:")
        for t in tables:
            print(f"- {t['table_name']}")
            
        users_count = await conn.fetchval("SELECT count(*) FROM users")
        print(f"\nUsers count: {users_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
