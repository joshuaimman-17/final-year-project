import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://")

async def reset():
    conn = await asyncpg.connect(DATABASE_URL)
    print("Dropping stale tables and types...")
    await conn.execute("DROP TABLE IF EXISTS expert_recommendations CASCADE")
    await conn.execute("DROP TABLE IF EXISTS ai_diagnosis_results CASCADE")
    await conn.execute("DROP TABLE IF EXISTS diagnoses CASCADE")
    await conn.execute("DROP TYPE IF EXISTS diagnosisstatus CASCADE")
    await conn.execute("DROP TYPE IF EXISTS severity CASCADE")
    print("Done. Re-run init_db.py to recreate.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(reset())
