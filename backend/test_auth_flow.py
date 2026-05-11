import requests
import json
import random
import string

base_url = "http://localhost:8001/users"

def generate_random_email():
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"user_{random_str}@example.com"

def test_register_and_login():
    email = generate_random_email()
    password = "Password123!"
    
    register_payload = {
        "email": email,
        "password": password,
        "full_name": "Test User",
        "role": "FARMER"
    }
    
    print(f"--- Testing Registration ---")
    print(f"Registering {email}...")
    reg_resp = requests.post(f"{base_url}/register", json=register_payload)
    print(f"Registration Status: {reg_resp.status_code}")
    print(f"Registration Response: {reg_resp.text}")
    
    if reg_resp.status_code == 200 or reg_resp.status_code == 201:
        print(f"\n--- Testing Login ---")
        login_payload = {
            "email": email,
            "password": password
        }
        print(f"Logging in {email}...")
        log_resp = requests.post(f"{base_url}/login", json=login_payload)
        print(f"Login Status: {log_resp.status_code}")
        print(f"Login Response: {log_resp.text}")
    else:
        print("Registration failed, skipping login test.")

if __name__ == "__main__":
    test_register_and_login()
