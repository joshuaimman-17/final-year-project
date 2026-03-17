import os
from motor.motor_asyncio import AsyncIOMotorClient

def get_database(db_name: str):
    """
    Returns an AsyncIOMotorDatabase instance.
    Each microservice must connect to its own separate logical database.
    """
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    return client[db_name]
