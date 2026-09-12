import sys
import os
from pathlib import Path

# Add backend root to sys.path so we can import shared
sys.path.append(str(Path(__file__).resolve().parent.parent))

from shared.db import get_db

def create_or_update_link(parent_user_id: str, guardian_email: str) -> dict:
    """Creates a new guardian link, or resets existing to 'pending' so Guardian can re-accept."""
    db = get_db()
    
    # Check if exists
    existing = db.table("guardian_links") \
                 .select("*") \
                 .eq("parent_user_id", parent_user_id) \
                 .eq("guardian_email", guardian_email) \
                 .execute()
                 
    if existing.data:
        # Reset to pending so Guardian sees a fresh request
        link_id = existing.data[0]["id"]
        result = db.table("guardian_links").update({"status": "pending"}).eq("id", link_id).execute()
        return result.data[0] if result.data else existing.data[0]
        
    # Insert new
    payload = {
        "parent_user_id": parent_user_id,
        "guardian_email": guardian_email,
        "status": "pending"
    }
    
    result = db.table("guardian_links").insert(payload).execute()
    return result.data[0] if result.data else {}

def accept_link(link_id: str) -> bool:
    """Updates a pending link to active."""
    db = get_db()
    result = db.table("guardian_links").update({"status": "active"}).eq("id", link_id).execute()
    return bool(result.data)

def get_link_status(link_id: str) -> str:
    db = get_db()
    result = db.table("guardian_links").select("status").eq("id", link_id).execute()
    if result.data:
        return result.data[0]["status"]
    return "unlinked"
