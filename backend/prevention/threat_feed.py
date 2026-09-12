"""
threat_feed.py
Checks the URL/domain against a locally cached PhishTank/OpenPhish feed.
Part of the algorithm specs (Rule 3).
"""
import os
import threading
import requests
from urllib.parse import urlparse

# In a real scenario, this would download large datasets periodically.
# For the hackathon, we use a cached text file populated by our setup script.

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
THREAT_FEED_FILE = os.path.join(DATA_DIR, 'threat_feed_seed.txt')

threat_cache = {
    "urls": set(),
    "domains": set()
}

def load_threat_feeds():
    """
    Loads threat feeds from the local seed file.
    """
    try:
        urls = set()
        domains = set()
        if os.path.exists(THREAT_FEED_FILE):
            with open(THREAT_FEED_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    url = line.strip().lower()
                    if url:
                        urls.add(url)
                        # Extract domain
                        parsed = urlparse(url if '://' in url else 'http://' + url)
                        if parsed.hostname:
                            domains.add(parsed.hostname)
        else:
            print(f"Warning: Threat feed file not found at {THREAT_FEED_FILE}")
            
        threat_cache["urls"] = urls
        threat_cache["domains"] = domains
        print(f"Loaded {len(urls)} URLs and {len(domains)} domains into threat cache.")
    except Exception as e:
        print(f"Warning: Failed to load threat feeds. Using empty set. {e}")
        threat_cache["urls"] = set()
        threat_cache["domains"] = set()

def check_threat_feed(url: str) -> dict:
    """
    Checks if URL or its domain is in the threat feed cache.
    Returns flagged=True and max score (100) if found.
    """
    url_lower = url.lower()
    parsed = urlparse(url_lower if '://' in url_lower else 'http://' + url_lower)
    domain = parsed.hostname
    
    if url_lower in threat_cache["urls"] or domain in threat_cache["domains"]:
        return {"flagged": True, "score": 100, "detail": "Match found in PhishTank/OpenPhish feed"}
        
    return {"flagged": False, "score": 0, "detail": "Not found in threat feeds"}
