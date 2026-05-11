from firebase_admin import firestore
import time
import os

try:
    db = firestore.client()
except Exception:
    db = None

# Mock/Real Pusher initialization could go here or in a separate core file
# For now, keeping it here for simplicity as per existing code
pusher_client = None

class ChatService:
    @staticmethod
    async def create_conversation(uid: str, target_user_id: str):
        conv_data = {
            "participants": [uid, target_user_id],
            "created_at": firestore.SERVER_TIMESTAMP,
            "last_message": ""
        }
        
        doc_ref = db.collection("conversations").document()
        doc_ref.set(conv_data)
        
        return {"id": doc_ref.id, **conv_data}

    @staticmethod
    async def get_user_conversations(uid: str):
        convs_ref = db.collection("conversations").where("participants", "array_contains", uid)
        docs = convs_ref.stream()
        
        results = []
        for doc in docs:
            results.append({**doc.to_dict(), "id": doc.id})
        return results

    @staticmethod
    async def send_message(conversation_id: str, uid: str, content: str, attachment_url: str = None):
        msg_data = {
            "sender_id": uid,
            "content": content,
            "attachment_url": attachment_url,
            "sent_at": firestore.SERVER_TIMESTAMP
        }
        
        # 1. Write to Firestore
        db.collection("conversations").document(conversation_id).collection("messages").add(msg_data)
        db.collection("conversations").document(conversation_id).update({
            "last_message": content,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        
        # 2. Ping Pusher for real-time update
        if pusher_client:
            try:
                pusher_client.trigger(f"chat_{conversation_id}", "new-message", {
                    "sender_id": uid,
                    "content": content,
                    "sent_at": str(time.time())
                })
            except Exception as e:
                print(f"Pusher error: {e}")

        return {"status": "sent"}
