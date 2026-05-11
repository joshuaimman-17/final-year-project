from google.cloud import firestore
from datetime import datetime
from api.core.firebase import get_firestore_db

class FirestoreService:
    def __init__(self):
        self.db = get_firestore_db()

    async def create_post(self, post_data: dict) -> str:
        doc_ref = self.db.collection("posts").document()
        post_data["id"] = doc_ref.id
        post_data["timestamp"] = datetime.utcnow()
        post_data["likes_count"] = 0
        post_data["comments_count"] = 0
        doc_ref.set(post_data)
        return doc_ref.id

    async def get_posts(self, district: str = None, state: str = None, limit: int = 20) -> list:
        query = self.db.collection("posts").order_by("timestamp", direction=firestore.Query.DESCENDING)
        
        if district and state:
            query = query.where("location_context.district", "==", district).where("location_context.state", "==", state)
        
        docs = query.limit(limit).stream()
        posts = []
        author_ids = set()
        
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            posts.append(data)
            if "author_id" in data:
                author_ids.add(data["author_id"])
        
        # Fetch author details from Firestore users collection
        authors = {}
        if author_ids:
            user_docs = self.db.collection("users").where("id", "in", list(author_ids)).stream()
            for udoc in user_docs:
                udata = udoc.to_dict()
                if "id" in udata:
                    authors[udata["id"]] = udata
        
        # Enrich posts with author info and normalize fields
        for post in posts:
            # Map author details
            author = authors.get(post.get("author_id"))
            if author:
                post["author_name"] = author.get("full_name", "Unknown User")
                post["author_role"] = author.get("role", "FARMER")
            else:
                post["author_name"] = "Unknown User"
                post["author_role"] = "FARMER"
            
            # Convert Firestore timestamp to ISO string for created_at
            ts = post.get("timestamp")
            if ts and hasattr(ts, 'isoformat'):
                post["created_at"] = ts.isoformat()
                post["timestamp"] = ts.isoformat()
            elif ts:
                post["created_at"] = str(ts)
                post["timestamp"] = str(ts)
            else:
                post["created_at"] = None
            
            # Set image_url from image_urls list
            image_urls = post.get("image_urls", [])
            post["image_url"] = image_urls[0] if image_urls else None
                
        return posts

    async def create_comment(self, post_id: str, comment_data: dict) -> str:
        # Atomic update and creation
        post_ref = self.db.collection("posts").document(post_id)
        comment_ref = post_ref.collection("comments").document()
        
        comment_data["id"] = comment_ref.id
        comment_data["timestamp"] = datetime.utcnow()
        comment_data["likes_count"] = 0
        comment_data["replies_count"] = 0
        
        # Transaction or Batch for consistency
        batch = self.db.batch()
        batch.set(comment_ref, comment_data)
        batch.update(post_ref, {"comments_count": firestore.Increment(1)})
        batch.commit()
        
        return comment_ref.id

    async def get_comments(self, post_id: str) -> list:
        post_ref = self.db.collection("posts").document(post_id)
        docs = post_ref.collection("comments").order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
        
        comments = []
        author_ids = set()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            comments.append(data)
            if "author_id" in data:
                author_ids.add(data["author_id"])

        # Fetch author details
        authors = {}
        if author_ids:
            user_docs = self.db.collection("users").where("id", "in", list(author_ids)).stream()
            for udoc in user_docs:
                udata = udoc.to_dict()
                if "id" in udata:
                    authors[udata["id"]] = udata

        # Enrich comments
        for comment in comments:
            author = authors.get(comment.get("author_id"))
            if author:
                comment["author_name"] = author.get("full_name", "Farmer")
                comment["author_role"] = author.get("role", "FARMER")
            else:
                comment["author_name"] = "Farmer"
                comment["author_role"] = "FARMER"

            # Convert timestamp to string
            ts = comment.get("timestamp")
            if ts and hasattr(ts, 'isoformat'):
                comment["timestamp"] = ts.isoformat()
            
        return comments

    async def create_reply(self, post_id: str, comment_id: str, reply_data: dict) -> str:
        comment_ref = self.db.collection("posts").document(post_id).collection("comments").document(comment_id)
        reply_ref = comment_ref.collection("replies").document()
        
        reply_data["id"] = reply_ref.id
        reply_data["timestamp"] = datetime.utcnow()
        
        batch = self.db.batch()
        batch.set(reply_ref, reply_data)
        batch.update(comment_ref, {"replies_count": firestore.Increment(1)})
        batch.commit()
        
        return reply_ref.id

    async def update_likes(self, target_type: str, target_id: str, increment: int = 1, parent_ids: list = []):
        """
        target_type: POST, COMMENT, REPLY
        parent_ids: [post_id] for comments, [post_id, comment_id] for replies
        """
        if target_type == "POST":
            ref = self.db.collection("posts").document(target_id)
        elif target_type == "COMMENT":
            ref = self.db.collection("posts").document(parent_ids[0]).collection("comments").document(target_id)
        elif target_type == "REPLY":
            ref = self.db.collection("posts").document(parent_ids[0]).collection("comments").document(parent_ids[1]).collection("replies").document(target_id)
        else:
            return

        ref.update({"likes_count": firestore.Increment(increment)})

    async def notify(self, user_id: str, type: str, actor_id: str, target_id: str):
        notif_ref = self.db.collection("social_notifications").document()
        notif_ref.set({
            "user_id": user_id,
            "type": type,
            "actor_id": actor_id,
            "target_id": target_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })
