"""
routes.py
FastAPI routes for the Prevention service.
Endpoints: /check/link, /check/qr, /check/upi
"""
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from domain_check import check_domain
from whois_ssl_check import check_domain_age, check_ssl
from threat_feed import check_threat_feed
from classifier import check_classifier
from qr_check import decode_qr_image, parse_qr_data, validate_vpa
from upi_lookup import check_upi_reputation
import sys
from pathlib import Path

# Add hooks directory to path for the guardian hook
sys.path.append(str(Path(__file__).resolve().parent))
from hooks.guardian_hook import trigger_guardian_alert

router = APIRouter()

class LinkCheckRequest(BaseModel):
    url: str
    userId: Optional[str] = "demo_parent_user"

class QRCheckRequest(BaseModel):
    qr_raw_data: Optional[str] = None
    qr_image_base64: Optional[str] = None
    userId: Optional[str] = "demo_parent_user"

class UPICheckRequest(BaseModel):
    vpa: str
    userId: Optional[str] = "demo_parent_user"

def aggregate_link_score(url: str):
    signals = []
    
    # Run checks
    tf_res = check_threat_feed(url)
    signals.append({"check": "threat_feed", "flagged": tf_res["flagged"], "detail": tf_res["detail"]})
    
    dl_res = check_domain(url)
    signals.append({"check": "domain_lookalike", "flagged": dl_res["flagged"], "detail": dl_res["detail"]})
    
    da_res = check_domain_age(url)
    signals.append({"check": "domain_age", "flagged": da_res["flagged"], "detail": da_res["detail"]})
    
    ssl_res = check_ssl(url)
    signals.append({"check": "ssl_cert", "flagged": ssl_res["flagged"], "detail": ssl_res["detail"]})
    
    ml_res = check_classifier(url)
    signals.append({"check": "ml_classifier", "flagged": ml_res["flagged"], "detail": ml_res["detail"]})
    
    # Calculate score
    # weights: threat_feed=40, domain_lookalike=25, ml_classifier=20, domain_age=10, ssl_cert=5
    total_score = 0
    total_score += (tf_res["score"] / 100.0) * 40
    total_score += (dl_res["score"] / 100.0) * 25
    total_score += (ml_res["score"] / 100.0) * 20
    total_score += (da_res["score"] / 100.0) * 10
    total_score += (ssl_res["score"] / 100.0) * 5
    
    risk_score = min(100, int(total_score))
    
    # Verdict logic
    if tf_res["flagged"]:  # Any single dangerous signal (threat feed hit)
        verdict = "dangerous"
    elif risk_score >= 50:
        verdict = "dangerous"
    elif risk_score >= 20:
        verdict = "suspicious"
    else:
        verdict = "safe"
        
    return risk_score, verdict, signals

@router.post("/check/link")
def check_link(req: LinkCheckRequest):
    risk_score, verdict, signals = aggregate_link_score(req.url)
    
    if risk_score >= 50:
        trigger_guardian_alert(req.userId, "malicious_link", risk_score)
        
    return {
        "url": req.url,
        "risk_score": risk_score,
        "verdict": verdict,
        "signals": signals
    }

@router.post("/check/qr")
def check_qr(req: QRCheckRequest):
    qr_data = req.qr_raw_data
    if req.qr_image_base64:
        decoded = decode_qr_image(req.qr_image_base64)
        if decoded:
            qr_data = decoded
            
    parsed = parse_qr_data(qr_data)
    
    if parsed["type"] == "url":
        risk_score, verdict, signals = aggregate_link_score(parsed["url"])
        
        if risk_score >= 50:
            trigger_guardian_alert(req.userId, "malicious_qr", risk_score)
            
        return {
            "decoded_type": "url",
            "vpa": None,
            "risk_score": risk_score,
            "verdict": verdict,
            "signals": signals
        }
    elif parsed["type"] == "upi":
        vpa_res = validate_vpa(parsed["vpa"])
        risk_score = vpa_res["score"]
        verdict = "suspicious" if vpa_res["flagged"] else "safe"
        
        if vpa_res["flagged"]:
            trigger_guardian_alert(req.userId, "suspicious_upi", risk_score)
            
        return {
            "decoded_type": "upi",
            "vpa": parsed["vpa"],
            "risk_score": risk_score,
            "verdict": verdict,
            "signals": [
                {"check": "vpa_format", "flagged": vpa_res["flagged"], "detail": vpa_res["detail"]}
            ]
        }
    else:
        return {
            "decoded_type": "unknown",
            "vpa": None,
            "risk_score": 100,
            "verdict": "suspicious",
            "signals": [
                {"check": "qr_content", "flagged": True, "detail": "Unrecognized QR content format"}
            ]
        }

@router.post("/check/upi")
def check_upi(req: UPICheckRequest):
    return check_upi_reputation(req.vpa)
