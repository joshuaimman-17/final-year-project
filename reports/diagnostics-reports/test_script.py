import httpx
import asyncio
import json
import uuid

USERS_URL = "http://127.0.0.1:8002/api/v1"
FARMS_URL = "http://127.0.0.1:8003/api/v1"
DIAG_URL = "http://127.0.0.1:8004/api/v1"

async def log_test(description, method, url, payload=None, headers=None, status=None, response=None):
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"{'='*60}")
    print(f"Request URL: {url}")
    print(f"Request Method: {method}")
    print(f"Request Headers: {json.dumps(headers or {}, indent=2)}")
    print(f"Request Payload: {json.dumps(payload or {}, indent=2)}")
    print(f"Response Status Code: {status}")
    print(f"Response JSON: {json.dumps(response or {}, indent=2)}")

async def test_endpoint(client, method, path, json_data=None, headers=None, description=""):
    url = f"{DIAG_URL}{path}"
    try:
        if method == "POST":
            resp = await client.post(url, json=json_data, headers=headers)
        elif method == "GET":
            resp = await client.get(url, headers=headers)
        
        res_json = {}
        try: res_json = resp.json()
        except: res_json = {"text": resp.text}
        
        await log_test(description, method, url, json_data, headers, resp.status_code, res_json)
        return resp.status_code, res_json
    except Exception as e:
        print(f"Request FAILED: {e}")
        return None, str(e)

async def main():
    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Login Farmer
        print("--- Authenticating Farmer ---")
        farmer_login = await client.post(f"{USERS_URL}/login", json={"email": "farmer@test.com", "password": "Password123!"})
        if farmer_login.status_code != 200:
            print(f"Farmer Login FAILED: {farmer_login.status_code} - {farmer_login.text}")
            return
        farmer_token = farmer_login.json()["access_token"]
        farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

        # 2. Login Expert
        print("--- Authenticating Expert ---")
        expert_login = await client.post(f"{USERS_URL}/login", json={"email": "expert@test.com", "password": "Password123!"})
        if expert_login.status_code != 200:
            print(f"Expert Login FAILED: {expert_login.status_code} - {expert_login.text}")
            # Try to register if not exists
            print("Attempting to register expert...")
            await client.post(f"{USERS_URL}/register", json={"email": "expert@test.com", "password": "Password123!", "full_name": "Expert Jane", "role": "EXPERT"})
            expert_login = await client.post(f"{USERS_URL}/login", json={"email": "expert@test.com", "password": "Password123!"})
            if expert_login.status_code != 200:
                print(f"Expert Login Still FAILED: {expert_login.status_code}")
                return
        expert_token = expert_login.json()["access_token"]
        expert_headers = {"Authorization": f"Bearer {expert_token}"}

        # 3. Get a Field ID from Farm Service
        print("--- Fetching Farm/Field ---")
        farms_resp = await client.get(f"{FARMS_URL}/farms", headers=farmer_headers)
        farms = farms_resp.json()
        if not farms or not farms[0]["fields"]:
            # Create a farm and field if needed
            farm_res = await client.post(f"{FARMS_URL}/farms", json={"name": "Test Farm", "village": "V", "district": "D", "state": "S"}, headers=farmer_headers)
            farm_id = farm_res.json()["id"]
            field_res = await client.post(f"{FARMS_URL}/fields?farm_id={farm_id}", json={"polygon": {"type": "Polygon", "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]}, "soil_type_baseline": "LOAMY", "irrigation_type": "DRIP"}, headers=farmer_headers)
            field_id = field_res.json()["id"]
        else:
            field_id = farms[0]["fields"][0]["id"]

        # 4. Submit Diagnosis
        diag_payload = {
            "field_id": field_id,
            "image_url": "https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.png",
            "crop_type": "potato"
        }
        status, res = await test_endpoint(client, "POST", "/diagnose", diag_payload, farmer_headers, "Submit Diagnosis (POST /diagnose)")
        if status != 200: return
        diagnosis_id = res["id"]

        # 5. Wait for background AI processing (Real AI takes longer)
        print("Waiting 20 seconds for REAL AI background task...")
        await asyncio.sleep(20)

        # 6. Get Diagnosis Detail
        await test_endpoint(client, "GET", f"/diagnose/{diagnosis_id}", None, farmer_headers, "Get Diagnosis Detail (GET /diagnose/{id})")

        # 7. Get History
        await test_endpoint(client, "GET", "/diagnose/history", None, farmer_headers, "Get Diagnosis History (GET /diagnose/history)")

        # 8. Expert Queue
        await test_endpoint(client, "GET", "/expert/queue", None, expert_headers, "Get Expert Queue (GET /expert/queue)")

        # 9. Submit Expert Recommendation
        rec_payload = {
            "diagnosis_id": diagnosis_id,
            "confirmed_disease": "Potato Late Blight",
            "severity": "HIGH",
            "treatment_plan": "Apply fungicides immediately and remove infected leaves."
        }
        await test_endpoint(client, "POST", "/expert/recommend", rec_payload, expert_headers, "Submit Expert Recommendation (POST /expert/recommend)")

if __name__ == "__main__":
    asyncio.run(main())
