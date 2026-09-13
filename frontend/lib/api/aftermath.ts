const API_BASE = "http://localhost:8000";

export async function submitIntake(payload: any) {
  const res = await fetch(`${API_BASE}/aftermath/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let errText;
    try { errText = await res.text(); } catch(e) { errText = res.statusText; }
    console.error(`Backend 422 Error: ${errText} - Payload: ${JSON.stringify(payload)}`);
    throw new Error(`Failed to submit intake: ${errText}`);
  }
  return await res.json();
}

export async function submitReport(payload: any) {
  const res = await fetch(`${API_BASE}/aftermath/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to submit report");
  return await res.json();
}

export async function getReportDownload(caseId: string) {
  const res = await fetch(`${API_BASE}/aftermath/report/download/${caseId}`);
  if (!res.ok) throw new Error("Failed to download report");
  return await res.json();
}
