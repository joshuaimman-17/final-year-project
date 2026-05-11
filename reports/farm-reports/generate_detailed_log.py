import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8002/api/v1"
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
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Login
        print_test_header("Login FARMER (Identity Dependency)")
        res = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "farmer@test.com", "password": "Password123!"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Farm
        print_test_header("Create Farm (POST /farms)")
        f_res = await log_request_response(client, "POST", f"{BASE_URL}/farms", headers=headers, payload={
            "name": "Green Valley",
            "village": "Karjat",
            "district": "Raigad",
            "state": "Maharashtra"
        })
        farm_id = f_res.json()["id"]
        
        # 3. Create Field
        print_test_header("Create Field (POST /fields)")
        field_res = await log_request_response(client, "POST", f"{BASE_URL}/fields", headers=headers, params={"farm_id": farm_id}, payload={
            "polygon": {"type": "Polygon", "coordinates": [[[73.0, 19.0], [73.1, 19.0], [73.1, 19.1], [73.0, 19.1], [73.0, 19.0]]]},
            "soil_type_baseline": "LOAMY",
            "irrigation_type": "DRIP"
        })
        field_id = field_res.json()["id"]
        
        # 4. Wait for Satellite Processing
        print("Waiting 10s for satellite/NDVI cache...")
        await asyncio.sleep(10)

        # 5. Get Weather
        print_test_header("Get Field Weather (GET /fields/{id}/weather)")
        await log_request_response(client, "GET", f"{BASE_URL}/fields/{field_id}/weather", headers=headers)
        
        # 6. Get Insights
        print_test_header("Get Farm Insights (GET /farms/{id}/insights)")
        await log_request_response(client, "GET", f"{BASE_URL}/farms/{farm_id}/insights", headers=headers)

if __name__ == "__main__":
    asyncio.run(run())
