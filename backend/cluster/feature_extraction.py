"""Behavioral fingerprints used for deterministic incremental matching."""

import re
from collections.abc import Iterable

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from cluster.models import Report


_TOKEN_RE = re.compile(r"[a-z0-9@._-]+")
_AMOUNT_BUCKETS = ("micro", "small", "medium", "large", "very_large")


def amount_bucket(amount: float | None) -> str:
    if amount is None:
        return "unknown"
    if amount < 1_000:
        return _AMOUNT_BUCKETS[0]
    if amount < 10_000:
        return _AMOUNT_BUCKETS[1]
    if amount < 100_000:
        return _AMOUNT_BUCKETS[2]
    if amount < 1_000_000:
        return _AMOUNT_BUCKETS[3]
    return _AMOUNT_BUCKETS[4]


def normalize_handle(handle: str | None) -> str:
    if not handle:
        return "unknown"
    return handle.strip().lower()


def fingerprint_text(report: Report) -> str:
    """Encode all matching signals as tokens for one sparse TF-IDF vector."""

    words = _TOKEN_RE.findall(report.description.lower())
    signals = [
        *words,
        f"handle:{normalize_handle(report.payment_handle)}",
        f"amount:{amount_bucket(report.amount)}",
        f"fraud:{(report.fraud_type or 'unknown').strip().lower()}",
    ]
    signals.extend(
        f"channel:{channel.strip().lower()}"
        for channel in report.channel_sequence
        if channel.strip()
    )
    return " ".join(signals) or "empty-report"


def vectorize(reports: Iterable[Report]):
    """Return a fitted vectorizer and the vectors for the supplied reports."""

    report_list = list(reports)
    vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b[\w:@.-]+\b", lowercase=False)
    matrix = vectorizer.fit_transform([fingerprint_text(report) for report in report_list])
    return vectorizer, matrix


def report_similarity(left: Report, right: Report) -> float:
    _, matrix = vectorize([left, right])
    return float(cosine_similarity(matrix[0:1], matrix[1:2])[0, 0])
