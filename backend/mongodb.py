"""
MongoDB initialization and utilities.
"""
from pymongo import MongoClient
from config import settings
import os

# Initialize MongoDB connection
_client = None
_db = None


def get_mongodb():
    """Get MongoDB database connection."""
    global _client, _db
    
    if _db is None:
        try:
            # Support both MONGODB_URI and MONGODB_URL (backwards compatibility)
            mongo_url = (
                os.getenv("MONGODB_URI") or 
                settings.MONGODB_URI or 
                os.getenv("MONGODB_URL") or 
                settings.MONGODB_URL or 
                "mongodb://localhost:27017"
            )
            db_name = os.getenv("MONGODB_DB", settings.MONGODB_DB)
            
            _client = MongoClient(mongo_url)
            _db = _client[db_name]
            
            # Verify connection
            _client.admin.command('ping')
            print(f"✓ Connected to MongoDB: {db_name}")
        except Exception as e:
            print(f"✗ MongoDB connection failed: {e}")
            print("  Falling back to in-memory auth (demo mode)")
            _db = None
    
    return _db


def close_mongodb():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        _client = None


def get_users_collection():
    """Get users collection from MongoDB."""
    db = get_mongodb()
    if db:
        return db['users']
    return None


def get_user_by_email(email: str):
    """Find user by email in MongoDB."""
    collection = get_users_collection()
    if collection:
        return collection.find_one({"email": email})
    return None


def get_user_by_id(user_id: str):
    """Find user by ID in MongoDB."""
    collection = get_users_collection()
    if collection:
        from bson import ObjectId
        try:
            return collection.find_one({"_id": ObjectId(user_id)})
        except:
            return collection.find_one({"user_id": user_id})
    return None


def create_user(user_data: dict):
    """Create a new user in MongoDB."""
    collection = get_users_collection()
    if collection:
        result = collection.insert_one(user_data)
        return result.inserted_id
    return None


def update_user(user_id: str, update_data: dict):
    """Update user in MongoDB."""
    collection = get_users_collection()
    if collection:
        from bson import ObjectId
        try:
            result = collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except:
            result = collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
    return False
