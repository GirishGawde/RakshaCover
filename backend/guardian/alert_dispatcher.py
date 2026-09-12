import sys
from pathlib import Path

# Add backend root to sys.path so we can import shared
sys.path.append(str(Path(__file__).resolve().parent.parent))

from shared.db import get_db

def dispatch_alert(parent_user_id: str, source_module: str, risk_type: str, risk_score: float) -> bool:
    """
    Finds any active guardians for the parent_user_id and inserts an alert for them.
    In a real app, this would also trigger an email/SMS or push notification API.
    For this demo, writing to Supabase realtime triggers the frontend dashboard.
    """
    db = get_db()
    
    # 1. Find active links for this parent
    links = db.table("guardian_links") \
              .select("id") \
              .eq("parent_user_id", parent_user_id) \
              .eq("status", "active") \
              .execute()
              
    if not links.data:
        print(f"[Guardian] No active guardians found for parent {parent_user_id}")
        return False
        
    # 2. Insert alert for each link
    success = False
    for link in links.data:
        payload = {
            "link_id": link["id"],
            "source_module": source_module,
            "risk_type": risk_type,
            "risk_score": risk_score,
            "status": "unread"
        }
        res = db.table("guardian_alerts").insert(payload).execute()
        if res.data:
            success = True
            print(f"[Guardian] Alert dispatched to Link ID: {link['id']}")
            
    return success
