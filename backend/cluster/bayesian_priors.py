"""Cold-start priors and transparent Bayesian evidence updates."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EvidenceModel:
    fraud_prior: float
    evidence_given_fraud: float
    evidence_given_legitimate: float

    def posterior(self) -> float:
        evidence_probability = (
            self.evidence_given_fraud * self.fraud_prior
            + self.evidence_given_legitimate * (1 - self.fraud_prior)
        )
        if evidence_probability == 0:
            return self.fraud_prior
        return (
            self.evidence_given_fraud * self.fraud_prior / evidence_probability
        )


DEFAULT_PRIORS: dict[str, float] = {
    "upi": 0.72,
    "job": 0.58,
    "digital_arrest": 0.76,
    "sextortion": 0.64,
    "data_breach": 0.55,
    "unknown": 0.5,
}


def prior_for(fraud_type: str | None) -> float:
    return DEFAULT_PRIORS.get((fraud_type or "unknown").strip().lower(), 0.5)


def update_probability(
    fraud_type: str | None,
    evidence_given_fraud: float,
    evidence_given_legitimate: float,
) -> float:
    """Return P(fraud|evidence) using the seeded public-source prior."""
    return round(
        EvidenceModel(
            prior_for(fraud_type), evidence_given_fraud, evidence_given_legitimate
        ).posterior(),
        3,
    )