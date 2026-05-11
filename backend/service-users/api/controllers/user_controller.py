from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from api.services.user_service import UserService
from api.schemas.user import (
    UserCreate, UserLogin, UserRead, TokenResponse, UserUpdate,
    ExpertProfileCreate, ExpertProfileRead, ExpertReview
)

class UserController:
    @staticmethod
    async def register(user_in: UserCreate, db: AsyncSession):
        result = await UserService.register_user(user_in, db)
        return TokenResponse(
            access_token=result["access_token"],
            user=UserRead.model_validate(result["user"])
        )

    @staticmethod
    async def login(login_in: UserLogin, db: AsyncSession):
        result = await UserService.login_user(login_in, db)
        return TokenResponse(
            access_token=result["access_token"],
            user=UserRead.model_validate(result["user"])
        )

    @staticmethod
    async def forgot_password(email: str):
        return await UserService.forgot_password(email)

    @staticmethod
    async def get_me(decoded_token: dict, db: AsyncSession):
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        full_name = decoded_token.get("name", email.split("@")[0])
        avatar_url = decoded_token.get("picture")
        
        user = await UserService.get_or_create_from_firebase(
            firebase_uid=firebase_uid,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            db=db
        )
        return UserRead.model_validate(user)

    @staticmethod
    async def update_profile(email: str, user_update: UserUpdate, db: AsyncSession):
        user = await UserService.update_user(email, user_update, db)
        return UserRead.model_validate(user)

    @staticmethod
    async def expert_apply(user_id: uuid.UUID, profile_in: ExpertProfileCreate, db: AsyncSession):
        profile = await UserService.apply_for_expert(user_id, profile_in, db)
        return ExpertProfileRead.model_validate(profile)

    @staticmethod
    async def follow(follower_id: uuid.UUID, following_id: uuid.UUID, db: AsyncSession):
        return await UserService.follow_user(follower_id, following_id, db)

    @staticmethod
    async def unfollow(follower_id: uuid.UUID, following_id: uuid.UUID, db: AsyncSession):
        return await UserService.unfollow_user(follower_id, following_id, db)

    @staticmethod
    async def get_followers(user_id: uuid.UUID, db: AsyncSession):
        users = await UserService.get_followers(user_id, db)
        return [UserRead.model_validate(u) for u in users]

    @staticmethod
    async def get_experts(specialization: str, db: AsyncSession):
        users = await UserService.get_approved_experts(specialization, db)
        return [UserRead.model_validate(u) for u in users]

    @staticmethod
    async def deactivate(user_id: uuid.UUID, db: AsyncSession):
        return await UserService.deactivate_account(user_id, db)

    # Administrative
    @staticmethod
    async def list_pending_experts(db: AsyncSession):
        profiles = await UserService.get_pending_experts(db)
        return [ExpertProfileRead.model_validate(p) for p in profiles]

    @staticmethod
    async def verify_expert(target_user_id: uuid.UUID, admin_id: uuid.UUID, review: ExpertReview, db: AsyncSession):
        return await UserService.verify_expert(target_user_id, admin_id, review, db)

    @staticmethod
    async def toggle_status(user_id: uuid.UUID, db: AsyncSession):
        return await UserService.toggle_user_status(user_id, db)

