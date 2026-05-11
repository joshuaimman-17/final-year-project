from fastapi import APIRouter, Depends, HTTPException
from api.core.security import get_current_user_uid
from api.schemas.chat import ConversationCreate, MessageCreate
from api.controllers.chat_controller import ChatController

router = APIRouter(tags=["chat"])

@router.post("/conversations")
async def create_conversation(conv_in: ConversationCreate, uid: str = Depends(get_current_user_uid)):
    return await ChatController.create_conversation(conv_in, uid)

@router.get("/conversations")
async def get_conversations(uid: str = Depends(get_current_user_uid)):
    return await ChatController.get_conversations(uid)

@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, msg_in: MessageCreate, uid: str = Depends(get_current_user_uid)):
    return await ChatController.send_message(conversation_id, msg_in, uid)



