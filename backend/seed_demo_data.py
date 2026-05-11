import httpx
import asyncio
import json
import uuid

BASE_URL = "http://localhost:8000"

async def seed_data():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("--- Seeding Demo Users ---")
        
        unique_id = uuid.uuid4().hex[:6]
        
        # 1. Create Farmer
        print("Registering Farmer...")
        farmer_reg = await client.post(f"{BASE_URL}/users/register", json={
            "email": f"farmer_{unique_id}@demo.com",
            "password": "password123",
            "full_name": f"Farmer John {unique_id}",
            "role": "FARMER",
            "phone": f"+1{uuid.uuid4().hex[:10]}"
        })
        if farmer_reg.status_code not in [200, 201]:
            print(f"Farmer reg failed: {farmer_reg.text}")
            return
        farmer_data = farmer_reg.json()
        farmer_token = farmer_data["access_token"]
        farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
        print("Farmer Registered.")

        # 2. Create Buyer
        print("Registering Buyer...")
        buyer_reg = await client.post(f"{BASE_URL}/users/register", json={
            "email": f"buyer_{unique_id}@demo.com",
            "password": "password123",
            "full_name": f"Buyer Alice {unique_id}",
            "role": "BUYER",
            "phone": f"+2{uuid.uuid4().hex[:10]}"
        })
        if buyer_reg.status_code not in [200, 201]:
            print(f"Buyer reg failed: {buyer_reg.text}")
            return
        buyer_data = buyer_reg.json()
        buyer_token = buyer_data["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
        print("Buyer Registered.")

        # 3. Farmer: Create Farm
        print("Farmer: Creating Farm...")
        farm_res = await client.post(f"{BASE_URL}/farms/farms", json={
            "name": f"Sunshine Valley Farm {unique_id}",
            "village": "Greenwood",
            "district": "North District",
            "state": "California"
        }, headers=farmer_headers)
        if farm_res.status_code not in [200, 201]:
            print(f"Farm creation failed: {farm_res.text}")
            return
        farm_id = farm_res.json()["id"]

        # 4. Farmer: Create Field
        print("Farmer: Creating Field...")
        field_res = await client.post(f"{BASE_URL}/farms/fields?farm_id={farm_id}", json={
            "polygon": {
                "type": "Polygon",
                "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]
            },
            "soil_type_baseline": "LOAMY",
            "irrigation_type": "DRIP"
        }, headers=farmer_headers)
        if field_res.status_code not in [200, 201]:
            print(f"Field creation failed: {field_res.text}")
            return
        field_id = field_res.json()["id"]

        # 5. Farmer: Create Marketplace Listing
        print("Farmer: Creating Listing...")
        listing_res = await client.post(f"{BASE_URL}/marketplace/listings", json={
            "farm_id": farm_id,
            "crop_name": "Organic Premium Wheat",
            "category": "GRAINS",
            "price_per_unit": 45.50,
            "unit": "KG",
            "available_quantity": 500,
            "is_organic": True,
            "image_urls": ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400"]
        }, headers=farmer_headers)
        if listing_res.status_code not in [200, 201]:
            print(f"Listing creation failed: {listing_res.text}")
            return
        listing_id = listing_res.json()["id"]

        # 6. Farmer: Create Community Post
        print("Farmer: Creating Community Post...")
        post_res = await client.post(f"{BASE_URL}/community/posts", json={
            "content": "Just finished planting the new wheat cycle at Sunshine Valley! #farming #wheat",
            "tags": ["farming", "wheat"],
            "image_urls": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400"]
        }, headers=farmer_headers)
        if post_res.status_code not in [200, 201]:
            print(f"Post creation failed: {post_res.text}")
            return
        post_id = post_res.json()["id"]

        # 7. Buyer: Create Order
        print("Buyer: Placing Order...")
        order_res = await client.post(f"{BASE_URL}/marketplace/orders", json={
            "items": [
                {
                    "listing_id": listing_id,
                    "quantity": 10
                }
            ],
            "shipping_address": {"street": "123 Buyer St", "city": "City", "country": "Country"},
            "payment_method_id": "pm_card_visa" # Mock Stripe ID
        }, headers=buyer_headers)
        if order_res.status_code not in [200, 201]:
            print(f"Order placement failed: {order_res.text}")
            return
        print("Order Placed.")

        # 8. Buyer: Comment on Post
        print("Buyer: Commenting on Post...")
        comment_res = await client.post(f"{BASE_URL}/community/posts/{post_id}/comments", json={
            "text": "This looks amazing, John! Keep it up."
        }, headers=buyer_headers)
        if comment_res.status_code not in [200, 201]:
            print(f"Comment failed: {comment_res.text}")
        else:
            print("Comment added.")

        print("\n--- Demo Data Seeded Successfully! ---")
        print(f"Farmer Email: {farmer_data['user']['email']}")
        print(f"Buyer Email: {buyer_data['user']['email']}")

if __name__ == "__main__":
    asyncio.run(seed_data())
