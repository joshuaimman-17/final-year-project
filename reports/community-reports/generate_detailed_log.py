import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8003/api/v1"
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
        
        # 2. Create Post
        print_test_header("Create Post (POST /posts)")
        p_res = await log_request_response(client, "POST", f"{BASE_URL}/posts", headers=headers, payload={
            "content": "Look at my healthy wheat crop! #farming",
            "tags": ["farming"]
        })
        post_id = p_res.json()["id"]
        
        # 3. Add Comment
        print_test_header("Add Comment (POST /posts/{id}/comments)")
        await log_request_response(client, "POST", f"{BASE_URL}/posts/{post_id}/comments", headers=headers, payload={"text": "Looking great!"})
        
        # 4. Like Post
        print_test_header("Like Post (POST /POST/{id}/like)")
        await log_request_response(client, "POST", f"{BASE_URL}/POST/{post_id}/like", headers=headers)
        
        # 5. Get Feed
        print_test_header("Get Community Feed (GET /feed)")
        await log_request_response(client, "GET", f"{BASE_URL}/feed")

if __name__ == "__main__":
    asyncio.run(run())
