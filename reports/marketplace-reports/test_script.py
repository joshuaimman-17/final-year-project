import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8007/api/v1" # Assuming 8007 for Marketplace
USER_URL = "http://127.0.0.1:8001/api/v1"

async def run():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Get Tokens for Farmer (Seller) and Buyer
        users = []
        for i in range(2):
            email = f"market_user_{i}_{uuid.uuid4().hex[:4]}@example.com"
            await client.post(f"{USER_URL}/register", json={"email": email, "password": "Password123!", "full_name": f"Market User {i}", "role": "FARMER"})
            res = await client.post(f"{USER_URL}/login", json={"email": email, "password": "Password123!"})
            data = res.json()
            users.append({
                "id": data["user"]["id"],
                "token": data["access_token"],
                "headers": {"Authorization": f"Bearer {data['access_token']}"}
            })
        
        seller, buyer = users[0], users[1]

        # 2. Create Farm (Dependency)
        FARM_URL = "http://127.0.0.1:8002/api/v1"
        farm_res = await client.post(f"{FARM_URL}/farms", headers=seller["headers"], json={"name": "Market Farm", "location": "Nashik"})
        farm_id = farm_res.json()["id"]

        # 3. Create Listing
        listing_payload = {
            "farm_id": farm_id,
            "crop_name": "Organic Potatoes",
            "category": "VEGETABLES",
            "price_per_unit": "25.50",
            "unit": "KG",
            "available_quantity": 100.0,
            "is_organic": True,
            "image_urls": ["https://example.com/potatoes.jpg"]
        }
        l_res = await client.post(f"{BASE_URL}/listings", headers=seller["headers"], json=listing_payload)
        print(f"Create Listing: {l_res.status_code}")
        if l_res.status_code != 200:
            print(f"Listing Error: {l_res.text}")
            return
        listing_id = l_res.json()["id"]

        # 4. Search Listings
        s_res = await client.get(f"{BASE_URL}/listings", params={"crop": "Potatoes"})
        print(f"Search Listings: {s_res.status_code}, Found: {len(s_res.json())}")

        # 5. Create Order (Checkout)
        order_payload = {
            "items": [{"listing_id": listing_id, "quantity": 10.0}],
            "shipping_address": {"street": "123 Farmer Lane", "city": "Nashik", "state": "Maharashtra", "zip": "422001"},
            "payment_method_id": "pm_card_visa"
        }
        o_res = await client.post(f"{BASE_URL}/orders", headers=buyer["headers"], json=order_payload)
        print(f"Create Order: {o_res.status_code}")
        if o_res.status_code != 200:
            print(f"Order Error: {o_res.text}")
            return
        order_id = o_res.json()["id"]

        # 6. Get Order History
        h_res = await client.get(f"{BASE_URL}/orders/history", headers=buyer["headers"])
        print(f"Order History: {h_res.status_code}, Items: {len(h_res.json())}")

if __name__ == "__main__":
    asyncio.run(run())
