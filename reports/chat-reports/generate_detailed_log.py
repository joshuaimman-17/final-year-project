import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8006/api/v1" # Using port 8006 as verified stable
USER_URL = "http://127.0.0.1:8001/api/v1"

def print_test_header(title):
    print("============================================================")
    print(f"TEST: {title}")
    print("============================================================")

async def log_request_response(client, method, url, headers=None, payload=None, params=None):
    headers = headers or {}
    print(f"Request URL: {url}")
    print(f"Request Method: {method}")
    if params: print(f"Request Params: {json.dumps(params, indent=2)}")
    print(f"Request Headers: {json.dumps(headers, indent=2)}")
    print(f"Request Payload: {json.dumps(payload, indent=2) if payload else '{}'}")
    
    if method == "POST":
        res = await client.post(url, headers=headers, json=payload, params=params)
    elif method == "GET":
        res = await client.get(url, headers=headers, params=params)
        
    print(f"Response Status Code: {res.status_code}")
    try:
        print(f"Response JSON: {json.dumps(res.json(), indent=2)}")
    except:
        print(f"Response Text: {res.text}")
    print()
    return res

async def run():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login
        print_test_header("Login FARMER (Identity Dependency)")
        res = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "farmer@test.com", "password": "Password123!"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        user_id = res.json()["user"]["id"]

        print_test_header("Login EXPERT (Partner)")
        res_exp = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "expert@test.com", "password": "Password123!"})
        exp_id = res_exp.json()["user"]["id"]
        exp_headers = {"Authorization": f"Bearer {res_exp.json()['access_token']}"}
        
        # 2. Heartbeat
        print_test_header("Update Presence (POST /chat/heartbeat)")
        await log_request_response(client, "POST", f"{BASE_URL}/chat/heartbeat", headers=headers)
        
        # 3. Initiate Chat
        print_test_header("Initiate Chat Room (POST /chat/initiate)")
        init_res = await log_request_response(client, "POST", f"{BASE_URL}/chat/initiate", headers=headers, payload={
            "participants": [user_id, exp_id],
            "is_group": False
        })
        room_id = init_res.json()
        
        # 4. Send Message
        print_test_header("Send Message (POST /chat/rooms/{id}/messages)")
        msg_res = await log_request_response(client, "POST", f"{BASE_URL}/chat/rooms/{room_id}/messages", headers=headers, payload={
            "text": "Doctor, I see spots on my leaves.",
            "type": "TEXT"
        })
        msg_id = msg_res.json()["message_id"]
        
        # 5. React
        print_test_header("React to Message (POST /chat/rooms/{id}/messages/{mid}/react)")
        await log_request_response(client, "POST", f"{BASE_URL}/chat/rooms/{room_id}/messages/{msg_id}/react", headers=exp_headers, payload={
            "emoji": "👀",
            "action": "ADD"
        })

if __name__ == "__main__":
    asyncio.run(run())
