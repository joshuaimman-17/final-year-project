import os
import re
import asyncio
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class AIService:
    HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
    MOCK_MODE = os.getenv("MOCK_AI_SERVICE", "false").lower() == "true"

    # ── Model routing table ──────────────────────────────────────────────────────
    MODEL_ROUTES = {
        "potato":  "Ritesh-Sood/potato-leaf-disease-classification",
        "peanut":  "Dunnook/peanut-leaf-disease",
        "rice":    "vbookshelf/rice-leaf-diseases-model",
        "general": "Prasanna-C/plant-disease-classification",
        "safety":  "microsoft/resnet-50",
    }

    LABEL_MAP = {
        "Tomato___Late_blight":             "Late Blight in Tomatoes",
        "Tomato___Bacterial_spot":          "Bacterial Spot in Tomatoes",
        "Potato___Early_Blight":            "Early Blight in Potatoes",
        "Potato___Late_Blight":             "Late Blight in Potatoes",
        "Potato___healthy":                 "Healthy Potato",
        "Rice_Blast":                       "Rice Blast",
        "Rice_Brown_Spot":                  "Brown Spot in Rice",
        "Apple___Apple_scab":               "Apple Scab",
        "Apple___Black_rot":                "Black Rot in Apple",
        "Apple___Cedar_apple_rust":         "Cedar Apple Rust",
        "Corn___Common_rust":               "Common Rust in Corn",
        "Corn___Gray_leaf_spot":            "Gray Leaf Spot in Corn",
        "Corn___Northern_Leaf_Blight":      "Northern Corn Leaf Blight",
        "Tomato___Tomato_mosaic_virus":     "Tomato Mosaic Virus",
        "Tomato___Septoria_leaf_spot":      "Septoria Leaf Spot in Tomato",
        "Peanut___Leaf_Spot":               "Tikka Disease (Early Leaf Spot) in Peanuts",
        "Peanut___Healthy":                 "Healthy Peanut",
        "healthy":                          "Healthy Plant",
    }

    @staticmethod
    def _select_model(crop_type: Optional[str]) -> str:
        if not crop_type:
            return AIService.MODEL_ROUTES["general"]
        key = crop_type.lower().strip()
        return AIService.MODEL_ROUTES.get(key, AIService.MODEL_ROUTES["general"])

    @staticmethod
    def _humanise(label: str) -> str:
        if label in AIService.LABEL_MAP:
            return AIService.LABEL_MAP[label]
        return re.sub(r"_{2,}", " in ", label).replace("_", " ").title()

    @staticmethod
    async def run_inference(image_url: str, crop_type: Optional[str] = None) -> dict:
        """
        Downloads the image bytes and calls the HuggingFace Inference API.
        """
        model_id = AIService._select_model(crop_type)

        api_url = f"https://api-inference.huggingface.co/models/{model_id}"
        headers = {
            "Authorization": f"Bearer {AIService.HF_API_KEY}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Get image bytes (either from URL or Base64)
                if image_url.startswith("data:"):
                    import base64
                    try:
                        # Format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
                        header, encoded = image_url.split(",", 1)
                        image_bytes = base64.b64decode(encoded)
                    except Exception as e:
                        print(f"Failed to decode base64 image: {e}")
                        return AIService._get_simulated_result(model_id, crop_type)
                else:
                    headers_dl = {"User-Agent": "Mozilla/5.0"}
                    img_resp = await client.get(image_url, headers=headers_dl, timeout=15.0, follow_redirects=True)
                    img_resp.raise_for_status()
                    image_bytes = img_resp.content

                # 2. Call HuggingFace
                hf_resp = await client.post(api_url, headers=headers, content=image_bytes, timeout=30.0)
                
                if hf_resp.status_code != 200:
                    print(f"HuggingFace API Error ({hf_resp.status_code}), falling back to simulation")
                    return AIService._get_simulated_result(model_id, crop_type)

                raw = hf_resp.json()
                if not isinstance(raw, list) or len(raw) == 0:
                    return AIService._get_simulated_result(model_id, crop_type)

                top = raw[0]
                label = top.get("label", "Unknown")
                confidence = float(top.get("score", 0.0))

                return {
                    "suggested_disease": AIService._humanise(label),
                    "confidence_score": round(confidence, 4),
                    "raw_ai_output": {"predictions": raw, "model": model_id},
                    "model_used": model_id,
                    "priority_review": confidence < 0.70,
                    "auto_complete": confidence > 0.90 and "healthy" in label.lower(),
                }
        except Exception as e:
            print(f"AI Inference failed ({e}), falling back to simulation")
            return AIService._get_simulated_result(model_id, crop_type)

    @staticmethod
    def _get_simulated_result(model_id: str, crop_type: Optional[str]) -> dict:
        disease = f"{crop_type.title() if crop_type else 'Plant'} Disease detected (Simulated)"
        return {
            "suggested_disease": disease,
            "confidence_score": 0.85,
            "raw_ai_output": {"predictions": [{"label": "simulated", "score": 0.85}], "model": model_id},
            "model_used": model_id,
            "priority_review": False,
            "auto_complete": False,
        }

# Global function for backward compatibility with router
async def run_inference(image_url: str, crop_type: Optional[str] = None) -> dict:
    return await AIService.run_inference(image_url, crop_type)
