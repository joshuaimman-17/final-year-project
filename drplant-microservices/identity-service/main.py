from fastapi import FastAPI, HTTPException, Depends
from models import UserCreate, UserLogin, User, Role
from passlib.context import CryptContext
import jwt
import os
import sys

# Hack to import from shared
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import get_database
from shared.rbac import get_current_user, RequirePermission

app = FastAPI(title="Identity Service")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")

async def get_db():
    return get_database("identity_db")

@app.post("/auth/register")
async def register(user: UserCreate, db=Depends(get_db)):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pass = pwd_context.hash(user.password)
    new_user = {"email": user.email, "hashed_password": hashed_pass, "role": user.role, "is_verified": user.role == 'farmer'}
    
    # In reality, fetch role permissions from db.roles
    await db.users.insert_one(new_user)
    return {"message": "User created successfully"}

@app.post("/auth/login")
async def login(user: UserLogin, db=Depends(get_db)):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Hardcoded permissions fetcher for example logic
    permissions_map = {
        "farmer": ["create_farm", "upload_image", "run_diagnosis", "sell_crop"],
        "expert": ["approve_diagnosis", "create_recommendation", "monitor_region"],
        "admin": ["manage_users", "deploy_model", "view_audit_logs"]
    }
    
    payload = {
        "sub": str(db_user["_id"]),
        "email": db_user["email"],
        "role": db_user["role"],
        "permissions": permissions_map.get(db_user["role"], [])
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

@app.get("/admin/users", dependencies=[Depends(RequirePermission("manage_users"))])
async def list_users(db=Depends(get_db)):
    users = await db.users.find().to_list(100)
    for u in users:
        u["_id"] = str(u["_id"])
    return users
