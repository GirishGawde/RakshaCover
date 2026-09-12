import { RISK_LEVELS } from "./constants.js";

export function normalizeRiskResult(result) {
  const score = Number.isFinite(Number(result?.risk_score))
    ? Math.max(0, Math.min(100, Number(result.risk_score)))
    : null;
  const verdict = String(result?.verdict || "unknown").toLowerCase();

  return {
    riskScore: score,
    verdict: Object.values(RISK_LEVELS).includes(verdict)
      ? verdict
      : RISK_LEVELS.UNKNOWN,
    signals: Array.isArray(result?.signals) ? result.signals : [],
    checkedUrl: result?.url || null,
    checkedAt: Date.now(),
  };
}

export function riskLabel(verdict) {
  return {
    [RISK_LEVELS.SAFE]: "Low risk",
    [RISK_LEVELS.SUSPICIOUS]: "Suspicious",
    [RISK_LEVELS.DANGEROUS]: "High risk",
    [RISK_LEVELS.UNKNOWN]: "Not checked",
  }[verdict] || "Not checked";
}

export function riskColor(verdict) {
  return {
    [RISK_LEVELS.SAFE]: "#15803d",
    [RISK_LEVELS.SUSPICIOUS]: "#b45309",
    [RISK_LEVELS.DANGEROUS]: "#b91c1c",
    [RISK_LEVELS.UNKNOWN]: "#64748b",
  }[verdict] || "#64748b";
}

export function displaySignal(signal) {
  if (typeof signal === "string") return signal;
  return signal?.detail || signal?.check || "Risk signal detected";
}