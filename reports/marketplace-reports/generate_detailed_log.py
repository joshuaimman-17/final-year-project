import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8007/api/v1"
USER_URL = "http://127.0.0.1:8001/api/v1"
FARM_URL = "http://127.0.0.1:8002/api/v1"

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
        print_test_header("Login FARMER (Seller Identity)")
        res = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "farmer@test.com", "password": "Password123!"})
        seller_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

        print_test_header("Login BUYER (Buyer Identity)")
        res_buy = await log_request_response(client, "POST", f"{USER_URL}/login", payload={"email": "buyer@test.com", "password": "Password123!"})
        buyer_headers = {"Authorization": f"Bearer {res_buy.json()['access_token']}"}
        
        # 2. Get Farm ID
        print_test_header("Get Seller's Farm (Identity Dependency)")
        f_res = await log_request_response(client, "GET", f"{FARM_URL}/farms", headers=seller_headers)
        farm_id = f_res.json()[0]["id"] if f_res.json() else None
        
        if not farm_id:
            print("No farm found for seller - creating one...")
            f_res = await log_request_response(client, "POST", f"{FARM_URL}/farms", headers=seller_headers, payload={"name": "Market Farm", "village": "Market", "district": "Market", "state": "Market"})
            farm_id = f_res.json()["id"]

        # 3. Create Listing
        print_test_header("Create Listing (POST /listings)")
        l_res = await log_request_response(client, "POST", f"{BASE_URL}/listings", headers=seller_headers, payload={
            "farm_id": farm_id,
            "crop_name": "Premium Wheat",
            "category": "GRAINS",
            "price_per_unit": "45.00",
            "unit": "KG",
            "available_quantity": 500.0,
            "is_organic": True,
            "image_urls": ["https://example.com/wheat.jpg"]
        })
        listing_id = l_res.json()["id"]
        
        # 4. Search Listings
        print_test_header("Search Listings (GET /listings)")
        await log_request_response(client, "GET", f"{BASE_URL}/listings", params={"crop": "Wheat"})
        
        # 5. Create Order
        print_test_header("Create Order / Atomic Checkout (POST /orders)")
        await log_request_response(client, "POST", f"{BASE_URL}/orders", headers=buyer_headers, payload={
            "items": [{"listing_id": listing_id, "quantity": 50.0}],
            "shipping_address": {"street": "45 Buyer St", "city": "Mumbai", "state": "Maharashtra", "zip": "400001"},
            "payment_method_id": "pm_card_mastercard"
        })
        
        # 6. Order History
        print_test_header("Get Order History (GET /orders/history)")
        await log_request_response(client, "GET", f"{BASE_URL}/orders/history", headers=buyer_headers)

if __name__ == "__main__":
    asyncio.run(run())
