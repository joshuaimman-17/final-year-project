import requests
import json

base_url = "http://localhost:8001/users"

def test_login():
    payload = {
        "email": "tester1@example.com",
        "password": "password123"
    }
    print(f"Attempting login for {payload['email']}...")
    resp = requests.post(f"{base_url}/login", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    test_login()
