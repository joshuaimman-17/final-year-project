from api.services.chat_service import ChatService
from api.schemas.chat import ConversationCreate, MessageCreate

class ChatController:
    @staticmethod
    async def create_conversation(conv_in: ConversationCreate, uid: str):
        return await ChatService.create_conversation(uid, conv_in.target_user_id)

    @staticmethod
    async def get_conversations(uid: str):
        return await ChatService.get_user_conversations(uid)

    @staticmethod
    async def send_message(conversation_id: str, msg_in: MessageCreate, uid: str):
        return await ChatService.send_message(
            conversation_id, 
            uid, 
            msg_in.content, 
            msg_in.attachment_url
        )
