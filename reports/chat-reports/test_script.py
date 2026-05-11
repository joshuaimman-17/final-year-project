import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8006/api/v1" # Fresh port
USER_URL = "http://127.0.0.1:8001/api/v1"

async def run():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Get Tokens for two users
        users = []
        for i in range(2):
            email = f"chat_user_{i}_{uuid.uuid4().hex[:4]}@example.com"
            await client.post(f"{USER_URL}/register", json={"email": email, "password": "Password123!", "full_name": f"Chat User {i}", "role": "FARMER"})
            res = await client.post(f"{USER_URL}/login", json={"email": email, "password": "Password123!"})
            data = res.json()
            users.append({
                "id": data["user"]["id"],
                "token": data["access_token"],
                "headers": {"Authorization": f"Bearer {data['access_token']}"}
            })
        
        user1, user2 = users[0], users[1]
        print(f"User 1: {user1['id']}")
        print(f"User 2: {user2['id']}")

        # 2. Update Presence (Heartbeat)
        hb_res = await client.post(f"{BASE_URL}/chat/heartbeat", headers=user1["headers"])
        print(f"Heartbeat: {hb_res.status_code}")

        # 3. Initiate Chat Room
        init_res = await client.post(f"{BASE_URL}/chat/initiate", headers=user1["headers"], json={
            "participants": [user1["id"], user2["id"]],
            "is_group": False
        })
        print(f"Initiate Chat: {init_res.status_code}")
        room_id = init_res.json()
        print(f"Room ID: {room_id}")

        # 4. Send Message
        msg_res = await client.post(f"{BASE_URL}/chat/rooms/{room_id}/messages", headers=user1["headers"], json={
            "text": "Hello, is this working?",
            "type": "TEXT"
        })
        print(f"Send Message: {msg_res.status_code}")
        msg_id = msg_res.json()["message_id"]

        # 5. React to Message
        react_res = await client.post(f"{BASE_URL}/chat/rooms/{room_id}/messages/{msg_id}/react", headers=user2["headers"], json={
            "emoji": "👍",
            "action": "ADD"
        })
        print(f"React: {react_res.status_code}")

if __name__ == "__main__":
    asyncio.run(run())
