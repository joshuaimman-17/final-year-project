from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from firebase_admin import auth, firestore
import httpx
import os
import uuid
from datetime import datetime
from fastapi import HTTPException
from api.models.user import User, ExpertProfile, Follows, UserRole, VerificationStatus
from api.schemas.user import (
    UserCreate, UserLogin, UserRead, UserUpdate, 
    ExpertProfileCreate, ExpertReview, ExpertProfileRead
)

FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")

class UserService:
    @staticmethod
    def get_firestore_client():
        return firestore.client()

    @staticmethod
    async def sync_user_to_firestore(user: User, db_session: AsyncSession = None):
        """Syncs user metadata and role to Firestore for UI updates."""
        try:
            fs_db = UserService.get_firestore_client()
            user_ref = fs_db.collection("users").document(user.firebase_uid)
            
            user_data = {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "trust_score": user.trust_score,
                "last_active_at": user.last_active_at,
                "is_active": user.is_active
            }
            user_ref.set(user_data, merge=True)
        except Exception as e:
            print(f"Firestore Sync Warning: {e}")

    @staticmethod
    async def register_user(user_in: UserCreate, db: AsyncSession):
        # 1. Create Firebase User
        try:
            fb_user = auth.create_user(
                email=user_in.email,
                password=user_in.password,
                display_name=user_in.full_name
            )
            # Set custom claims for role
            auth.set_custom_user_claims(fb_user.uid, {"role": user_in.role})
            firebase_uid = fb_user.uid
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Firebase registration failed: {str(e)}")

        # 2. Save to Postgres
        new_user = User(
            firebase_uid=firebase_uid,
            email=user_in.email,
            full_name=user_in.full_name,
            role=user_in.role,
            avatar_url=user_in.avatar_url,
            phone=user_in.phone
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 3. Sync to Firestore
        await UserService.sync_user_to_firestore(new_user)

        # 4. Get JWT
        token_data = await UserService._get_firebase_token(user_in.email, user_in.password)
        
        return {
            "access_token": token_data["idToken"],
            "user": new_user
        }

    @staticmethod
    async def login_user(login_in: UserLogin, db: AsyncSession):
        token_data = await UserService._get_firebase_token(login_in.email, login_in.password)

        # Get user from DB
        result = await db.execute(select(User).where(User.email == login_in.email))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        # Update last active
        db_user.last_active_at = datetime.utcnow()
        await db.commit()

        return {
            "access_token": token_data["idToken"],
            "user": db_user
        }

    @staticmethod
    async def forgot_password(email: str):
        async with httpx.AsyncClient() as client:
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={FIREBASE_API_KEY}"
            resp = await client.post(url, json={
                "email": email,
                "requestType": "PASSWORD_RESET"
            })
            if resp.status_code != 200:
                error_msg = resp.json().get("error", {}).get("message", "Failed to send reset email")
                raise HTTPException(status_code=400, detail=f"Firebase Error: {error_msg}")
            return resp.json()

    @staticmethod
    async def get_user_by_email(email: str, db: AsyncSession):
        result = await db.execute(select(User).where(User.email == email))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Profile not found")
        return db_user

    @staticmethod
    async def get_or_create_from_firebase(firebase_uid: str, email: str, full_name: str, avatar_url: str = None, role: str = UserRole.FARMER, db: AsyncSession = None):
        result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
        user = result.scalars().first()
        if not user:
            # Lazy Onboarding
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                role=role
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            await UserService.sync_user_to_firestore(user)
        return user

    @staticmethod
    async def update_user(email: str, user_update: UserUpdate, db: AsyncSession):
        db_user = await UserService.get_user_by_email(email, db)
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        await db.commit()
        await db.refresh(db_user)
        
        # Sync to Firestore
        await UserService.sync_user_to_firestore(db_user)
        return db_user

    @staticmethod
    async def apply_for_expert(user_id: uuid.UUID, profile_in: ExpertProfileCreate, db: AsyncSession):
        # Check if already applied
        result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == user_id))
        existing = result.scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Expert application already exists")

        new_profile = ExpertProfile(
            user_id=user_id,
            license_number=profile_in.license_number,
            specialization=profile_in.specialization,
            credentials_url=profile_in.credentials_url,
            verification_status=VerificationStatus.PENDING
        )
        db.add(new_profile)
        await db.commit()
        return new_profile

    @staticmethod
    async def follow_user(follower_id: uuid.UUID, following_id: uuid.UUID, db: AsyncSession):
        if follower_id == following_id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
            
        follow = Follows(follower_id=follower_id, following_id=following_id)
        db.add(follow)
        try:
            await db.commit()
            # Update follower counts in Firestore (optional but nice)
            user_res = await db.execute(select(User).where(User.id == follower_id))
            user = user_res.scalars().first()
            await UserService.sync_user_to_firestore(user)
        except:
            raise HTTPException(status_code=400, detail="Already following this user")
        return {"status": "followed"}

    @staticmethod
    async def unfollow_user(follower_id: uuid.UUID, following_id: uuid.UUID, db: AsyncSession):
        await db.execute(delete(Follows).where(
            Follows.follower_id == follower_id,
            Follows.following_id == following_id
        ))
        await db.commit()
        
        user_res = await db.execute(select(User).where(User.id == follower_id))
        user = user_res.scalars().first()
        await UserService.sync_user_to_firestore(user)
        
        return {"status": "unfollowed"}

    @staticmethod
    async def get_followers(user_id: uuid.UUID, db: AsyncSession):
        result = await db.execute(select(User).join(Follows, User.id == Follows.follower_id).where(Follows.following_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def get_approved_experts(specialization: str, db: AsyncSession):
        query = select(User).join(ExpertProfile, User.id == ExpertProfile.user_id).where(ExpertProfile.verification_status == VerificationStatus.APPROVED)
        if specialization:
            query = query.where(ExpertProfile.specialization == specialization)
        result = await db.execute(query)
        return result.scalars().all()

    # Administrative Methods
    @staticmethod
    async def get_pending_experts(db: AsyncSession):
        result = await db.execute(select(ExpertProfile).where(ExpertProfile.verification_status == VerificationStatus.PENDING))
        return result.scalars().all()

    @staticmethod
    async def verify_expert(target_user_id: uuid.UUID, admin_id: uuid.UUID, review: ExpertReview, db: AsyncSession):
        result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == target_user_id))
        profile = result.scalars().first()
        if not profile:
            raise HTTPException(status_code=404, detail="Expert profile not found")

        profile.verification_status = review.status
        profile.rejection_reason = review.reason
        profile.verified_at = datetime.utcnow()
        profile.verified_by = admin_id

        if review.status == VerificationStatus.APPROVED:
            # Atomic role promotion
            await db.execute(update(User).where(User.id == target_user_id).values(role=UserRole.EXPERT))
            
            # Sync to Firebase Auth Claims
            user_res = await db.execute(select(User).where(User.id == target_user_id))
            user = user_res.scalars().first()
            auth.set_custom_user_claims(user.firebase_uid, {"role": "EXPERT"})

            
            # Sync to Firestore
            await UserService.sync_user_to_firestore(user)

        await db.commit()
        return {"status": "updated"}

    @staticmethod
    async def deactivate_account(user_id: uuid.UUID, db: AsyncSession):
        # 1. Checks for active orders or pending diagnoses
        # This would normally be a cross-service call.
        # For now, we simulate the check.
        # In a real scenario, we'd use httpx to call other services.
        
        # Placeholder for cross-service check
        active_items = False # Should call Marketplace and Diagnostics
        
        if active_items:
            raise HTTPException(status_code=400, detail="Cannot deactivate account with active orders or pending diagnoses")

        # 2. Soft delete
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()
        if user:
            user.is_active = False
            await db.commit()
            await UserService.sync_user_to_firestore(user)
        
        return {"status": "deactivated"}

    @staticmethod
    async def toggle_user_status(user_id: uuid.UUID, db: AsyncSession):
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_active = not user.is_active
        await db.commit()
        await UserService.sync_user_to_firestore(user)
        return {"status": "updated", "is_active": user.is_active}

    @staticmethod
    async def _get_firebase_token(email: str, password: str):
        async with httpx.AsyncClient() as client:
            login_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
            resp = await client.post(login_url, json={
                "email": email,
                "password": password,
                "returnSecureToken": True
            })
            if resp.status_code != 200:
                error_msg = resp.json().get("error", {}).get("message", "Authentication failed")
                raise HTTPException(status_code=401, detail=f"Authentication failed: {error_msg}")
            return resp.json()

