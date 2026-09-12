# backend/aftermath/digital_arrest_shield.py
#
# Digital Arrest panic alert engine.
#
# Rule: fire alert if >= 2 of 4 hardcoded conditions are matched in the victim's
# free-text signals. Detection is keyword/regex — no ML.
#
# Conditions:
#   STAY_ON_CALL     — caller said "stay on call" / "don't hang up"
#   DONT_TELL_ANYONE — caller said "don't tell anyone" / "keep this secret"
#   TRANSFER_TO_PROVE — asked to transfer money to "prove innocence" / "clear name"
#   CLAIMS_AUTHORITY  — claimed to be police / CBI / ED / customs / court

import re
from typing import List

SHIELD_CONDITIONS = [
    ("STAY_ON_CALL", [
        r"stay on call", r"don.?t hang up", r"remain on call", r"keep the line open"
    ]),
    ("DONT_TELL_ANYONE", [
        r"don.?t tell anyone", r"don.?t disconnect", r"keep this secret",
        r"don.?t inform", r"confidential matter"
    ]),
    ("TRANSFER_TO_PROVE", [
        r"transfer.*innocent", r"transfer.*prove", r"send money.*clear",
        r"deposit.*bail", r"pay.*custody", r"transfer.*release"
    ]),
    ("CLAIMS_AUTHORITY", [
        r"\bpolice\b", r"\bcbi\b", r"\bed\b", r"enforcement directorate",
        r"\bcustoms\b", r"\bnarcotic", r"\bncb\b", r"supreme court",
        r"\bjudge\b", r"ministry of"
    ]),
]


def check_digital_arrest(signals: List[str]) -> dict:
    """
    Evaluates whether the incoming signals trigger the Digital Arrest panic alert.

    Args:
        signals: List of free-text strings provided by the victim at intake.

    Returns:
        dict with keys:
            - digital_arrest_alert (bool): True if >= 2 conditions matched
            - matched_conditions (list[str]): IDs of matched conditions
            - match_count (int)
    """
    combined_text = " ".join(signals).lower()
    matched = []

    for condition_id, patterns in SHIELD_CONDITIONS:
        for pattern in patterns:
            if re.search(pattern, combined_text):
                matched.append(condition_id)
                break  # Count each condition only once

    return {
        "digital_arrest_alert": len(matched) >= 2,
        "matched_conditions":   matched,
        "match_count":          len(matched),
    }
