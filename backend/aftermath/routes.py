# backend/aftermath/routes.py
#
# Route handlers for Module C (Aftermath & Recovery).
#
# Endpoints:
#   POST /aftermath/intake               — intake form, urgency scoring, alert flags
#   POST /aftermath/report               — generate formatted complaint report
#   GET  /aftermath/report/download/{id} — PDF download (optional)
#
# Storage strategy:
#   Primary  — Supabase (INSERT / SELECT)
#   Fallback — _case_store (in-memory) if Supabase is unavailable

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, field_validator

from classifier import FraudType, classify_and_validate
from digital_arrest_shield import check_digital_arrest
from exit_risk import check_exit_risk
from report_generator import generate_pdf_bytes, generate_report
from urgency_score import compute_urgency
from db import get_supabase

logger = logging.getLogger("aftermath")
router = APIRouter()

# In-memory fallback store — used when Supabase is unavailable
_case_store: Dict[str, dict] = {}


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
    #    Fix 4: _validated_evidence is Pydantic-scrubbed — unknown keys are stripped.
    #    Never use raw payload.evidence_fields for DB inserts.
    try:
        _validated_evidence, next_steps = classify_and_validate(
            payload.fraud_type, payload.evidence_fields
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Evidence validation error: {e}")

    # 2. Compute urgency score.
    #    BB3 edge case: future timestamps are clamped to t=0 (score=1.0, CRITICAL)
    #    so a victim who mis-enters a future time still gets the most urgent routing.
    #    Fix 3: the field_validator above already blocked naive timestamps with 422.
    ts = payload.incident_timestamp
    now_utc = datetime.now(timezone.utc)
    if ts > now_utc:
        logger.warning(
            "incident_timestamp is in the future (%.1f min ahead) — clamping to now",
            (ts - now_utc).total_seconds() / 60,
        )
        ts = now_utc
    urgency = compute_urgency(ts)

    # 3. Digital Arrest Shield check.
    da_result = check_digital_arrest(payload.digital_arrest_signals)

    # 4. Exit-risk flag.
    #    Fix 2: both UPI ID and account are evaluated independently.
    exit_risk = check_exit_risk(
        upi_id=payload.receiving_upi_id,
        account=payload.receiving_account,
    )

    # 5. Persist case — Supabase primary, _case_store fallback.
    case_id = str(uuid.uuid4())
    case_data = {
        "id":               case_id,
        "fraud_type":       payload.fraud_type.value,
        "victim_name":      payload.victim_name,
        "victim_contact":   payload.victim_contact,
        "incident_ts":      payload.incident_timestamp.isoformat(),
        "amount_lost":      payload.amount_lost,
        "currency":         payload.currency,
        "receiving_upi_id": payload.receiving_upi_id,
        "receiving_account":payload.receiving_account,
        "evidence_text":    payload.evidence_text,
        "evidence_fields":  _validated_evidence.dict(exclude_none=True),
        "urgency_score":    urgency["urgency_score"],
        "urgency_label":    urgency["urgency_label"],
        "next_steps":       next_steps,
        "exit_risk_flag":   exit_risk["flagged"],
        "da_alert":         da_result["digital_arrest_alert"],
    }

    db_ok = False
    try:
        get_supabase().table("reports").insert(case_data).execute()
        db_ok = True
    except Exception as e:
        logger.error("Supabase INSERT failed for case_id=%s: %s", case_id, e)
        # Fall back to memory so the session still works
        _case_store[case_id] = {
            **payload.dict(),
            "urgency_score":   urgency["urgency_score"],
            "urgency_label":   urgency["urgency_label"],
            "exit_risk_flag":  exit_risk["flagged"],
            "next_steps":      next_steps,
            "evidence_fields": _validated_evidence.dict(exclude_none=True),
        }

    logger.info(
        "Intake: case_id=%s fraud=%s urgency=%s exit_risk=%s da_alert=%s db=%s",
        case_id,
        payload.fraud_type.value,
        urgency["urgency_label"],
        exit_risk["flagged"],
        da_result["digital_arrest_alert"],
        "supabase" if db_ok else "memory",
    )

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
    case = _load_case(payload.case_id)
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
        amount_lost=case["amount_lost"] or 0.0,
        currency=case["currency"],
        # Fix 2: prefer UPI ID, fall back to bank account
        receiving_id=case.get("receiving_upi_id") or case.get("receiving_account"),
        evidence_text=case["evidence_text"],
        evidence_fields=case["evidence_fields"] or {},
        urgency_score=case["urgency_score"],
        # Fix 1: read from store — never recalculate from stale timestamp
        urgency_label=case["urgency_label"],
        exit_risk_flag=case["exit_risk_flag"],
        cluster_context=cluster_ctx,
        next_steps=case["next_steps"] or [],
    )

    logger.info("Report generated: case_id=%s format=%s", payload.case_id, report["report_format"])

    return ReportResponse(
        case_id=report["case_id"],
        report_format=report["report_format"],
        report_html=report["report_html"],
        report_text=report["report_text"],
        download_url=f"/aftermath/report/download/{payload.case_id}",
    )


