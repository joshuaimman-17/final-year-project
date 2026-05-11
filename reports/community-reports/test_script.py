import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8003/api/v1"
USER_URL = "http://127.0.0.1:8001/api/v1"

async def run():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Get Token
        email = f"user_{uuid.uuid4().hex[:6]}@example.com"
        await client.post(f"{USER_URL}/register", json={"email": email, "password": "Password123!", "full_name": "Community Member", "role": "FARMER"})
        res = await client.post(f"{USER_URL}/login", json={"email": email, "password": "Password123!"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Post
        post_res = await client.post(f"{BASE_URL}/posts", headers=headers, json={
            "content": "Check out my sunflowers! #nature",
            "tags": ["nature"]
        })
        print(f"Post Created: {post_res.status_code}")
        post_id = post_res.json()["id"]
        
        # 3. Add Comment
        comm_res = await client.post(f"{BASE_URL}/posts/{post_id}/comments", headers=headers, json={"text": "So beautiful!"})
        print(f"Comment Created: {comm_res.status_code}")
        
        # 4. Like Post
        like_res = await client.post(f"{BASE_URL}/POST/{post_id}/like", headers=headers, json={})
        print(f"Post Liked: {like_res.status_code}")
        
        # 5. Get Feed
        feed_res = await client.get(f"{BASE_URL}/feed")
        print(f"Feed Items: {len(feed_res.json())}")

if __name__ == "__main__":
    asyncio.run(run())
