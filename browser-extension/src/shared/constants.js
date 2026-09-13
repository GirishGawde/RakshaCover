export const DEFAULT_SETTINGS = {
  apiBaseUrl: "https://rakshacover.onrender.com",
  automaticScans: true,
  showPageWarnings: true,
};

export const MESSAGE_TYPES = {
  GET_CURRENT_SCAN: "GET_CURRENT_SCAN",
  GET_PAGE_SIGNALS: "GET_PAGE_SIGNALS",
  SCAN_CURRENT_PAGE: "SCAN_CURRENT_PAGE",
  PAGE_SIGNALS: "PAGE_SIGNALS",
  SCAN_RESULT: "SCAN_RESULT",
  SHOW_WARNING: "SHOW_WARNING",
};

export const RISK_LEVELS = {
  SAFE: "safe",
  SUSPICIOUS: "suspicious",
  DANGEROUS: "dangerous",
  UNKNOWN: "unknown",
};

export const MAX_REDIRECTS = 10;
export const RESULT_TTL_MS = 5 * 60 * 1000;