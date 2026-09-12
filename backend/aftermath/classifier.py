# backend/aftermath/classifier.py
#
# Fraud-type branching classifier and evidence schema validator.
#
# Design: pure rule-based — no ML. The user's branching questionnaire (Module D)
# determines fraud_type; this module validates the resulting evidence_fields
# against a per-type Pydantic schema and returns canonical next_steps.

from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
from datetime import datetime


class FraudType(str, Enum):
    UPI_CARD       = "upi_card"
    JOB_FRAUD      = "job_fraud"
    SEXTORTION     = "sextortion"
    DATA_BREACH    = "data_breach"
    DIGITAL_ARREST = "digital_arrest"


# Per-fraud-type evidence validators (Pydantic sub-models)
class UpiCardEvidence(BaseModel):
    upi_id: Optional[str] = None
    transaction_ref: Optional[str] = None
    bank_name: Optional[str] = None
    card_last4: Optional[str] = None

class JobFraudEvidence(BaseModel):
    company_name: Optional[str] = None
    recruiter_name: Optional[str] = None
    platform_used: Optional[str] = None
    registration_fee_paid: Optional[float] = None

class SextortionEvidence(BaseModel):
    platform: Optional[str] = None
    threat_screenshot_url: Optional[str] = None
    demanded_amount: Optional[float] = None

class DataBreachEvidence(BaseModel):
    affected_service: Optional[str] = None
    data_types_exposed: Optional[str] = None
    phishing_link: Optional[str] = None

class DigitalArrestEvidence(BaseModel):
    caller_claimed_identity: Optional[str] = None
    call_duration_minutes: Optional[int] = None
    coercion_type: Optional[str] = None


EVIDENCE_SCHEMA_MAP = {
    FraudType.UPI_CARD:       UpiCardEvidence,
    FraudType.JOB_FRAUD:      JobFraudEvidence,
    FraudType.SEXTORTION:     SextortionEvidence,
    FraudType.DATA_BREACH:    DataBreachEvidence,
    FraudType.DIGITAL_ARREST: DigitalArrestEvidence,
}

# Canonical next-steps per fraud type
NEXT_STEPS_MAP = {
    FraudType.UPI_CARD: [
        "Call your bank immediately to freeze the beneficiary account (helpline on back of card).",
        "File a complaint on cybercrime.gov.in (helpline 1930) within 24h.",
        "Email your bank's fraud department with the transaction reference.",
    ],
    FraudType.JOB_FRAUD: [
        "Report on cybercrime.gov.in and the National Consumer Helpline (1800-11-4000).",
        "File an FIR at your nearest police station.",
        "Alert the platform/job portal where the recruiter contacted you.",
    ],
    FraudType.SEXTORTION: [
        "Do NOT pay — payment escalates demands.",
        "Report on cybercrime.gov.in (1930) — dedicated sextortion unit.",
        "Document all communication; block and report on the platform.",
    ],
    FraudType.DATA_BREACH: [
        "Change passwords on all affected accounts immediately.",
        "Enable 2FA on banking and email.",
        "File a complaint on cert-in.org.in and cybercrime.gov.in.",
    ],
    FraudType.DIGITAL_ARREST: [
        "Hang up immediately — no legitimate authority arrests over video/phone call.",
        "Report on cybercrime.gov.in (1930); inform your local police station.",
        "Alert family members; do NOT transfer any funds.",
    ],
}


def classify_and_validate(fraud_type: FraudType, evidence_fields: Dict[str, Any]):
    """
    Validates evidence_fields against the expected schema for the given fraud_type.

    Returns:
        (validated_evidence_model, next_steps_list)

    Note: validated_evidence_model.dict(exclude_none=True) must be used for DB inserts
    (Fix 4) — do NOT use the raw evidence_fields dict from the request payload.
    """
    schema_cls = EVIDENCE_SCHEMA_MAP[fraud_type]
    validated = schema_cls(**evidence_fields)
    next_steps = NEXT_STEPS_MAP[fraud_type]
    return validated, next_steps
