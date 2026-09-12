import { MESSAGE_TYPES } from "../shared/constants.js";
import { displaySignal, riskLabel } from "../shared/risk-utils.js";

const elements = {
  url: document.querySelector("#url"),
  state: document.querySelector("#state"),
  scan: document.querySelector("#scan"),
  error: document.querySelector("#error"),
  details: document.querySelector("#details"),
  signals: document.querySelector("#signals"),
  localSignals: document.querySelector("#local-signals"),
};

let currentTab;

init();

async function init() {
  [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  elements.url.textContent = currentTab?.url || "Current page unavailable";
  elements.scan.addEventListener("click", scan);
  await renderStoredScan();
}

async function renderStoredScan() {
  const result = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_CURRENT_SCAN });
  if (result?.error) return showError(result.error);
  if (result) renderResult(result);
}

async function scan() {
  setLoading(true);
  clearError();
  const pageSignals = await getPageSignals();
  const result = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SCAN_CURRENT_PAGE,
    tabId: currentTab?.id,
    url: currentTab?.url,
    pageSignals,
  });

  setLoading(false);
  if (result?.error) return showError(result.error);
  renderResult(result);
}

function renderResult(result) {
  elements.state.className = `state ${result.verdict}`;
  elements.state.textContent = `${riskLabel(result.verdict)}${result.riskScore === null ? "" : ` · ${result.riskScore}/100`}`;
  elements.details.hidden = false;
  elements.signals.replaceChildren(...result.signals.map((signal) => {
    const item = document.createElement("li");
    item.textContent = displaySignal(signal);
    return item;
  }));
  const local = result.pageSignals;
  elements.localSignals.textContent = local
    ? `Local signals: ${local.sensitiveFieldCount || 0} sensitive-looking field(s), ${local.brandMentions?.length || 0} brand mention(s).`
    : "";
}

async function getPageSignals() {
  try {
    return await chrome.tabs.sendMessage(currentTab.id, { type: MESSAGE_TYPES.GET_PAGE_SIGNALS });
  } catch {
    return {};
  }
}

function setLoading(isLoading) {
  elements.scan.disabled = isLoading;
  elements.scan.textContent = isLoading ? "Checking..." : "Check this page";
  if (isLoading) elements.state.textContent = "Checking current page...";
}

function showError(message) {
  elements.error.hidden = false;
  elements.error.textContent = message;
}

function clearError() {
  elements.error.hidden = true;
  elements.error.textContent = "";
}