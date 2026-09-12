# backend/aftermath/exit_risk.py
#
# Exit-risk flag: detects whether the receiving UPI ID or account name
# matches known crypto/forex conversion-endpoint patterns.
#
# Detection strategy (no ML — hardcoded rules):
#   1. Known crypto/forex exchange UPI handle substrings (e.g. @wazirx, @coindcx)
#   2. Regex patterns on UPI ID or account string (forex, remit, traders, pvt ltd, etc.)

import re
from typing import Optional

CRYPTO_FOREX_HANDLES = [
    "wazirx", "coindcx", "zebpay", "unocoin", "bitbns",
    "coinswitch", "binancepay", "coinbase", "okx",
    "fxkart", "bookmyforex", "extravelmoney",
]

EXIT_RISK_PATTERNS = [
    r"\bforex\b", r"\bfx\b", r"exchange", r"\bremit\b", r"crypto",
    r"traders?", r"enterprise", r"solutions?", r"pvt\.?\s*ltd",
    r"wallet", r"escrow", r"clearing",
]


def check_exit_risk(
    upi_id: Optional[str] = None,
    account: Optional[str] = None,
) -> dict:
    """
    Checks whether the receiving identifier shows a conversion-endpoint pattern.

    Returns:
        dict with keys:
            - flagged (bool)
            - reason (str | None)
            - matched_pattern (str | None)
    """
    targets = []
    if upi_id:
        targets.append(upi_id.lower())
    if account:
        targets.append(account.lower())

    if not targets:
        return {"flagged": False, "reason": None, "matched_pattern": None}

    combined = " ".join(targets)

    for handle in CRYPTO_FOREX_HANDLES:
        if handle in combined:
            return {
                "flagged":          True,
                "reason":           f"Receiving ID matches known crypto/forex platform: {handle}",
                "matched_pattern":  handle,
            }

    for pattern in EXIT_RISK_PATTERNS:
        if re.search(pattern, combined):
            return {
                "flagged":          True,
                "reason":           f"Receiving ID matches conversion-endpoint pattern: '{pattern}'",
                "matched_pattern":  pattern,
            }

    return {"flagged": False, "reason": None, "matched_pattern": None}
