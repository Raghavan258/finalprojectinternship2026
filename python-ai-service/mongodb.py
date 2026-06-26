"""
mongodb.py — MongoDB Connection for EMS Database
=================================================
Provides a lazy singleton connection to the EMS MongoDB Atlas cluster.
Collections available: db.events, db.users, db.registrations, etc.

Usage:
    from mongodb import get_db
    db = get_db()
    events = list(db.events.find({}, {"_id": 0}))
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

load_dotenv()

_client: MongoClient | None = None
_db: Database | None = None

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://venkataraghavan:Ems%4012345@ems-cluster.ht0h4cq.mongodb.net/?appName=EMS-Cluster",
)
MONGODB_DB = os.getenv("MONGODB_DB", "event_management_system")


def get_client() -> MongoClient:
    """Return (or create) the shared MongoClient instance."""
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_db() -> Database:
    """Return (or create) the EMS database handle."""
    global _db
    if _db is None:
        _db = get_client()[MONGODB_DB]
    return _db


def ping() -> bool:
    """Return True if the MongoDB connection is healthy."""
    try:
        get_client().admin.command("ping")
        return True
    except Exception as e:
        print(f"❌ MongoDB ping failed: {e}")
        return False
