from google.cloud import firestore
from datetime import datetime
from api.core.firebase import get_firestore_db

class FirestoreChatService:
    def __init__(self):
        self.db = get_firestore_db()

    async def update_presence(self, user_id: str, status: str):
        ref = self.db.collection("presence").document(user_id)
        ref.set({
            "user_id": user_id,
            "status": status,
            "last_seen": datetime.utcnow()
        })

    async def get_presence(self, user_id: str) -> dict:
        doc = self.db.collection("presence").document(user_id).get()
        return doc.to_dict() if doc.exists else None

    async def initiate_room(self, participants: list, is_group: bool = False, metadata: dict = None) -> str:
        # For 1:1, check if already exists
        if not is_group and len(participants) == 2:
            existing = self.db.collection("chat_rooms")\
                .where("is_group", "==", False)\
                .where("participants", "array_contains", participants[0])\
                .stream()
            for doc in existing:
                room_data = doc.to_dict()
                if set(room_data["participants"]) == set(participants):
                    return doc.id

        doc_ref = self.db.collection("chat_rooms").document()
        room_data = {
            "id": doc_ref.id,
            "is_group": is_group,
            "participants": participants,
            "admins": [participants[0]] if is_group else [],
            "metadata": metadata or {},
            "last_message": None,
            "updated_at": datetime.utcnow()
        }
        doc_ref.set(room_data)
        return doc_ref.id

    async def send_message(self, room_id: str, sender_id: str, text: str, msg_type: str = "TEXT", attachment_url: str = None) -> str:
        room_ref = self.db.collection("chat_rooms").document(room_id)
        msg_ref = room_ref.collection("messages").document()
        
        msg_data = {
            "id": msg_ref.id,
            "sender_id": sender_id,
            "text": text,
            "type": msg_type,
            "reactions": {},
            "attachment_url": attachment_url,
            "is_seen": False,
            "timestamp": datetime.utcnow()
        }
        
        batch = self.db.batch()
        batch.set(msg_ref, msg_data)
        batch.update(room_ref, {
            "last_message": {
                "text": text[:50],
                "sender_id": sender_id,
                "timestamp": msg_data["timestamp"]
            },
            "updated_at": msg_data["timestamp"]
        })
        batch.commit()
        
        return msg_ref.id

    async def add_reaction(self, room_id: str, message_id: str, user_id: str, emoji: str, action: str):
        msg_ref = self.db.collection("chat_rooms").document(room_id).collection("messages").document(message_id)
        
        doc = msg_ref.get()
        if not doc.exists: return
        
        reactions = doc.to_dict().get("reactions", {})
        users = reactions.get(emoji, [])
        
        if action == "ADD":
            if user_id not in users: users.append(user_id)
        else:
            if user_id in users: users.remove(user_id)
            
        reactions[emoji] = users
        msg_ref.update({"reactions": reactions})

    async def create_broadcast(self, sender_id: str, recipient_ids: list, content: dict) -> str:
        doc_ref = self.db.collection("broadcasts").document()
        doc_ref.set({
            "id": doc_ref.id,
            "sender_id": sender_id,
            "recipient_ids": recipient_ids,
            "content": content,
            "sent_at": datetime.utcnow(),
            "status": "SENDING"
        })
        return doc_ref.id
