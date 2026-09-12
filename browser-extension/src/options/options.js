import { DEFAULT_SETTINGS } from "../shared/constants.js";

const api = document.querySelector("#api");
const automatic = document.querySelector("#automatic");
const warnings = document.querySelector("#warnings");
const status = document.querySelector("#status");

const settings = { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get(DEFAULT_SETTINGS)) };
api.value = settings.apiBaseUrl;
automatic.checked = settings.automaticScans;
warnings.checked = settings.showPageWarnings;

document.querySelector("#save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiBaseUrl: api.value.replace(/\/$/, ""),
    automaticScans: automatic.checked,
    showPageWarnings: warnings.checked,
  });
  status.textContent = "Saved";
});