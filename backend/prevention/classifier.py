"""
classifier.py
Trains a Logistic Regression model on startup using URL lexical features.
Part of the algorithm specs (Rule 4).
"""
import os
import re
import pandas as pd
from urllib.parse import urlparse
from sklearn.linear_model import LogisticRegression

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'data', 'uci_phishing_dataset.csv')

model = None
# We select a subset of UCI features that we can easily compute from a raw URL
feature_names = [
    'having_ip_address',
    'url_length',
    'having_at_symbol',
    'prefix_suffix',
    'having_sub_domain'
]

def extract_features(url: str) -> dict:
    parsed = urlparse(url if '://' in url else 'http://' + url)
    hostname = parsed.hostname or ''
    
    # having_ip_address: -1 if IP, 1 otherwise
    ip_pattern = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
    having_ip_address = -1 if ip_pattern.match(hostname) else 1
    
    # url_length: 1 if < 54, 0 if 54<=length<=75, -1 if >75
    length = len(url)
    if length < 54:
        url_length = 1
    elif length <= 75:
        url_length = 0
    else:
        url_length = -1
        
    # having_at_symbol: -1 if @ present, 1 otherwise
    having_at_symbol = -1 if '@' in url else 1
    
    # prefix_suffix: -1 if dash in hostname, 1 otherwise
    prefix_suffix = -1 if '-' in hostname else 1
    
    # having_sub_domain: dots in domain
    # e.g., www.google.com -> 2 dots, google.com -> 1 dot
    # We ignore www. if present for counting subdomains roughly
    clean_host = hostname.replace('www.', '')
    dots = clean_host.count('.')
    if dots == 1:
        having_sub_domain = 1
    elif dots == 2:
        having_sub_domain = 0
    else:
        having_sub_domain = -1
        
    return {
        'having_ip_address': having_ip_address,
        'url_length': url_length,
        'having_at_symbol': having_at_symbol,
        'prefix_suffix': prefix_suffix,
        'having_sub_domain': having_sub_domain
    }

def train_model():
    global model
    if not os.path.exists(DATASET_PATH):
        print(f"Warning: Dataset not found at {DATASET_PATH}. ML classifier won't work.")
        return
        
    df = pd.read_csv(DATASET_PATH)
    
    required_cols = set(feature_names + ['result'])
    if not required_cols.issubset(df.columns):
        print(f"Warning: Dataset missing required columns. Available: {df.columns}")
        return
        
    X = df[feature_names]
    # UCI dataset result is 1 (legitimate) and -1 (phishing)
    # We map phishing (-1) to 1, and legitimate (1) to 0 for LogisticRegression
    y = df['result'].apply(lambda x: 1 if x == -1 else 0)
    
    clf = LogisticRegression(random_state=42, max_iter=1000)
    try:
        clf.fit(X, y)
        model = clf
        print("ML classifier trained successfully.")
    except Exception as e:
        print(f"Warning: Model training failed. {e}")

def check_classifier(url: str) -> dict:
    if model is None:
        return {"flagged": False, "score": 0, "detail": "Model not loaded"}
        
    features_dict = extract_features(url)
    
    import pandas as pd
    X_pred = pd.DataFrame([features_dict])
    
    proba = model.predict_proba(X_pred)[0]
    # Class 1 is phishing based on our mapping
    phish_prob = proba[1]
    
    contributions = {}
    for i, feature in enumerate(feature_names):
        val = features_dict[feature]
        coef = model.coef_[0][i]
        contributions[feature] = val * coef
        
    top_features = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)[:2]
    
    explain_str = ", ".join([f"{f}={features_dict[f]} (wt: {round(val, 2)})" for f, val in top_features])
    
    score = int(phish_prob * 100)
    flagged = score >= 50
    
    return {
        "flagged": flagged,
        "score": score,
        "detail": f"ML prob: {score}%. Top features: {explain_str}"
    }
