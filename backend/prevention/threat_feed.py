"""
threat_feed.py
Checks the URL/domain against a locally cached PhishTank/OpenPhish feed.
Part of the algorithm specs (Rule 3).
"""
import threading
import requests

# In a real scenario, this would download large datasets periodically.
# For the hackathon, we use a small mocked set of dangerous URLs and domains.
# To satisfy the requirement of not crashing if external call fails, we wrap in try/except.

MOCKED_FEED_URLS = {
    "http://secure-update-sbi.com/login",
    "https://paytm-kyc-verify-now.in",
    "http://free-iphone-winner.xyz"
}

MOCKED_FEED_DOMAINS = {
    "secure-update-sbi.com",
    "paytm-kyc-verify-now.in",
    "free-iphone-winner.xyz"
}

threat_cache = {
    "urls": set(),
    "domains": set()
}

def load_threat_feeds():
    """
    Simulates downloading threat feeds at startup.
    Fails gracefully if "download" fails.
    """
    try:
        # Simulate network request to fetch feeds
        # response = requests.get("https://openphish.com/feed.txt", timeout=5)
        # response.raise_for_status()
        
        # Using mocked data for now to avoid dependency on external APIs rate limits
        threat_cache["urls"] = MOCKED_FEED_URLS
        threat_cache["domains"] = MOCKED_FEED_DOMAINS
    except Exception as e:
        print(f"Warning: Failed to load threat feeds. Using empty set. {e}")
        threat_cache["urls"] = set()
        threat_cache["domains"] = set()

def check_threat_feed(url: str) -> dict:
    """
    Checks if URL or its domain is in the threat feed cache.
    Returns flagged=True and max score (100) if found.
    """
    from urllib.parse import urlparse
    
    # Strip protocol for simple checking sometimes
    parsed = urlparse(url if '://' in url else 'http://' + url)
    domain = parsed.hostname
    
    if url in threat_cache["urls"] or domain in threat_cache["domains"]:
        return {"flagged": True, "score": 100, "detail": "Match found in PhishTank/OpenPhish feed"}
        
    return {"flagged": False, "score": 0, "detail": "Not found in threat feeds"}
