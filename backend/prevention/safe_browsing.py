import os
import requests

SAFE_BROWSING_API_KEY = os.getenv("SAFE_BROWSING_API_KEY")
SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
QUOTA_LIMIT = 10000

# In-memory counter for soft quota limit
_request_count = 0

def check_safe_browsing(url: str) -> dict:
    """
    Checks the URL against Google Safe Browsing API.
    Returns: {"flagged": bool, "score": int, "detail": str}
    """
    global _request_count
    
    # Graceful degradation if no API key is provided
    if not SAFE_BROWSING_API_KEY:
        return {"flagged": False, "score": 0, "detail": "Safe Browsing skipped (no API key)"}
        
    # Enforce quota limit
    if _request_count >= QUOTA_LIMIT:
        return {"flagged": False, "score": 0, "detail": "Safe Browsing skipped (quota limit reached)"}

    payload = {
        "client": {
            "clientId": "RakshaCover",
            "clientVersion": "1.0"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [
                {"url": url}
            ]
        }
    }

    _request_count += 1
    
    try:
        response = requests.post(
            f"{SAFE_BROWSING_URL}?key={SAFE_BROWSING_API_KEY}",
            json=payload,
            timeout=2.5 # Strict 2.5-second timeout
        )
        response.raise_for_status()
        data = response.json()
        
        if "matches" in data and len(data["matches"]) > 0:
            return {"flagged": True, "score": 100, "detail": "Flagged by Google Safe Browsing"}
        else:
            return {"flagged": False, "score": 0, "detail": "Clean according to Safe Browsing"}

    except requests.exceptions.Timeout:
        return {"flagged": False, "score": 0, "detail": "Safe Browsing timeout"}
    except requests.exceptions.RequestException as e:
        return {"flagged": False, "score": 0, "detail": f"Safe Browsing check failed: {str(e)}"}
