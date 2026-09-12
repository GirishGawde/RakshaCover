const sensitiveFieldTypes = new Set(["password", "email", "tel"]);
const sensitiveNamePattern = /(otp|one.?time|pin|cvv|card|account|aadhaar|password|passcode)/i;
const brandNames = ["sbi", "hdfc", "icici", "npci", "paytm", "bank"];

scanPage();

const observer = new MutationObserver(() => scanPage());
observer.observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_WARNING") showWarning(message.result);
  if (message.type === "GET_PAGE_SIGNALS") sendResponse(getPageSignals());
});

let latestSignals = {};
let lastSignalSignature = "";

function scanPage() {
  const fields = [...document.querySelectorAll("input, textarea")];
  const sensitiveFields = fields.filter((field) => {
    const descriptor = [field.type, field.name, field.id, field.placeholder, field.autocomplete]
      .filter(Boolean)
      .join(" ");
    return sensitiveFieldTypes.has(field.type) || sensitiveNamePattern.test(descriptor);
  });
  const text = `${document.title} ${document.body?.innerText || ""}`.slice(0, 50_000).toLowerCase();
  const brandMentions = brandNames.filter((brand) => text.includes(brand));

  latestSignals = {
    sensitiveFieldCount: sensitiveFields.length,
    hasPasswordField: sensitiveFields.some((field) => field.type === "password"),
    hasOtpLikeField: sensitiveFields.some((field) => sensitiveNamePattern.test(`${field.name} ${field.id} ${field.placeholder}`)),
    brandMentions,
  };

  const signalSignature = JSON.stringify(latestSignals);
  if (signalSignature === lastSignalSignature) return;
  lastSignalSignature = signalSignature;

  chrome.runtime.sendMessage({
    type: "PAGE_SIGNALS",
    signals: latestSignals,
  }).catch(() => {});
}

function getPageSignals() {
  return Promise.resolve(latestSignals);
}

function showWarning(result) {
  if (document.getElementById("rakshacover-warning")) return;
  const banner = document.createElement("aside");
  banner.id = "rakshacover-warning";
  banner.attachShadow({ mode: "open" }).innerHTML = `
    <style>
      :host { all: initial; }
      .banner { position: fixed; z-index: 2147483647; top: 12px; left: 50%; transform: translateX(-50%); width: min(460px, calc(100vw - 32px)); padding: 14px 16px; border: 1px solid #fecaca; border-radius: 10px; background: #fff7ed; box-shadow: 0 8px 30px #0003; color: #431407; font: 14px/1.4 system-ui, sans-serif; }
      strong { display: block; margin-bottom: 4px; }
      button { float: right; border: 0; background: transparent; color: #7c2d12; cursor: pointer; font-size: 18px; }
    </style>
    <div class="banner" role="alert"><button aria-label="Dismiss">&times;</button><strong>RakshaCover warning</strong>This page may be unsafe. Do not enter your password, OTP, PIN, or payment details.</div>`;
  banner.shadowRoot.querySelector("button").addEventListener("click", () => banner.remove());
  document.documentElement.appendChild(banner);
}