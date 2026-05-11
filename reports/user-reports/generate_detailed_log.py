import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8001/api/v1"

def print_test_header(title):
    print("============================================================")
    print(f"TEST: {title}")
    print("============================================================")

async def log_request_response(client, method, url, headers=None, payload=None):
    headers = headers or {}
    print(f"Request URL: {url}")
    print(f"Request Method: {method}")
    print(f"Request Headers: {json.dumps(headers, indent=2)}")
    print(f"Request Payload: {json.dumps(payload, indent=2) if payload else '{}'}")
    
    if method == "POST":
        res = await client.post(url, headers=headers, json=payload)
    elif method == "GET":
        res = await client.get(url, headers=headers)
    elif method == "PATCH":
        res = await client.patch(url, headers=headers, json=payload)
    elif method == "PUT":
        res = await client.put(url, headers=headers, json=payload)
    elif method == "DELETE":
        res = await client.delete(url, headers=headers)
        
    print(f"Response Status Code: {res.status_code}")
    try:
        print(f"Response JSON: {json.dumps(res.json(), indent=2)}")
    except:
        print(f"Response Text: {res.text}")
    print()
    return res

async def run():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Define users
        roles = ["FARMER", "EXPERT", "BUYER", "ADMIN"]
        test_users = {}
        
        for role in roles:
            email = f"{role.lower()}@test.com"
            test_users[role] = {
                "email": email,
                "password": "Password123!",
                "full_name": f"{role.capitalize()} User",
                "role": role,
                "phone": f"+123456789{roles.index(role)}"
            }

        # 1. Registration & Login for all roles
        for role in roles:
            user = test_users[role]
            
            print_test_header(f"Register {role} (POST /register)")
            await log_request_response(client, "POST", f"{BASE_URL}/register", payload=user)
            
            print_test_header(f"Login {role} (POST /login)")
            res = await log_request_response(client, "POST", f"{BASE_URL}/login", payload={"email": user["email"], "password": user["password"]})
            if res.status_code == 200:
                user["token"] = res.json()["access_token"]
                user["id"] = res.json()["user"]["id"]
                user["headers"] = {"Authorization": f"Bearer {user['token']}"}

        # 2. Profile Actions (using Farmer)
        farmer = test_users["FARMER"]
        print_test_header("Get Current User Profile (GET /me)")
        await log_request_response(client, "GET", f"{BASE_URL}/me", headers=farmer["headers"])
        
        print_test_header("Update Profile (PATCH /profile)")
        await log_request_response(client, "PATCH", f"{BASE_URL}/profile", headers=farmer["headers"], payload={"full_name": "Farmer John Updated"})
        
        print_test_header("Update Profile Alias (PUT /me)")
        await log_request_response(client, "PUT", f"{BASE_URL}/me", headers=farmer["headers"], payload={"full_name": "Farmer John PUT"})

        # 3. Expert Application (using Expert)
        expert = test_users["EXPERT"]
        print_test_header("Apply for Expert Profile (POST /expert-apply)")
        await log_request_response(client, "POST", f"{BASE_URL}/expert-apply", headers=expert["headers"], payload={
            "license_number": f"LIC-{uuid.uuid4().hex[:5]}",
            "specialization": "Horticulture",
            "credentials_url": "https://example.com/hort.pdf"
        })

        # 4. List Experts
        print_test_header("List Approved Experts (GET /experts)")
        await log_request_response(client, "GET", f"{BASE_URL}/experts")

        # 5. Social Actions (Farmer follows Buyer)
        buyer = test_users["BUYER"]
        print_test_header(f"Follow User (POST /follow/{{target_id}})")
        await log_request_response(client, "POST", f"{BASE_URL}/follow/{buyer['id']}", headers=farmer["headers"])

        print_test_header(f"Unfollow User (DELETE /follow/{{target_id}})")
        await log_request_response(client, "DELETE", f"{BASE_URL}/follow/{buyer['id']}", headers=farmer["headers"])

        print_test_header(f"Get User Followers (GET /{{id}}/followers)")
        await log_request_response(client, "GET", f"{BASE_URL}/{buyer['id']}/followers")

        # 6. Admin Actions (List Pending Experts, Verify, Toggle Status)
        # Note: These might fail if the controller doesn't have these specific endpoints on the router
        # Let's check admin router if it exists.
        
        # 7. Account Deactivation (Commented out to keep users active for other service tests)
        # print_test_header("Deactivate Personal Account (DELETE /account)")
        # await log_request_response(client, "DELETE", f"{BASE_URL}/account", headers=farmer["headers"])

if __name__ == "__main__":
    asyncio.run(run())
