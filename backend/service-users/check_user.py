import asyncio
import os
import sys

# Add current directory to path so we can import api
sys.path.append(os.getcwd())

from api.db.session import engine
from api.models.user import User
from sqlalchemy import select

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(select(User))
        users = result.fetchall()
        print(f"Total users: {len(users)}")
        for user in users:
            print(f"- {user.email} ({user.role})")

if __name__ == "__main__":
    asyncio.run(check())
