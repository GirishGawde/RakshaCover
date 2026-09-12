# RakshaCover — High-Level Architecture Plan
*Track 3, Jan Jeevan | 36-hour build | 4-person team*

## 1. Scope for this build

### Core (build fully, demo-ready)
| Feature | Notes |
|---|---|
| Link/URL Checker | Levenshtein domain-typo check + cached WHOIS/SSL lookup + one threat feed (PhishTank) |
| QR Safety Check | Decodes UPI string, runs structural authenticity score — shares logic with Link Checker |
| UPI ID Trust Lookup | Community DB lookup — report count + cluster confidence |
| Explainable Phishing Classifier | scikit-learn (Logistic Regression/Random Forest) trained on UCI Phishing Websites dataset |
| Behavioral-Fingerprint Clustering | TF-IDF + cosine similarity, incremental clustering, built on **seeded** report data (not live-grown during demo) |
| Cluster Graph View | NetworkX graph, rendered as a **static/precomputed** visualization (not live D3 force-graph) |
| Bayesian Cold-Start Priors | Seeded from public sources (I4C/NCRP, RBI/NPCI bulletins) |
| Aftermath Routing | Branching classifier: UPI/card, job fraud, sextortion, data breach, digital arrest |
| Recovery Urgency Score | Time-decay model: `P(t) = P0 × e^(-λt)` |
| Exit-Risk Flag | Flags receiving ID showing conversion-endpoint pattern |
| Digital Arrest Shield | Rule-based panic trigger (2+ of 4 hardcoded legal-fact conditions) — folded into Aftermath module, no separate owner |
| Auto-Drafted Report | Compiles victim evidence + cluster context into a submission-ready document |

### Future additions (after core is complete / roadmap-only for this hackathon)
| Feature | Reason cut |
|---|---|
| Browser Extension (full Manifest V3) | High effort: favicon hashing, redirect-chain inspection, live DOM scanning |
| Live D3 force-graph visualization | Interactive graph build/tune eats time; static render carries the same demo point |
| Real-Time Notification & SMS Alert Scanner | Needs Android native permission flow + at-scale testing |
| Investigator View | Institutional add-on, not needed to prove the core idea |
| DLT sender-ID registry check | Tied to the SMS scanner, cut with it |
| Multiple live threat feeds (Google Safe Browsing, OpenPhish) | One feed (PhishTank) is enough to prove the mechanism |
| Live WHOIS/CertStream calls | Cache/pre-fetch known demo domains instead of live lookups mid-demo |
| Account Aggregator integration, multilingual rollout, Guardian Mode | Already roadmap-only in original plan |

## 2. System overview

```
                     ┌─────────────────────────────┐
                     │        Web App (Next.js)     │
                     │  Link/QR/UPI check UI         │
                     │  Risk banners, cluster graph   │
                     │  Aftermath intake + report view│
                     └───────────────┬───────────────┘
                                     │ REST (FastAPI)
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                             │
┌───────▼────────┐        ┌──────────▼─────────┐        ┌──────────▼─────────┐
│ Prevention      │        │ Clustering &        │        │ Aftermath &         │
│ Engine          │        │ Graph Intelligence   │        │ Recovery Engine      │
│ (Module A)      │        │ (Module B)           │        │ (Module C)           │
│                 │        │                      │        │                      │
│ Link checker    │        │ TF-IDF similarity    │        │ Branching classifier │
│ QR checker      │        │ NetworkX graph        │        │ Urgency score         │
│ UPI trust lookup│        │ Bayesian priors        │        │ Exit-risk flag        │
│ Phishing        │        │ Cluster confidence      │        │ Digital Arrest Shield │
│ classifier (ML) │        │                        │        │ Auto-drafted report   │
└───────┬─────────┘        └──────────┬─────────────┘        └──────────┬───────────┘
        │                             │                                 │
        └─────────────────────────────┴──────────────┬──────────────────┘
                                                       │
                                          ┌────────────▼────────────┐
                                          │  PostgreSQL              │
                                          │  reports, clusters,       │
                                          │  domain whitelist,        │
                                          │  seeded public priors     │
                                          └───────────────────────────┘
```

## 3. Tech stack

| Layer | Technology | Owner |
|---|---|---|
| Web App | React / Next.js | Module D |
| API Gateway | Python FastAPI (shared contract, each module exposes its own router) | All 3 backend modules + Module D wires them |
| Prevention scoring | Rule engine + scikit-learn (UCI dataset) | Module A |
| Clustering / graph | scikit-learn TF-IDF, NetworkX | Module B |
| Aftermath logic | Rule engine + branching classifier | Module C |
| Database | PostgreSQL | Shared schema, defined in Phase 0 |
| Domain intel | python-whois, Certificate Transparency (cached, not live) | Module A |
| Threat feed | PhishTank (single feed) | Module A |
| Visualization | Static graph render (e.g. pre-rendered SVG/PNG from NetworkX, or a simple non-interactive chart) | Module D, fed by Module B |

## 4. Data flow (core demo path)

1. User submits a link / QR / UPI ID via the Web App.
2. Request hits Module A's scoring endpoint → rule engine + classifier + PhishTank lookup → risk score returned.
3. If the user later reports a scam, the Aftermath intake (Module C) captures evidence, routes by fraud type, computes urgency + exit-risk.
4. The report's behavioral fingerprint is sent to Module B, which matches it against seeded clusters and returns cluster context ("matches 7 other reports").
5. Module C compiles victim evidence + Module B's cluster context into the auto-drafted report.
6. Web App displays: risk banner (step 2), or urgency + cluster match + drafted report (steps 3–5).

## 5. Optional open-source add-ons (usable, not mandatory)

These are plug-and-play resources not in the original plan. None are required for the core build — use them only where a module owner has spare time and the addition doesn't add integration risk.

| Resource | Module | Adds |
|---|---|---|
| URLhaus (abuse.ch) | A | A second free phishing/malware URL feed alongside PhishTank, same low integration effort |
| NPCI's official PSP/TPAP handle list | A | An authoritative whitelist of real UPI handles (e.g. @paytm, @ybl, @axl) — strengthens the VPA structural check beyond regex-only validation |
| Tranco List | A | Ready-made "top domains" list as a baseline legitimate-domain whitelist, instead of hand-curating one |
| pyzbar | A | Standard library for QR image → UPI string decoding — low complexity, likely needed regardless since the QR checker needs to decode something |
| python-louvain (`community` package) | B | Needed only if you actually want Louvain community detection — it isn't built into core NetworkX, so skip it and use NetworkX's built-in clustering if time is short |
| data.gov.in cybercrime datasets | B | An additional citable public source for cold-start Bayesian priors, on top of I4C/RBI advisories |
| ReportLab / WeasyPrint | C | Turns the auto-drafted report into a real PDF instead of HTML/text — nice for demo polish, adds moderate complexity (PDF generation + styling), so treat as time-permitting |
| Cytoscape.js | D | Lighter-weight alternative to D3 for the cluster graph if D3 feels heavy — not required if the static/precomputed render is already working |

## 6. Shared contracts (must be locked in Phase 0)

- **DB schema**: `reports`, `clusters`, `domain_whitelist`, `seeded_priors` tables — exact columns agreed before any module starts independent work.
- **API contracts**: request/response JSON shape for each endpoint each module will expose, agreed up front so Module D can build against mocks immediately.
- **Seed data format**: what a "seeded report" looks like, since Module B, C, and D all depend on it existing in a known shape.
