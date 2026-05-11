from firebase_admin import firestore
import time
from typing import List

try:
    db = firestore.client()
except Exception:
    db = None

class CommunityService:
    @staticmethod
    async def create_post(uid: str, caption: str, image_urls: List[str]):
        post_data = {
            "author_id": uid,
            "caption": caption,
            "image_urls": image_urls,
            "likes_count": 0,
            "comments_count": 0,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection("posts").document()
        doc_ref.set(post_data)
        
        return {**post_data, "id": doc_ref.id, "created_at": str(time.time())}

    @staticmethod
    async def get_feed(limit: int = 20):
        posts_ref = db.collection("posts").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        docs = posts_ref.stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append({**data, "id": doc.id, "created_at": str(data.get("created_at"))})
        return results

    @staticmethod
    async def toggle_like(post_id: str, uid: str):
        like_ref = db.collection("posts").document(post_id).collection("likes").document(uid)
        post_ref = db.collection("posts").document(post_id)
        
        doc = like_ref.get()
        if doc.exists:
            like_ref.delete()
            post_ref.update({"likes_count": firestore.Increment(-1)})
            return {"status": "unliked"}
        else:
            like_ref.set({"created_at": firestore.SERVER_TIMESTAMP})
            post_ref.update({"likes_count": firestore.Increment(1)})
            return {"status": "liked"}

    @staticmethod
    async def add_comment(post_id: str, uid: str, text: str):
        comment_data = {
            "author_id": uid,
            "text": text,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        db.collection("posts").document(post_id).collection("comments").add(comment_data)
        db.collection("posts").document(post_id).update({"comments_count": firestore.Increment(1)})
        
        return {"message": "Comment added"}
