# RakshaCover — Module Split (4 people, parallel dev)

Each module is designed to be internally independent after Phase 0 (shared contracts locked). Owners build against mocked data/APIs until integration checkpoints.

---

## Module A — Prevention Engine
**Owns:** Link Checker, QR Safety Check, UPI Trust Lookup, Explainable Phishing Classifier

| Task | Detail |
|---|---|
| Domain typo check | Levenshtein/RapidFuzz edit-distance against a whitelist of real bank/govt/merchant domains |
| Domain age & SSL check | python-whois + cached Certificate Transparency data (pre-fetched for demo domains, not live) |
| Threat feed lookup | PhishTank integration |
| Phishing classifier | Train scikit-learn Logistic Regression/Random Forest on UCI Phishing Websites dataset; expose feature-importance output for explainability |
| Link Risk Score | Combine rule engine + classifier + threat feed into a single 0–100 score |
| QR safety check | Decode UPI string from QR, run VPA format validity + edit-distance against known merchant patterns |
| UPI trust lookup | Query `reports`/`clusters` table for report count + cluster confidence for a given UPI ID |

**Exposes (FastAPI routes):** `/check/link`, `/check/qr`, `/check/upi`
**Depends on:** DB schema (Phase 0), domain whitelist seed data

**Optional (usable, not mandatory, low added complexity):**
- URLhaus — a second free phishing feed alongside PhishTank, same integration effort
- NPCI's official PSP/TPAP handle list — authoritative UPI handle whitelist, strengthens the VPA check beyond regex
- Tranco List — ready-made top-domains list as the legitimate-domain whitelist baseline
- pyzbar — standard library for QR image → UPI string decoding

---

## Module B — Clustering & Graph Intelligence
**Owns:** Behavioral-Fingerprint Clustering, Cluster Graph, Bayesian Priors

| Task | Detail |
|---|---|
| Feature extraction | Turn each report into a feature vector: script/wording (TF-IDF + cosine similarity), payment-handle pattern, staged-amount pattern, channel sequence |
| Incremental clustering | New reports join an existing cluster above similarity threshold, else seed a new cluster — no training phase needed |
| Graph construction | NetworkX: nodes = clusters, edges = shared behavioral signal |
| Cold-start priors | Seed Bayesian priors from public sources (I4C/NCRP advisories, RBI/NPCI bulletins) so confidence scores are meaningful even with few reports |
| Bayesian updating | `P(fraud|evidence) = [P(evidence|fraud) × P(fraud)] / P(evidence)`, updated as new reports arrive |
| Static graph export | Produce a renderable graph structure (JSON node/edge list, or a pre-rendered image) for Module D to display |

**Exposes (FastAPI routes):** `/cluster/match`, `/cluster/graph`
**Depends on:** DB schema (Phase 0), seeded report dataset (needs to be built early — coordinate with Module C on seed data shape)

**Optional (usable, not mandatory):**
- python-louvain (`community` package) — only if you want actual Louvain community detection; it's not built into core NetworkX, so skip it and use NetworkX's built-in clustering if time is short
- data.gov.in cybercrime datasets — an extra citable public source for cold-start priors, alongside I4C/RBI advisories

---

## Module C — Aftermath & Recovery Engine
**Owns:** Branching Classifier, Urgency Score, Exit-Risk Flag, Digital Arrest Shield, Auto-Drafted Report

| Task | Detail |
|---|---|
| Fraud-type routing | Branching classifier: UPI/card, job fraud, sextortion, data breach, digital arrest — each with its own evidence fields |
| Recovery Urgency Score | Time-decay model: `P(t) = P0 × e^(-λt)`, t = minutes since transaction |
| Exit-Risk Flag | Flags when a receiving ID shows a crypto/forex conversion-endpoint pattern |
| Digital Arrest Shield | Hardcoded rule: fire panic alert if 2+ of {stay on call / don't disconnect or tell anyone / transfer money to "prove innocence" / caller claims police-CBI-customs} |
| Auto-drafted report | Compile victim evidence + cluster context (from Module B) into a formatted, submission-ready document (1930/NCRP/bank format) |

**Exposes (FastAPI routes):** `/aftermath/intake`, `/aftermath/report`
**Depends on:** Module B's cluster-match output (for the auto-drafted report's cluster context) — mock this until Phase 2 integration

**Optional (usable, not mandatory — adds moderate complexity, so time-permitting only):**
- ReportLab / WeasyPrint — turns the auto-drafted report into a real downloadable PDF instead of HTML/text; nice demo polish but not required to prove the mechanism

---

## Module D — Web App & Integration
**Owns:** Frontend UI, API wiring/orchestration, deployment

| Task | Detail |
|---|---|
| Link/QR/UPI check UI | Input flows + live risk banner display |
| Cluster graph display | Renders Module B's static graph output |
| Aftermath intake flow | Evidence capture UI, routed by fraud type |
| Urgency + exit-risk display | Visual indicators driven by Module C's scores |
| Auto-drafted report view | Displays/downloads Module C's generated report |
| API integration layer | Wires Next.js frontend to all three backend modules' FastAPI routes |
| Deployment | Get the whole stack running on a shared, demoable URL |

**Depends on:** All three backend modules' API contracts (locked in Phase 0), builds against mocked responses until integration checkpoints

**Optional (usable, not mandatory):**
- Cytoscape.js — lighter-weight alternative to D3 for the cluster graph if D3 feels heavy; not needed if the static/precomputed render already works

---

## Cross-cutting ownership

- **DB schema** — proposed by whoever's most comfortable with Postgres, agreed by all 4 in Phase 0.
- **Seed data** (reports, clusters, priors) — Module B and C jointly define the shape in Phase 0; can be generated/loaded by either as time allows.
- **Digital Arrest Shield** — intentionally folded into Module C, not a separate owner (it's a small rule check).
