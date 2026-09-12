import { DEFAULT_SETTINGS } from "../shared/constants.js";

export async function loadSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function checkLink(url, settings) {
  const response = await fetch(`${settings.apiBaseUrl}/check/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Prevention service returned HTTP ${response.status}`);
  }

  return response.json();
}