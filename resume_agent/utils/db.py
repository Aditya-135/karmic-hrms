from pymongo import MongoClient

# Connecting to local MongoDB server
MONGO_URL = "mongodb://localhost:27017"
client = MongoClient(MONGO_URL)
db = client["hrms_karmic"]
users_collection = db["users"]
