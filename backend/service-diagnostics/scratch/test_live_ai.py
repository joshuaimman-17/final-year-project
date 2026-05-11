import asyncio
import os
from api.services.ai_service import AIService
from dotenv import load_dotenv

load_dotenv()

async def test_live_ai():
    image_url = "https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.png"
    crop_type = "potato"
    key = os.getenv("HUGGINGFACE_API_KEY")
    
    print(f"Testing real AI inference for {crop_type}...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Download
        print("Downloading image...")
        img_resp = await client.get(image_url, follow_redirects=True)
        print(f"Download Status: {img_resp.status_code}")
        image_bytes = img_resp.content

        # 2. Inference
        model_id = "Ritesh-Sood/potato-leaf-disease-classification"
        api_url = f"https://api-inference.huggingface.co/models/{model_id}"
        headers = {"Authorization": f"Bearer {key}"}
        
        print(f"Calling HF API: {api_url}")
        hf_resp = await client.post(api_url, headers=headers, content=image_bytes)
        print(f"HF Status: {hf_resp.status_code}")
        print(f"HF Body: {hf_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_live_ai())
