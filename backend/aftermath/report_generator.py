# backend/aftermath/report_generator.py
#
# Auto-drafted report compiler.
# Produces HTML (primary) and plain-text (fallback) complaint documents.
#
# Format routing:
#   upi_card, digital_arrest  →  1930  (Cybercrime Helpline immediate complaint)
#   job_fraud, sextortion,
#   data_breach               →  NCRP  (cybercrime.gov.in portal)
#   bank                      →  bank  (manually requested via Module D)

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

FORMAT_MAP = {
    "upi_card":       "1930",
    "job_fraud":      "NCRP",
    "sextortion":     "NCRP",
    "data_breach":    "NCRP",
    "digital_arrest": "1930",
}

REPORT_TITLES = {
    "1930": "Cybercrime Helpline Complaint (1930)",
    "NCRP": "National Cybercrime Reporting Portal (NCRP) Complaint",
    "bank": "Bank Fraud Complaint Letter",
}


def generate_report(
    case_id: str,
    fraud_type: str,
    victim_name: Optional[str],
    victim_contact: Optional[str],
    incident_timestamp: datetime,
    amount_lost: float,
    currency: str,
    receiving_id: Optional[str],
    evidence_text: Optional[str],
    evidence_fields: Dict[str, Any],
    urgency_score: float,
    urgency_label: str,
    exit_risk_flag: bool,
    cluster_context: Optional[Dict[str, Any]] = None,
    next_steps: Optional[List[str]] = None,
) -> dict:
    """
    Generates a formatted complaint document in HTML and plain text.

    Args:
        receiving_id: Prefer receiving_upi_id; fall back to receiving_account (Fix 2).
        urgency_label: Must be read from DB/store — not recalculated (Fix 1).
        next_steps:    Must be read from DB/store — not recalculated (Fix 1).
        evidence_fields: Must be the validated model dict, not raw request input (Fix 4).
    """
    report_format = FORMAT_MAP.get(fraud_type, "NCRP")
    title = REPORT_TITLES[report_format]
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # --- Cluster context section ---
    cluster_section_html = ""
    cluster_section_text = ""
    if cluster_context and cluster_context.get("cluster_id"):
        cluster_section_html = f"""
        <div class="section cluster">
            <h2>4. Related Cases (Cluster Intelligence)</h2>
            <table>
                <tr><td><b>Cluster ID</b></td><td>{cluster_context.get('cluster_id', 'N/A')}</td></tr>
                <tr><td><b>Similar Cases</b></td><td>{cluster_context.get('cluster_size', 0)}</td></tr>
                <tr><td><b>Cluster Confidence</b></td><td>{cluster_context.get('cluster_confidence', 0):.0%}</td></tr>
                <tr><td><b>Pattern Summary</b></td><td>{cluster_context.get('similar_cases_summary', '')}</td></tr>
            </table>
        </div>"""
        cluster_section_text = f"""
--- RELATED CASES (CLUSTER INTELLIGENCE) ---
Cluster ID:         {cluster_context.get('cluster_id', 'N/A')}
Similar Cases:      {cluster_context.get('cluster_size', 0)}
Cluster Confidence: {cluster_context.get('cluster_confidence', 0):.0%}
Pattern Summary:    {cluster_context.get('similar_cases_summary', '')}
"""

    steps_html = "".join(f"<li>{s}</li>" for s in (next_steps or []))
    steps_text = "\n".join(f"  {i+1}. {s}" for i, s in enumerate(next_steps or []))

    ev_rows_html = "".join(
        f"<tr><td>{k}</td><td>{v}</td></tr>"
        for k, v in evidence_fields.items() if v
    )
    ev_rows_text = "\n".join(
        f"  {k}: {v}" for k, v in evidence_fields.items() if v
    )

    exit_risk_html = ""
    exit_risk_text = ""
    if exit_risk_flag:
        exit_risk_html = '<p class="warning">&#9888; <b>EXIT-RISK FLAG:</b> Receiving account shows crypto/forex conversion-endpoint pattern. Funds may have already been laundered.</p>'
        exit_risk_text = "\n[!] EXIT-RISK FLAG: Receiving account shows conversion-endpoint pattern. Act immediately.\n"

    report_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title} — Case {case_id[:8]}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #222; }}
        h1 {{ color: #c0392b; }} h2 {{ color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px; }}
        .meta {{ background: #f8f8f8; padding: 12px; border-radius: 4px; font-size: 0.9em; margin-bottom: 20px; }}
        .section {{ margin: 24px 0; }}
        .urgency-CRITICAL {{ color: #c0392b; font-weight: bold; }}
        .urgency-HIGH {{ color: #e67e22; font-weight: bold; }}
        .urgency-MEDIUM {{ color: #d4ac0d; }}
        .urgency-LOW {{ color: #7f8c8d; }}
        .warning {{ background: #fdecea; border-left: 4px solid #c0392b; padding: 10px; margin: 10px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
        td, th {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        ol li {{ margin: 6px 0; }}
        footer {{ color: #aaa; font-size: 0.8em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }}
    </style>
</head>
<body>
    <h1>RakshaCover — {title}</h1>
    <div class="meta">
        <b>Case ID:</b> {case_id} &nbsp;|&nbsp;
        <b>Generated:</b> {generated_at} &nbsp;|&nbsp;
        <b>Format:</b> {report_format}
    </div>

    <div class="section">
        <h2>1. Victim Information</h2>
        <table>
            <tr><td><b>Name</b></td><td>{victim_name or 'Not provided'}</td></tr>
            <tr><td><b>Contact</b></td><td>{victim_contact or 'Not provided'}</td></tr>
            <tr><td><b>Fraud Type</b></td><td>{fraud_type.replace('_', ' ').title()}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>2. Incident Details</h2>
        <table>
            <tr><td><b>Date / Time</b></td><td>{incident_timestamp.strftime('%Y-%m-%d %H:%M UTC')}</td></tr>
            <tr><td><b>Amount Lost</b></td><td>{currency} {amount_lost:,.2f}</td></tr>
            <tr><td><b>Receiving ID / Account</b></td><td>{receiving_id or 'Not provided'}</td></tr>
        </table>
        {exit_risk_html}
    </div>

    <div class="section">
        <h2>3. Evidence</h2>
        <p><b>Victim's Account:</b> {evidence_text or 'Not provided'}</p>
        <h3>Structured Fields</h3>
        <table><tr><th>Field</th><th>Value</th></tr>{ev_rows_html}</table>
    </div>

    {cluster_section_html}

    <div class="section">
        <h2>5. Recovery Urgency Assessment</h2>
        <p class="urgency-{urgency_label}">
            Urgency Level: {urgency_label} &nbsp; (Score: {urgency_score:.4f})
        </p>
    </div>

    <div class="section">
        <h2>6. Recommended Next Steps</h2>
        <ol>{steps_html}</ol>
    </div>

    <footer>Generated by RakshaCover &nbsp;·&nbsp; Submit to cybercrime.gov.in &nbsp;·&nbsp; Helpline: <b>1930</b></footer>
</body>
</html>"""

    report_text = f"""
================================================================================
{title.upper()}
Case ID:   {case_id}
Generated: {generated_at}
================================================================================

1. VICTIM INFORMATION
   Name:        {victim_name or 'Not provided'}
   Contact:     {victim_contact or 'Not provided'}
   Fraud Type:  {fraud_type.replace('_', ' ').title()}

2. INCIDENT DETAILS
   Date/Time:   {incident_timestamp.strftime('%Y-%m-%d %H:%M UTC')}
   Amount Lost: {currency} {amount_lost:,.2f}
   Receiving:   {receiving_id or 'Not provided'}
{exit_risk_text}
3. EVIDENCE
   {evidence_text or 'Not provided'}

   Structured Fields:
{ev_rows_text}
{cluster_section_text}
5. RECOVERY URGENCY
   Level: {urgency_label}  |  Score: {urgency_score:.4f}

6. RECOMMENDED NEXT STEPS
{steps_text}

================================================================================
Generated by RakshaCover | Submit to cybercrime.gov.in | Helpline: 1930
================================================================================
"""

    return {
        "case_id":       case_id,
        "report_format": report_format,
        "report_html":   report_html,
        "report_text":   report_text,
    }


# --- Optional PDF extension (time-permitting, after Checkpoint 2) ---

def generate_pdf_bytes(report_html: str) -> bytes:
    """
    Converts the HTML report to a PDF byte string using WeasyPrint.
    Requires: pip install weasyprint
    System deps (Ubuntu/Debian): apt-get install libpango-1.0-0 libpangoft2-1.0-0
    """
    from weasyprint import HTML
    return HTML(string=report_html).write_pdf()
