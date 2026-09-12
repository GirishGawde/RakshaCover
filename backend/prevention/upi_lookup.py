"""
upi_lookup.py
Queries the external cluster/graph module to get reputation data for a UPI VPA.
Handles timeouts gracefully to allow the module to degrade if the service is down.
Part of the algorithm specs (Rule 6).
"""
import os
import requests

CLUSTER_SERVICE_URL = os.getenv("CLUSTER_SERVICE_URL", "http://localhost:8002")

def check_upi_reputation(vpa: str) -> dict:
    """
    Calls out to Module B to get report count and cluster confidence.
    Fails gracefully with verdict "unknown".
    """
    default_response = {
        "vpa": vpa,
        "report_count": 0,
        "cluster_confidence": 0.0,
        "verdict": "unknown",
        "note": "Not enough data yet (or service unreachable)"
    }
    
    try:
        url = f"{CLUSTER_SERVICE_URL}/cluster/graph"
        response = requests.get(url, params={"vpa": vpa}, timeout=2.0)
        
        if response.status_code == 200:
            data = response.json()
            report_count = data.get("report_count", 0)
            confidence = data.get("cluster_confidence", 0.0)
            
            if report_count > 0 or confidence > 0:
                verdict = "high_risk" if (report_count > 2 or confidence > 50.0) else "low_risk"
                note = f"Reported {report_count} times, matches cluster with {confidence}% confidence"
                return {
                    "vpa": vpa,
                    "report_count": report_count,
                    "cluster_confidence": confidence,
                    "verdict": verdict,
                    "note": note
                }
            return default_response
        else:
            return default_response
            
    except Exception as e:
        # Expected to fail if Module B isn't running yet
        print(f"Warning: Module B unreachable for UPI lookup: {e}")
        return default_response
