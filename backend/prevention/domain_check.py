"""
domain_check.py
Implements Levenshtein/RapidFuzz edit distance between a URL's hostname
and a whitelist of domains. Flags lookalikes (distance 1-3) with scaled risk.
Part of the algorithm specs (Rule 1).
"""
import os
import csv
from urllib.parse import urlparse
from rapidfuzz.distance import Levenshtein

WHITELIST_PATH = os.path.join(os.path.dirname(__file__), 'data', 'domain_whitelist.csv')

def load_whitelist():
    domains = []
    if not os.path.exists(WHITELIST_PATH):
        return domains
    with open(WHITELIST_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        for row in reader:
            if row:
                domains.append(row[0].strip().lower())
    return domains

WHITELIST = load_whitelist()

def get_hostname(url: str) -> str:
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'http://' + url
    parsed = urlparse(url)
    return parsed.hostname.lower() if parsed.hostname else ''

def check_domain(url: str) -> dict:
    """
    Returns a dictionary with 'flagged', 'score' (0-100), and 'detail'.
    Exact/subdomain match: score 0, not flagged.
    Distance 1: score 100
    Distance 2: score 66
    Distance 3: score 33
    Distance >3: score 0
    """
    hostname = get_hostname(url)
    if not hostname:
        return {"flagged": False, "score": 0, "detail": "Invalid URL or no hostname"}
    
    # Check exact or subdomain match first
    for domain in WHITELIST:
        if hostname == domain or hostname.endswith('.' + domain):
            return {"flagged": False, "score": 0, "detail": f"Matches trusted domain: {domain}"}
    
    # Check distance
    min_dist = float('inf')
    closest_domain = None
    
    for domain in WHITELIST:
        dist = Levenshtein.distance(hostname, domain)
        if dist < min_dist:
            min_dist = dist
            closest_domain = domain
            
    if min_dist == 1:
        return {"flagged": True, "score": 100, "detail": f"Lookalike domain (dist 1 to {closest_domain})"}
    elif min_dist == 2:
        return {"flagged": True, "score": 66, "detail": f"Lookalike domain (dist 2 to {closest_domain})"}
    elif min_dist == 3:
        return {"flagged": True, "score": 33, "detail": f"Lookalike domain (dist 3 to {closest_domain})"}
    
    # Substring fallback check for brand-stuffed domains
    for domain in WHITELIST:
        brand = domain.split('.')[0]
        # Ignore very short brands to reduce false positives
        if len(brand) > 2 and brand in hostname:
            return {"flagged": True, "score": 80, "detail": f"Suspicious brand substring found: {brand} (targets {domain})"}
            
    return {"flagged": False, "score": 0, "detail": "No lookalike found in whitelist"}
