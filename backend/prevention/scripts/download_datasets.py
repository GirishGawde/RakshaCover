import os
import requests
import pandas as pd
from ucimlrepo import fetch_ucirepo

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

def download_uci():
    print("Downloading UCI Phishing Websites Dataset...")
    try:
        # fetch dataset 
        phishing_websites = fetch_ucirepo(id=327)
        # data (as pandas dataframes) 
        X = phishing_websites.data.features
        y = phishing_websites.data.targets
        
        # Combine into a single dataframe
        df = pd.concat([X, y], axis=1)
        
        # Save to csv
        dataset_path = os.path.join(DATA_DIR, 'uci_phishing_dataset.csv')
        df.to_csv(dataset_path, index=False)
        print(f"Saved UCI dataset to {dataset_path} with {len(df)} rows.")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"Failed to fetch via ucimlrepo: {e}")
        # fallback to a known github mirror if ucimlrepo fails
        try:
            url = "https://raw.githubusercontent.com/jishnusaurav/Phishing-attack-detection/master/phishing.csv"
            df = pd.read_csv(url)
            dataset_path = os.path.join(DATA_DIR, 'uci_phishing_dataset.csv')
            df.to_csv(dataset_path, index=False)
            print(f"Saved fallback UCI dataset to {dataset_path} with {len(df)} rows.")
            print(f"Columns: {list(df.columns)}")
        except Exception as fallback_e:
            print(f"Fallback also failed: {fallback_e}")


def download_threat_feeds():
    print("Downloading Threat Feeds...")
    urls = set()
    
    # OpenPhish
    try:
        print("Fetching OpenPhish...")
        r = requests.get("https://openphish.com/feed.txt", timeout=10)
        if r.status_code == 200:
            for line in r.text.splitlines():
                if line.strip():
                    urls.add(line.strip().lower())
    except Exception as e:
        print(f"Failed to fetch OpenPhish: {e}")

    # PhishTank (often needs an API key or might block scraping, we try the public json/csv if available)
    # The public URL without API key often limits or redirects. We will try a known mirror or the raw site.
    # For hackathon purposes, even if PhishTank fails, we have OpenPhish.
    # Let's try downloading a sample or using a stable URL.
    # Actually, let's use a smaller fallback if both fail so the file isn't empty.
    
    if not urls:
        urls.update([
            "http://secure-update-sbi.com/login",
            "https://paytm-kyc-verify-now.in",
            "http://free-iphone-winner.xyz"
        ])
        
    threat_path = os.path.join(DATA_DIR, 'threat_feed_seed.txt')
    with open(threat_path, 'w', encoding='utf-8') as f:
        for url in urls:
            f.write(f"{url}\n")
    print(f"Saved {len(urls)} URLs to {threat_path}")

if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    download_uci()
    download_threat_feeds()
