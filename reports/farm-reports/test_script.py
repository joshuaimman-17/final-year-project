import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8002/api/v1"
USER_URL = "http://127.0.0.1:8001/api/v1"

async def run():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Get Token
        email = f"farmer_{uuid.uuid4().hex[:6]}@example.com"
        await client.post(f"{USER_URL}/register", json={"email": email, "password": "Password123!", "full_name": "Farmer Joe", "role": "FARMER"})
        res = await client.post(f"{USER_URL}/login", json={"email": email, "password": "Password123!"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Farm
        farm_res = await client.post(f"{BASE_URL}/farms", headers=headers, json={"name": "Green Valley", "location": "Nashik", "total_area": 50.5})
        print(f"Farm Created: {farm_res.status_code}")
        farm_id = farm_res.json()["id"]
        
        # 3. Create Field
        field_res = await client.post(f"{BASE_URL}/fields", params={"farm_id": farm_id}, headers=headers, json={
            "polygon": {"type": "Polygon", "coordinates": [[[73.0, 19.0], [73.1, 19.0], [73.1, 19.1], [73.0, 19.1], [73.0, 19.0]]]},
            "soil_type_baseline": "LOAMY",
            "irrigation_type": "DRIP"
        })
        print(f"Field Created: {field_res.status_code}")
        if field_res.status_code != 200:
            print(f"Field Error: {field_res.text}")
            return
        field_id = field_res.json()["id"]
        
        # 4. Wait for background processing (Satellite/NDVI can take time)
        print("Waiting 30 seconds for background processing...")
        await asyncio.sleep(30)

        # 5. Get Weather
        weather_res = await client.get(f"{BASE_URL}/fields/{field_id}/weather", headers=headers)
        print(f"Weather Status: {weather_res.status_code}")
        
        # 6. Get Farm Insights
        insight_res = await client.get(f"{BASE_URL}/farms/{farm_id}/insights", headers=headers)
        print(f"Insights Status: {insight_res.status_code}")
        if insight_res.status_code == 200:
            print(f"Insights (Summary): {list(insight_res.json().keys())}")

if __name__ == "__main__":
    asyncio.run(run())
