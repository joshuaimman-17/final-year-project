import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8004/api/v1"
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
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        # 1. Login
        print_test_header("Login FARMER (Identity Dependency)")
        res = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "farmer@test.com", "password": "Password123!"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get Farm/Field (Dependency)
        FARM_URL = "http://127.0.0.1:8002/api/v1"
        f_res = await log_request_response(client, "GET", f"{FARM_URL}/farms", headers=headers)
        farm = f_res.json()[0] if f_res.json() else None
        if not farm or not farm.get("fields"):
             print("No farm/field found for diagnostics - skipping...")
             return
        field_id = farm["fields"][0]["id"]

        # 3. Run Diagnosis
        print_test_header("Run AI Diagnosis (POST /diagnose)")
        d_res = await log_request_response(client, "POST", f"{BASE_URL}/diagnose", headers=headers, payload={
            "field_id": field_id,
            "image_url": "https://raw.githubusercontent.com/joshuaimmanuel/Dr.Plant/main/demo/potato_late_blight.jpg",
            "crop_type": "potato",
            "location": {"lat": 19.0, "lon": 73.0}
        })
        if d_res.status_code != 200:
            print(f"Diagnosis Error: {d_res.text}")
            return
        diag_id = d_res.json()["id"]
        
        # 4. Get Diagnosis
        print_test_header("Get Diagnosis Status (GET /diagnose/{id})")
        await log_request_response(client, "GET", f"{BASE_URL}/diagnose/{diag_id}", headers=headers)
        
        # 4. Expert Review (as Admin/Expert)
        print_test_header("Login ADMIN (Expert Reviewer)")
        res_adm = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "dr.plant2026@gmail.com", "password": "Password123!"})
        adm_headers = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

        print_test_header("Submit Expert Recommendation (POST /expert/recommend)")
        await log_request_response(client, "POST", f"{BASE_URL}/expert/recommend", headers=adm_headers, payload={
            "diagnosis_id": diag_id,
            "recommended_action": "Apply Copper Fungicide immediately.",
            "is_emergency": True
        })

if __name__ == "__main__":
    asyncio.run(run())
