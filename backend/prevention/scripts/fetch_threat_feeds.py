import os
import urllib.request
import csv
import io
from urllib.parse import urlparse

# URLs for feeds
OPENPHISH_URL = "https://openphish.com/feed.txt"
URLHAUS_URL = "https://urlhaus.abuse.ch/downloads/text_online/"
PHISHTANK_URL = "http://data.phishtank.com/data/online-valid.csv"

# Target file path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "data")
SEED_FILE = os.path.join(DATA_DIR, "threat_feed_seed.txt")

def extract_domain(url):
    try:
        # Sometimes URLs lack scheme, add it for parsing
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "http://" + url
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if ":" in domain:
            domain = domain.split(":")[0]
        return domain.strip()
    except Exception:
        return None

def fetch_openphish():
    print("Fetching OpenPhish...")
    domains = set()
    try:
        req = urllib.request.Request(OPENPHISH_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            for line in content.splitlines():
                line = line.strip()
                if line:
                    domain = extract_domain(line)
                    if domain:
                        domains.add(domain)
        print(f"OpenPhish: Extracted {len(domains)} domains.")
    except Exception as e:
        print(f"Failed to fetch OpenPhish: {e}")
    return domains

def fetch_urlhaus():
    print("Fetching URLhaus...")
    domains = set()
    try:
        req = urllib.request.Request(URLHAUS_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            for line in content.splitlines():
                line = line.strip()
                # skip comments and empty lines
                if line and not line.startswith('#'):
                    domain = extract_domain(line)
                    if domain:
                        domains.add(domain)
        print(f"URLhaus: Extracted {len(domains)} domains.")
    except Exception as e:
        print(f"Failed to fetch URLhaus: {e}")
    return domains

def fetch_phishtank():
    print("Fetching PhishTank...")
    domains = set()
    try:
        req = urllib.request.Request(PHISHTANK_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                if 'url' in row:
                    domain = extract_domain(row['url'])
                    if domain:
                        domains.add(domain)
        print(f"PhishTank: Extracted {len(domains)} domains.")
    except Exception as e:
        print(f"Failed to fetch PhishTank: {e}")
    return domains

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    all_domains = set()
    all_domains.update(fetch_openphish())
    all_domains.update(fetch_urlhaus())
    all_domains.update(fetch_phishtank())
    
    # Also load the existing seed if we just want to replace it entirely
    # Actually, the user asked to "Overwrites the existing seed file."
    
    print(f"Writing {len(all_domains)} total unique domains to {SEED_FILE}")
    with open(SEED_FILE, 'w', encoding='utf-8') as f:
        for domain in sorted(all_domains):
            f.write(domain + '\n')
            
    print("Done!")

if __name__ == "__main__":
    main()
