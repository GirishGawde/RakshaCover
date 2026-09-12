# backend/aftermath/routes.py
#
# Route handlers for Module C (Aftermath & Recovery).
#
# Endpoints:
#   POST /aftermath/intake  — intake form, urgency scoring, alert flags
#   POST /aftermath/report  — generate formatted complaint report
#   GET  /aftermath/report/download/{case_id}  — PDF download (optional, after CP2)
#
# BB1 (Build Block 1): uses _case_store (in-memory dict) for fast iteration.
# BB2 (Build Block 2): swap _case_store for Supabase INSERT/SELECT — see Step 2.4.

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from classifier import FraudType, classify_and_validate
from urgency_score import compute_urgency
from digital_arrest_shield import check_digital_arrest
from exit_risk import check_exit_risk
from report_generator import generate_report, generate_pdf_bytes
from db import get_supabase

router = APIRouter()

# BB1: in-memory store — replace with Supabase in BB2
_case_store: Dict[str, dict] = {}

# BB2 demo fallback: if Supabase is flaky during the demo, swap back to _case_store
DEMO_CASE: Optional[dict] = None  # set a hardcoded dict here as last resort


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class IntakeRequest(BaseModel):
    fraud_type: FraudType
    victim_name: Optional[str] = None
    victim_contact: Optional[str] = None
    incident_timestamp: datetime
    amount_lost: Optional[float] = 0.0
    currency: str = "INR"
    receiving_upi_id: Optional[str] = None
    receiving_account: Optional[str] = None
    digital_arrest_signals: List[str] = []
    evidence_text: Optional[str] = ""
    evidence_fields: Dict[str, Any] = {}

    # Fix 3: reject naive timestamps with a clean 422 at the API boundary.
    # A frontend sending IST as naive UTC adds 330 min to delta_minutes,
    # immediately dropping urgency to LOW — silently wrong and dangerous.
    @field_validator("incident_timestamp")
    @classmethod
    def require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError(
                "incident_timestamp must include a UTC offset "
                "(e.g. 2024-01-01T10:30:00+05:30 for IST). "
                "Naive timestamps are rejected to prevent IST/UTC confusion."
            )
        return v


class IntakeResponse(BaseModel):
    case_id: str
    fraud_type: str
    urgency_score: float
    urgency_label: str
    exit_risk_flag: bool
    digital_arrest_alert: bool
    matched_da_conditions: List[str]
    minutes_elapsed: int
    next_steps: List[str]


class ClusterContext(BaseModel):
    cluster_id: Optional[str] = None
    cluster_size: int = 0
    cluster_confidence: float = 0.0
    similar_cases_summary: str = ""


class ReportRequest(BaseModel):
    case_id: str
    cluster_context: Optional[ClusterContext] = None


class ReportResponse(BaseModel):
    case_id: str
    report_format: str
    report_html: str
    report_text: str
    download_url: Optional[str] = None


# ---------------------------------------------------------------------------
# POST /aftermath/intake
# ---------------------------------------------------------------------------

