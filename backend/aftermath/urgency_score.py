# backend/aftermath/urgency_score.py
#
# Recovery urgency model: P(t) = P₀ × e^(−λt)
#
#   P₀     = 1.0    (100% recovery probability immediately after fraud)
#   λ      = 0.03   (half-life ≈ 23 min — aligns with RBI's 30-min chargeback window)
#   t      = minutes since incident_timestamp
#
# Output buckets:
#   CRITICAL  ≥ 0.75    0–10 min
#   HIGH      0.50–0.74  10–23 min
#   MEDIUM    0.25–0.49  23–46 min
#   LOW       < 0.25    > 46 min
#
# Fix 3: naive (timezone-unaware) timestamps are explicitly rejected.
# Rationale: a frontend sending IST time as naive UTC adds 330 min to delta_minutes,
# immediately dropping urgency to LOW — a silent and dangerous mis-score.
# The caller must pass a timezone-aware datetime (e.g. 2024-01-01T10:30:00+05:30).

import math
from datetime import datetime, timezone
from enum import Enum

LAMBDA = 0.03   # decay constant — tune if needed
P0     = 1.0    # initial recovery probability


class UrgencyLabel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"


def compute_urgency(incident_timestamp: datetime) -> dict:
    """
    Computes the recovery urgency score.

    Args:
        incident_timestamp: Timezone-AWARE datetime of when the fraud occurred.

    Returns:
        dict with keys: urgency_score (float), urgency_label (str), minutes_elapsed (int)

    Raises:
        ValueError: If incident_timestamp has no timezone info (Fix 3).
    """
    if incident_timestamp.tzinfo is None:
        raise ValueError(
            "incident_timestamp must be timezone-aware (e.g. 2024-01-01T10:30:00+05:30). "
            "Naive datetimes are rejected — passing IST time as naive UTC inflates "
            "delta_minutes by 330 min, incorrectly setting urgency to LOW."
        )

    now = datetime.now(timezone.utc)
    delta_minutes = max(0, (now - incident_timestamp).total_seconds() / 60)
    score = P0 * math.exp(-LAMBDA * delta_minutes)
    score = round(max(0.0, min(1.0, score)), 4)

    if score >= 0.75:
        label = UrgencyLabel.CRITICAL
    elif score >= 0.50:
        label = UrgencyLabel.HIGH
    elif score >= 0.25:
        label = UrgencyLabel.MEDIUM
    else:
        label = UrgencyLabel.LOW

    return {
        "urgency_score":   score,
        "urgency_label":   label.value,
        "minutes_elapsed": int(delta_minutes),
    }
