import requests
import logging
from datetime import datetime, timezone

logger = logging.getLogger("guardian_hook")

def trigger_guardian_alert(parent_user_id: str, risk_type: str, risk_score: float):
    """
    Fires an alert to the Guardian module. 
    Fail-safe: Wrapped in try/except so it never blocks the main flow.
    """
    if not parent_user_id:
        return
        
    try:
        payload = {
            "parentUserId": parent_user_id,
            "sourceModule": "prevention",
            "riskType": risk_type,
            "riskScore": risk_score,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        # Fire and forget to the Guardian API (timeout=2s so we don't hang)
        res = requests.post("http://localhost:8000/guardian/alert", json=payload, timeout=2.0)
        if res.status_code == 200:
            logger.info(f"Guardian alert successfully dispatched from Prevention for user {parent_user_id}.")
    except Exception as e:
        logger.warning(f"Failed to trigger Guardian alert: {e}")
