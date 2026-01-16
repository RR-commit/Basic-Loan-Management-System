
# app/mongo.py
from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.MONGODB_URL)
mongo_db = client[settings.MONGODB_DB]

# Collections we use
risk_logs = mongo_db["risk_logs"]


def get_mongo_db():
    """
    Return the MongoDB database instance for storing audit logs.
    """
    return mongo_db
