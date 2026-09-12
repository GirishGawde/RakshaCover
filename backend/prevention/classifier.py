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
feature_names = ['url_length', 'num_dots', 'has_at', 'ip_host']

def extract_features(url: str) -> dict:
    parsed = urlparse(url if '://' in url else 'http://' + url)
    hostname = parsed.hostname or ''
    
    # Check if hostname is an IP
    ip_pattern = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
    is_ip = 1 if ip_pattern.match(hostname) else 0
    
    return {
        'url_length': len(url),
        'num_dots': url.count('.'),
        'has_at': 1 if '@' in url else 0,
        'ip_host': is_ip
    }

def train_model():
    global model
    if not os.path.exists(DATASET_PATH):
        print(f"Warning: Dataset not found at {DATASET_PATH}. ML classifier won't work.")
        return
        
    df = pd.read_csv(DATASET_PATH)
    
    # Simple check to ensure we have the required columns
    required_cols = set(feature_names + ['class'])
    if not required_cols.issubset(df.columns):
        print("Warning: Dataset missing required columns.")
        return
        
    X = df[feature_names]
    y = df['class']
    
    # Train Logistic Regression
    clf = LogisticRegression(random_state=42, max_iter=1000)
    # Wrap in try/except in case of insufficient classes
    try:
        clf.fit(X, y)
        model = clf
    except Exception as e:
        print(f"Warning: Model training failed. {e}")

def check_classifier(url: str) -> dict:
    if model is None:
        return {"flagged": False, "score": 0, "detail": "Model not loaded"}
        
    features_dict = extract_features(url)
    
    # Convert to DataFrame to avoid warnings about feature names
    import pandas as pd
    X_pred = pd.DataFrame([features_dict])
    
    proba = model.predict_proba(X_pred)[0]
    # Class 1 is phishing
    phish_prob = proba[1]
    
    # Calculate feature contributions for explainability
    # For logistic regression: contribution = feature_value * coefficient
    contributions = {}
    for i, feature in enumerate(feature_names):
        val = features_dict[feature]
        coef = model.coef_[0][i]
        contributions[feature] = val * coef
        
    # Get top 2 features driving the prediction
    # Sort by absolute contribution value, descending
    top_features = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)[:2]
    
    explain_str = ", ".join([f"{f}={features_dict[f]} (wt: {round(val, 2)})" for f, val in top_features])
    
    score = int(phish_prob * 100)
    flagged = score >= 50
    
    return {
        "flagged": flagged,
        "score": score,
        "detail": f"ML prob: {score}%. Top features: {explain_str}"
    }
