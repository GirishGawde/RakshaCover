import { CheckLinkResponse, CheckQrResponse, CheckUpiResponse } from "../types";

const API_BASE = "http://localhost:8000";

export async function checkLink(url: string): Promise<CheckLinkResponse> {
  const res = await fetch(`${API_BASE}/check/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });
  
  if (!res.ok) {
    throw new Error("Failed to check link");
  }
  
  const data = await res.json();
  
  // Map backend contract to frontend contract
  const flags: any = {};
  data.signals?.forEach((s: any) => {
    flags[s.check] = s.flagged;
  });
  
  return {
    score: data.risk_score,
    riskLabel: data.verdict === "dangerous" ? "SEVERE_THREAT" : data.verdict === "suspicious" ? "SUSPICIOUS" : "SAFE",
    url: data.url,
    flags,
    recommendation: data.verdict === "dangerous" ? "Do not visit this link. It closely resembles a known phishing domain." : "Link appears to be safe."
  };
}

export async function checkQr(base64: string): Promise<CheckQrResponse> {
  const res = await fetch(`${API_BASE}/check/qr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_image_base64: base64 })
  });

  if (!res.ok) throw new Error("Failed to check QR");

  const data = await res.json();
  const flags: any = {};
  data.signals?.forEach((s: any) => { flags[s.check] = s.flagged; });

  return {
    score: data.risk_score,
    riskLabel: data.verdict === "dangerous" ? "SEVERE_THREAT" : data.verdict === "suspicious" ? "SUSPICIOUS" : "SAFE",
    decodedUrl: data.decoded_type === "url" ? data.vpa : undefined,
    vpa: data.decoded_type === "upi" ? data.vpa : undefined,
    flags,
    recommendation: data.verdict === "safe" ? "This QR code appears safe." : "This QR code is suspicious or dangerous. Proceed with caution."
  };
}

export async function checkUpi(vpa: string): Promise<CheckUpiResponse> {
  const res = await fetch(`${API_BASE}/check/upi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vpa })
  });

  if (!res.ok) throw new Error("Failed to check UPI");

  const data = await res.json();
  const flags: any = {};
  data.signals?.forEach((s: any) => { flags[s.check] = s.flagged; });

  return {
    score: data.risk_score,
    riskLabel: data.verdict === "dangerous" ? "SEVERE_THREAT" : data.verdict === "suspicious" ? "SUSPICIOUS" : "SAFE",
    vpa: data.vpa,
    flags,
    recommendation: data.verdict === "safe" ? "This UPI ID appears safe." : "This UPI ID is suspicious or dangerous. Verify the recipient before sending."
  };
}
