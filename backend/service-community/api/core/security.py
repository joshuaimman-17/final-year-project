import os
from typing import Optional
from fastapi import Header, HTTPException, Depends
from firebase_admin import auth, credentials, initialize_app
import firebase_admin

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_CONTENT")
        if service_account_info:
            import json
            cred = credentials.Certificate(json.loads(service_account_info))
        else:
            cred = credentials.Certificate("firebase-credentials.json")
        initialize_app(cred)
        print("Firebase Admin successfully initialized in Community Service")
    except Exception as e:
        print(f"Warning: Firebase failed to initialize in Community Service: {e}")

async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        print("DEBUG: No authorization header received in Community Service")
        raise HTTPException(status_code=401, detail="Missing authorization header")
        
    if not authorization.startswith("Bearer "):
        print(f"DEBUG: Invalid authorization header format in Community Service: {authorization[:20]}...")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"DEBUG: Token verification failed in Community Service: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user_uid(decoded_token: dict = Depends(verify_token)) -> str:
    return decoded_token.get("uid")

def check_role(required_role: str):
    def role_checker(decoded_token: dict = Depends(verify_token)):
        user_role = decoded_token.get("role", "FARMER")
        if user_role != required_role and user_role != "ADMIN" and user_role != "SUPERADMIN":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return decoded_token
    return role_checker
