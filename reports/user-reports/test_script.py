import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8001/api/v1"

async def test_endpoint(client, method, endpoint, payload=None, headers=None, description=""):
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"{'='*60}")
    url = f"{BASE_URL}{endpoint}"
    print(f"Request URL: {url}")
    
    try:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, json=payload, headers=headers)
        elif method == "PATCH":
            response = await client.patch(url, json=payload, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code, response.json()
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")
        return 500, None

async def run():
    async with httpx.AsyncClient(timeout=60.0) as client:
        email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        password = "Password123!"
        
        # 1. Register
        reg_payload = {"email": email, "password": password, "full_name": "Test User", "role": "FARMER"}
        status, res = await test_endpoint(client, "POST", "/register", reg_payload, None, "Registration")
        
        # 2. Login
        login_payload = {"email": email, "password": password}
        status, res = await test_endpoint(client, "POST", "/login", login_payload, None, "Login")
        token = res["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get Me
        await test_endpoint(client, "GET", "/me", None, headers, "Get Me")
        
        # 4. List Experts
        await test_endpoint(client, "GET", "/experts", None, headers, "List Experts")

if __name__ == "__main__":
    asyncio.run(run())
