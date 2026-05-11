import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

def get_firestore_db():
    if not firebase_admin._apps:
        try:
            service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_CONTENT")
            if service_account_info:
                import json
                cred = credentials.Certificate(json.loads(service_account_info))
            else:
                # Use absolute path to shared credentials if possible, or local copy
                cred = credentials.Certificate("firebase-credentials.json")
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Firestore Initialization Error: {e}")
            raise e
    
    return firestore.client()
