import httpx
import asyncio
import json
import uuid
from datetime import datetime

BASE_URL = "http://127.0.0.1:8003" # Community Service
USER_SERVICE_URL = "http://127.0.0.1:8001"

async def test_endpoint(client, method, endpoint, payload=None, headers=None, description=""):
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"{'='*60}")
    url = f"{BASE_URL}/api/v1{endpoint}"
    print(f"Request URL: {url}")
    print(f"Request Method: {method}")
    if headers: print(f"Request Headers: {json.dumps(headers, indent=2)}")
    if payload: print(f"Request Payload: {json.dumps(payload, indent=2)}")
    
    try:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, json=payload, headers=headers)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        
        print(f"Response Status Code: {response.status_code}")
        try:
            res_json = response.json()
            print(f"Response JSON: {json.dumps(res_json, indent=2)}")
            return response.status_code, res_json
        except:
            print(f"Response Text: {response.text}")
            return response.status_code, response.text
    except Exception as e:
        print(f"Request failed: {e}")
        return 500, str(e)

async def run_tests():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login/Register (to get token)
        user_email = f"tester_{uuid.uuid4().hex[:6]}@example.com"
        password = "Password123!"
        
        print(f"Using user: {user_email}")
        
        # Register
        reg_payload = {"email": user_email, "password": password, "full_name": "Test User", "role": "FARMER"}
        r_status, r_res = await test_endpoint(client, "POST", "/register", reg_payload, None, "User Registration (via User Service)", url_override=USER_SERVICE_URL)
        
        # Login
        login_payload = {"email": user_email, "password": password}
        l_status, l_res = await test_endpoint(client, "POST", "/login", login_payload, None, "User Login (via User Service)", url_override=USER_SERVICE_URL)
        
        if l_status != 200:
            print("Login failed, stopping tests.")
            return

        token = l_res["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a Post
        post_payload = {
            "title": "My first harvest!",
            "content": "Looking great this season. #farming #potatoes",
            "media_urls": ["https://example.com/harvest.jpg"],
            "location": {"district": "Nashik", "state": "Maharashtra"}
        }
        status, post_res = await test_endpoint(client, "POST", "/posts", post_payload, headers, "Create Post (POST /posts)")
        if status != 200: return
        post_id = post_res["id"]

        # 3. Get Feed
        await test_endpoint(client, "GET", "/feed", None, None, "Get Feed (GET /feed)")

        # 4. Add a Comment
        comment_payload = {"text": "Wow, great job!"}
        status, comm_res = await test_endpoint(client, "POST", f"/posts/{post_id}/comments", comment_payload, headers, "Add Comment (POST /posts/{id}/comments)")
        if status != 200: return
        comment_id = comm_res["id"]

        # 5. Like the Post
        like_payload = {"post_id": post_id}
        await test_endpoint(client, "POST", f"/POST/{post_id}/like", like_payload, headers, "Like Post (POST /POST/{id}/like)")

        # 6. Flag the Post
        await test_endpoint(client, "POST", f"/POST/{post_id}/flag", {}, headers, "Flag Post (POST /POST/{id}/flag)")

        # 7. Delete Post
        await test_endpoint(client, "DELETE", f"/posts/{post_id}", None, headers, "Delete Post (DELETE /posts/{id})")

async def test_endpoint(client, method, endpoint, payload=None, headers=None, description="", url_override=None):
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"{'='*60}")
    base = url_override if url_override else BASE_URL
    url = f"{base}/api/v1{endpoint}"
    print(f"Request URL: {url}")
    print(f"Request Method: {method}")
    
    try:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, json=payload, headers=headers)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        
        print(f"Response Status Code: {response.status_code}")
        try:
            res_json = response.json()
            print(f"Response JSON: {json.dumps(res_json, indent=2)}")
            return response.status_code, res_json
        except:
            print(f"Response Text: {response.text}")
            return response.status_code, response.text
    except Exception as e:
        print(f"Request failed: {e}")
        return 500, str(e)

if __name__ == "__main__":
    asyncio.run(run_tests())
