"""
whois_ssl_check.py
Fetches domain age via python-whois and penalizes younger domains.
Checks SSL certificate via `ssl` for self-signed, expired, or CN mismatch.
Part of the algorithm specs (Rule 2).
"""
import ssl
import socket
import whois
from datetime import datetime, timezone
from urllib.parse import urlparse

def get_domain_age_days(domain: str) -> int:
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        if not creation_date:
            return -1
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        
        # Ensure aware or naive datetime handles correctly
        now = datetime.now()
        if creation_date.tzinfo:
            now = datetime.now(timezone.utc)
            
        age = (now - creation_date).days
        return age
    except Exception:
        return -1

def check_domain_age(url: str) -> dict:
    parsed = urlparse(url if '://' in url else 'http://' + url)
    domain = parsed.hostname
    if not domain:
        return {"flagged": False, "score": 0, "detail": "Invalid domain"}
        
    age_days = get_domain_age_days(domain)
    if age_days == -1:
        return {"flagged": False, "score": 0, "detail": "Could not determine domain age (graceful fallback)"}
        
    if age_days < 7:
        return {"flagged": True, "score": 100, "detail": f"Domain very new ({age_days} days old)"}
    elif age_days < 90:
        return {"flagged": True, "score": 50, "detail": f"Domain somewhat new ({age_days} days old)"}
    else:
        return {"flagged": False, "score": 0, "detail": f"Domain age OK ({age_days} days old)"}

def check_ssl(url: str) -> dict:
    parsed = urlparse(url if '://' in url else 'http://' + url)
    hostname = parsed.hostname
    if not hostname:
        return {"flagged": False, "score": 0, "detail": "Invalid hostname"}
        
    port = parsed.port or 443
    context = ssl.create_default_context()
    
    # We want to catch cert errors, so we handle them explicitly
    try:
        with socket.create_connection((hostname, port), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                # Check expiration
                if 'notAfter' in cert:
                    expire_date = ssl.cert_time_to_seconds(cert['notAfter'])
                    if expire_date < datetime.now().timestamp():
                        return {"flagged": True, "score": 100, "detail": "SSL Certificate expired"}
                        
                # Note: create_default_context already verifies the certificate validity and hostname match.
                # If we get here, it means it's not self-signed (signed by trusted CA) and hostname matches.
                return {"flagged": False, "score": 0, "detail": "Valid SSL certificate"}
    except ssl.SSLCertVerificationError as e:
        return {"flagged": True, "score": 100, "detail": f"SSL verification failed: {str(e)} (Self-signed or mismatch)"}
    except Exception as e:
        return {"flagged": False, "score": 0, "detail": f"SSL check failed or timed out: {str(e)} (graceful fallback)"}