# ---------------------------------------------------------------------------
# Shared helper — load a case from Supabase with _case_store fallback
# ---------------------------------------------------------------------------

def _load_case(case_id: str) -> Optional[dict]:
    """Returns a normalised case dict or None. Tries Supabase first, falls back to memory."""
    try:
        res = (
            get_supabase()
            .table("reports")
            .select(
                "fraud_type, victim_name, victim_contact, incident_ts, "
                "amount_lost, currency, receiving_upi_id, receiving_account, "
                "evidence_text, evidence_fields, urgency_score, urgency_label, "
                "next_steps, exit_risk_flag"
            )
            .eq("id", case_id)
            .single()
            .execute()
        )
        row = res.data
        if row:
            return {
                "fraud_type":         row["fraud_type"],
                "victim_name":        row["victim_name"],
                "victim_contact":     row["victim_contact"],
                "incident_timestamp": datetime.fromisoformat(row["incident_ts"]),
                "amount_lost":        float(row["amount_lost"] or 0),
                "currency":           row["currency"],
                "receiving_upi_id":   row["receiving_upi_id"],
                "receiving_account":  row["receiving_account"],
                "evidence_text":      row["evidence_text"],
                "evidence_fields":    row["evidence_fields"] or {},
                "urgency_score":      row["urgency_score"],
                "urgency_label":      row["urgency_label"],
                "exit_risk_flag":     row["exit_risk_flag"],
                "next_steps":         row["next_steps"] or [],
            }
    except Exception as e:
        logger.warning("Supabase SELECT failed for case_id=%s, trying memory: %s", case_id, e)

    return _case_store.get(case_id)


# ---------------------------------------------------------------------------
# GET /aftermath/report/download/{case_id}  — PDF download
# ---------------------------------------------------------------------------

@router.get("/aftermath/report/download/{case_id}")
def download_report_pdf(case_id: str):
    """
    Returns a PDF of the complaint report.
    Requires: pip install weasyprint + system libpango deps.
    """
    case = _load_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    try:
        report = generate_report(
            case_id=case_id,
            fraud_type=case["fraud_type"],
            victim_name=case["victim_name"],
            victim_contact=case["victim_contact"],
            incident_timestamp=case["incident_timestamp"],
            amount_lost=case["amount_lost"] or 0.0,
            currency=case["currency"],
            receiving_id=case.get("receiving_upi_id") or case.get("receiving_account"),
            evidence_text=case["evidence_text"],
            evidence_fields=case["evidence_fields"] or {},
            urgency_score=case["urgency_score"],
            urgency_label=case["urgency_label"],
            exit_risk_flag=case["exit_risk_flag"],
            next_steps=case["next_steps"] or [],
        )
        pdf_bytes = generate_pdf_bytes(report["report_html"])
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="PDF generation not available. Install weasyprint to enable.",
        )
    except Exception as e:
        logger.error("PDF generation failed for case_id=%s: %s", case_id, e)
        raise HTTPException(status_code=500, detail="PDF generation failed.")

    logger.info("PDF downloaded: case_id=%s", case_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=RakshaCover_{case_id[:8]}.pdf"},
    )
