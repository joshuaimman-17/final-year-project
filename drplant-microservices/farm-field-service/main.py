from fastapi import FastAPI, Depends, HTTPException
from models import FarmCreate, Farm
import sys
import os
from bson import ObjectId

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import get_database
from shared.rbac import RequirePermission, get_current_user

app = FastAPI(title="Farm & Field Service")

async def get_db():
    return get_database("farm_db")

@app.post("/farms", dependencies=[Depends(RequirePermission("create_farm"))])
async def create_farm(farm: FarmCreate, user=Depends(get_current_user), db=Depends(get_db)):
    farm_dict = farm.dict()
    farm_dict["owner_id"] = user["sub"]
    
    result = await db.farms.insert_one(farm_dict)
    farm_dict["_id"] = str(result.inserted_id)
    return farm_dict

@app.get("/farms")
async def get_my_farms(user=Depends(get_current_user), db=Depends(get_db)):
    farms = await db.farms.find({"owner_id": user["sub"]}).to_list(100)
    for f in farms:
        f["_id"] = str(f["_id"])
    return farms
