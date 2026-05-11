import asyncio
import os
import sys
import json
from firebase_admin import auth, credentials, initialize_app
import firebase_admin

# Add service-users path to import models and services
sys.path.append(os.path.join(os.getcwd(), "backend", "service-users"))

from api.db.session import engine
from api.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("backend/service-users/firebase-credentials.json")
    initialize_app(cred)

async def ensure_user(db, email, password, full_name, role):
    # 1. Ensure in Firebase
    try:
        user = auth.get_user_by_email(email)
        print(f"User {email} already exists in Firebase. Updating password...")
        auth.update_user(user.uid, password=password)
        firebase_uid = user.uid
    except auth.UserNotFoundError:
        print(f"Creating user {email} in Firebase...")
        user = auth.create_user(email=email, password=password, display_name=full_name)
        auth.set_custom_user_claims(user.uid, {"role": role})
        firebase_uid = user.uid
    except Exception as e:
        print(f"Firebase error for {email}: {e}")
        return

    # 2. Ensure in Postgres
    result = await db.execute(select(User).where(User.email == email))
    db_user = result.scalars().first()
    
    if db_user:
        print(f"User {email} already exists in DB. Updating UID and role...")
        db_user.firebase_uid = firebase_uid
        db_user.role = role
        db_user.full_name = full_name
    else:
        print(f"Creating user {email} in DB...")
        db_user = User(
            email=email,
            firebase_uid=firebase_uid,
            full_name=full_name,
            role=role,
            is_active=True
        )
        db.add(db_user)
    
    await db.commit()
    print(f"User {email} synchronized successfully.")

async def main():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        users = [
            ("farmer@test.com", "Password123!", "Test Farmer", "FARMER"),
            ("buyer@test.com", "Password123!", "Test Buyer", "BUYER"),
            ("admin@test.com", "Password123!", "Test Admin", "ADMIN"),
            ("verify@test.com", "Password123!", "Test Verifier", "FARMER"),
        ]
        for email, password, name, role in users:
            await ensure_user(db, email, password, name, role)
    
    # Dispose engine to close all connections
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
