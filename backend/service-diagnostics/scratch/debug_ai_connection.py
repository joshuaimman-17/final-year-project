import httpx
import os
from dotenv import load_dotenv

load_dotenv()

url = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224"
key = os.getenv("HUGGINGFACE_API_KEY", "NOT_SET")

print(f"Testing URL: {url}")
print(f"Key set: {'Yes' if key != 'NOT_SET' else 'No'}")

try:
    with httpx.Client(timeout=10.0) as client:
        # Use a real model endpoint
        headers = {
            "Authorization": f"Bearer {key}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        } if key != "NOT_SET" else {"User-Agent": "Mozilla/5.0"}
        resp = client.get(url, headers=headers)
        print(f"Status Code: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('Content-Type')}")
        print(f"Body snippet: {resp.text[:500]}")
        
        if resp.status_code == 401:
            print("EXACT CAUSE: Unauthorized - The API Key is missing, invalid, or expired.")
        elif resp.status_code == 404:
            print("EXACT CAUSE: Not Found - The model ID is incorrect or the model is private.")
        elif "text/html" in resp.headers.get("Content-Type", ""):
            print("EXACT CAUSE: Redirected to HTML - Your network/proxy is likely intercepting the request (Captive Portal) or HuggingFace is presenting a login/verification page.")
except Exception as e:
    print(f"EXACT CAUSE: {type(e).__name__} - {str(e)}")
