# RakshaCover Browser Extension

Manifest V3 Chrome extension for checking the current page with RakshaCover's Prevention API.

## Load locally

1. Start the Prevention API on `http://localhost:8001`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this `browser-extension` folder.
5. Open the extension's options page if the API URL needs changing.

The extension sends only the current page URL and derived, non-sensitive page signals. It never reads input values. Scans are kept in session storage and expire after five minutes.

## Module A integration

The extension expects:

```http
POST /check/link
Content-Type: application/json
```

```json
{ "url": "https://example.com" }
```

The response should contain `risk_score`, `verdict`, and `signals`.

For browser testing, Module A must allow requests from the loaded extension's `chrome-extension://<extension-id>` origin in its CORS configuration. This is the only backend integration change expected.

## Privacy boundary

- Password, OTP, PIN, CVV, and account field values are never read.
- Only field presence and field metadata are inspected locally.
- No browsing history is collected.
- Redirect chains are limited to the current tab and ten URLs.
- Risk results are stored in session storage and expire after five minutes.
- The user can disable automatic scans and page warnings in settings.