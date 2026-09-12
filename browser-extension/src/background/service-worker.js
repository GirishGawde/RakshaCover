import {
  DEFAULT_SETTINGS,
  MAX_REDIRECTS,
  MESSAGE_TYPES,
  RESULT_TTL_MS,
} from "../shared/constants.js";
import { checkLink, loadSettings } from "../api/prevention-client.js";
import { normalizeRiskResult, riskColor } from "../shared/risk-utils.js";

const redirectChains = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(DEFAULT_SETTINGS);
  await chrome.storage.local.set({ ...DEFAULT_SETTINGS, ...existing });
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  redirectChains.set(details.tabId, [details.url]);
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  const chain = redirectChains.get(details.tabId) || [];
  if (!chain.includes(details.url)) {
    chain.push(details.url);
    redirectChains.set(details.tabId, chain.slice(-MAX_REDIRECTS));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => redirectChains.delete(tabId));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.PAGE_SIGNALS) {
    savePageSignals(sender.tab?.id, message.signals);
    return false;
  }

  if (message.type === MESSAGE_TYPES.GET_CURRENT_SCAN) {
    getCurrentTab().then((tab) => getStoredScan(tab?.id).then(sendResponse));
    return true;
  }

  if (message.type === MESSAGE_TYPES.SCAN_CURRENT_PAGE) {
    scanTab(message.tabId, message.url, message.pageSignals)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return false;
});

async function scanTab(tabId, url, pageSignals = {}) {
  if (!url || !/^https?:/i.test(url)) {
    throw new Error("This page cannot be checked by RakshaCover.");
  }

  const settings = await loadSettings();
  const apiResult = normalizeRiskResult(await checkLink(url, settings));
  const result = {
    ...apiResult,
    pageSignals,
    redirectChain: redirectChains.get(tabId) || [url],
  };

  await chrome.storage.session.set({ [`scan:${tabId}`]: result });
  await chrome.action.setBadgeText({ tabId, text: result.riskScore === null ? "?" : String(result.riskScore) });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: riskColor(result.verdict) });

  if (settings.showPageWarnings && result.verdict === "dangerous") {
    chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPES.SHOW_WARNING, result }).catch(() => {});
  }

  return result;
}

async function savePageSignals(tabId, signals) {
  if (tabId === undefined) return;
  await chrome.storage.session.set({ [`signals:${tabId}`]: signals });
  const settings = await loadSettings();
  if (!settings.automaticScans) return;
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) {
    scanTab(tabId, tab.url, signals).catch(() => {});
  }
}

async function getStoredScan(tabId) {
  if (tabId === undefined) return { error: "No active tab." };
  const key = `scan:${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const result = stored[key];
  if (!result || Date.now() - result.checkedAt > RESULT_TTL_MS) return null;
  return result;
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}