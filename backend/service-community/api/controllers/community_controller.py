from api.services.community_service import CommunityService
from api.schemas.community import PostCreate, CommentCreate

class CommunityController:
    @staticmethod
    async def create_post(post_in: PostCreate, uid: str):
        return await CommunityService.create_post(uid, post_in.caption, post_in.image_urls)

    @staticmethod
    async def get_feed(limit: int):
        return await CommunityService.get_feed(limit)

    @staticmethod
    async def toggle_like(post_id: str, uid: str):
        return await CommunityService.toggle_like(post_id, uid)

    @staticmethod
    async def add_comment(post_id: str, comment_in: CommentCreate, uid: str):
        return await CommunityService.add_comment(post_id, uid, comment_in.text)
