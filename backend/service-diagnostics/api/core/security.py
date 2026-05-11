import os
from typing import Optional
from fastapi import Header, HTTPException, Depends
from firebase_admin import auth, credentials, initialize_app
import firebase_admin
from dotenv import load_dotenv

load_dotenv()

if not firebase_admin._apps:
    try:
        service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_CONTENT")
        if service_account_info:
            import json
            cred = credentials.Certificate(json.loads(service_account_info))
        else:
            cred = credentials.Certificate("firebase-credentials.json")
        initialize_app(cred)
    except Exception as e:
        print(f"Warning: Firebase failed to initialize: {e}")

async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        return auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user_uid(decoded_token: dict = Depends(verify_token)) -> str:
    return decoded_token.get("uid")

def require_role(required_role: str):
    def role_checker(decoded_token: dict = Depends(verify_token)):
        user_role = decoded_token.get("role", "FARMER")
        if user_role != required_role and user_role not in ("ADMIN", "SUPERADMIN"):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return decoded_token
    return role_checker