@router.post("/aftermath/intake", response_model=IntakeResponse)
def aftermath_intake(payload: IntakeRequest):
    # 1. Validate fraud-type evidence fields.
    #    Fix 4: use _validated_evidence (Pydantic-scrubbed) — NOT raw payload.evidence_fields.
    try:
        _validated_evidence, next_steps = classify_and_validate(
            payload.fraud_type, payload.evidence_fields
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Evidence validation error: {e}")

    # 2. Compute urgency score.
    #    Fix 3: field_validator above guarantees tzinfo is set; compute_urgency also
    #    raises ValueError on naive timestamps as a second line of defence.
    urgency = compute_urgency(payload.incident_timestamp)

    # 3. Digital Arrest Shield check.
    da_result = check_digital_arrest(payload.digital_arrest_signals)

    # 4. Exit-risk flag (Fix 2: both UPI ID and account are checked independently).
    exit_risk = check_exit_risk(
        upi_id=payload.receiving_upi_id,
        account=payload.receiving_account,
    )

    # 5. Persist case.
    #    BB1: in-memory store.
    #    BB2: replace with Supabase INSERT (see Step 2.4 in modc.md).
    case_id = str(uuid.uuid4())
    
    # We create the case dictionary for both Supabase and our in-memory fallback
    case_data = {
        "id": case_id,
        "fraud_type": payload.fraud_type.value,
        "victim_name": payload.victim_name,
        "victim_contact": payload.victim_contact,
        "incident_ts": payload.incident_timestamp.isoformat(),
        "amount_lost": payload.amount_lost,
        "currency": payload.currency,
        "receiving_upi_id": payload.receiving_upi_id,
        "receiving_account": payload.receiving_account,
        "evidence_text": payload.evidence_text,
        "evidence_fields": _validated_evidence.dict(exclude_none=True),
        "urgency_score": urgency["urgency_score"],
        "urgency_label": urgency["urgency_label"],
        "next_steps": next_steps,
        "exit_risk_flag": exit_risk["flagged"],
        "da_alert": da_result["digital_arrest_alert"],
    }
    
    try:
        get_supabase().table("reports").insert(case_data).execute()
    except Exception as e:
        print(f"Supabase INSERT failed, falling back to memory: {e}")
        # Save exact shape required by report_generator as a fallback
        _case_store[case_id] = {
            **payload.dict(),
            "urgency_score":   urgency["urgency_score"],
            "urgency_label":   urgency["urgency_label"],
            "exit_risk_flag":  exit_risk["flagged"],
            "next_steps":      next_steps,
            "evidence_fields": _validated_evidence.dict(exclude_none=True),
        }

    return IntakeResponse(
        case_id=case_id,
        fraud_type=payload.fraud_type.value,
        urgency_score=urgency["urgency_score"],
        urgency_label=urgency["urgency_label"],
        exit_risk_flag=exit_risk["flagged"],
        digital_arrest_alert=da_result["digital_arrest_alert"],
        matched_da_conditions=da_result["matched_conditions"],
        minutes_elapsed=urgency["minutes_elapsed"],
        next_steps=next_steps,
    )


# ---------------------------------------------------------------------------
# POST /aftermath/report
# ---------------------------------------------------------------------------

@router.post("/aftermath/report", response_model=ReportResponse)
def aftermath_report(payload: ReportRequest):
    # BB1 path: in-memory store.
    # BB2 path: replace with Supabase SELECT (see Step 2.4 in modc.md).
    case = None
    try:
        res = get_supabase().table("reports").select("*").eq("id", payload.case_id).single().execute()
        db_case = res.data
        
        case = {
            "fraud_type": db_case["fraud_type"],
            "victim_name": db_case["victim_name"],
            "victim_contact": db_case["victim_contact"],
            "incident_timestamp": datetime.fromisoformat(db_case["incident_ts"]),
            "amount_lost": db_case["amount_lost"],
            "currency": db_case["currency"],
            "receiving_upi_id": db_case["receiving_upi_id"],
            "receiving_account": db_case["receiving_account"],
            "evidence_text": db_case["evidence_text"],
            "evidence_fields": db_case["evidence_fields"],
            "urgency_score": db_case["urgency_score"],
            "urgency_label": db_case["urgency_label"],
            "exit_risk_flag": db_case["exit_risk_flag"],
            "next_steps": db_case["next_steps"]
        }
    except Exception as e:
        print(f"Supabase SELECT failed, falling back to memory: {e}")
        case = _case_store.get(payload.case_id)
        
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found. Submit /aftermath/intake first.",
        )

    cluster_ctx = payload.cluster_context.dict() if payload.cluster_context else None

    report = generate_report(
        case_id=payload.case_id,
        fraud_type=case["fraud_type"],
        victim_name=case["victim_name"],
        victim_contact=case["victim_contact"],
        incident_timestamp=case["incident_timestamp"],
        amount_lost=case["amount_lost"],
        currency=case["currency"],
        # Fix 2: prefer UPI ID, fall back to bank account — both are always stored
        receiving_id=case.get("receiving_upi_id") or case.get("receiving_account"),
        evidence_text=case["evidence_text"],
        evidence_fields=case["evidence_fields"],
        urgency_score=case["urgency_score"],
        # Fix 1: read from store — no recalculation from stale timestamp
        urgency_label=case["urgency_label"],
        exit_risk_flag=case["exit_risk_flag"],
        cluster_context=cluster_ctx,
        next_steps=case["next_steps"],
    )

    return ReportResponse(
        case_id=report["case_id"],
        report_format=report["report_format"],
        report_html=report["report_html"],
        report_text=report["report_text"],
        download_url=f"/aftermath/report/download/{payload.case_id}" if False else None,
        # Set download_url to the path above only after PDF generation is implemented.
    )


# ---------------------------------------------------------------------------
# GET /aftermath/report/download/{case_id}  — Optional PDF (after Checkpoint 2)
# ---------------------------------------------------------------------------

@router.get("/aftermath/report/download/{case_id}")
def download_report_pdf(case_id: str):
    """
    Optional PDF download. Only implement after Checkpoint 2 and if time permits.
    Prerequisite: pip install weasyprint (+ system libpango deps).
    """
    case = _case_store.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    report = generate_report(case_id=case_id, **case)
    pdf_bytes = generate_pdf_bytes(report["report_html"])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=RakshaCover_{case_id[:8]}.pdf"},
    )
