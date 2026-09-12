# Module C — Aftermath & Recovery Engine
## Implementation Plan

> **Stack:** Python · FastAPI · Port `8003`  
> **Folder:** `backend/aftermath/`  
> **36-hour hackathon timeline aligned to** [`03-phases.md`](./03-phases.md)

---

## Table of Contents

1. [Phase 0 — Contracts (Hours 0–3)](#phase-0--contracts-hours-03)
2. [Build Block 1 — Core Engine (Hours 3–16)](#build-block-1--core-engine-hours-316)
3. [Checkpoint 1 — Standalone Verified (~Hour 16–18)](#checkpoint-1--standalone-verified-hour-1618)
4. [Build Block 2 — Exit-Risk + Auto-Draft Report (Hours 18–28)](#build-block-2--exit-risk--auto-draft-report-hours-1828)
5. [Checkpoint 2 — Full Integration (~Hour 28–30)](#checkpoint-2--full-integration-hour-2830)
6. [Build Block 3 — Polish (Hours 30–34)](#build-block-3--polish-hours-3034)
7. [File Map](#file-map)
8. [API Contract Reference](#api-contract-reference)
9. [Data Schemas](#data-schemas)
10. [Known Ambiguities & Fixes](#known-ambiguities--fixes)
11. [Optional Add-on: PDF Generation](#optional-add-on-pdf-generation)

---

## Phase 0 — Contracts (Hours 0–3)

> **Full-team sync.** No feature code. Lock everything before splitting off.

### Deliverables from Module C in Phase 0

#### 1. Lock API contracts (publish to `CONTRACTS.md`)

**`POST /aftermath/intake`**

*Request:*
```json
{
  "fraud_type": "upi_card | job_fraud | sextortion | data_breach | digital_arrest",
  "victim_name": "string",
  "victim_contact": "string",
  "incident_timestamp": "ISO-8601 datetime with UTC offset (e.g. +05:30)",
  "amount_lost": 0.0,
  "currency": "INR",
  "receiving_upi_id": "string | null",
  "receiving_account": "string | null",
  "digital_arrest_signals": ["string"],
  "evidence_text": "string",
  "evidence_fields": {}
}
```

*Response:*
```json
{
  "case_id": "uuid-string",
  "fraud_type": "string",
  "urgency_score": 0.0,
  "urgency_label": "CRITICAL | HIGH | MEDIUM | LOW",
  "exit_risk_flag": true,
  "digital_arrest_alert": false,
  "minutes_elapsed": 0,
  "next_steps": ["string"]
}
```

**`POST /aftermath/report`**

*Request:*
```json
{
  "case_id": "uuid-string",
  "cluster_context": {
    "cluster_id": "string | null",
    "cluster_size": 0,
    "cluster_confidence": 0.0,
    "similar_cases_summary": "string"
  }
}
```

*Response:*
```json
{
  "case_id": "uuid-string",
  "report_format": "1930 | NCRP | bank",
  "report_html": "string",
  "report_text": "string",
  "download_url": "string | null"
}
```

#### 2. Agree on `evidence_fields` shape per fraud type

Module D must know these to build the branching questionnaire UI.

| `fraud_type` | Extra `evidence_fields` keys |
|---|---|
| `upi_card` | `upi_id`, `transaction_ref`, `bank_name`, `card_last4` |
| `job_fraud` | `company_name`, `recruiter_name`, `platform_used`, `registration_fee_paid` |
| `sextortion` | `platform`, `threat_screenshot_url`, `demanded_amount` |
| `data_breach` | `affected_service`, `data_types_exposed`, `phishing_link` |
| `digital_arrest` | `caller_claimed_identity`, `call_duration_minutes`, `coercion_type` |

> **Action:** Share this table with Module D owner by end of Phase 0.

#### 3. Agree on mock for Module B cluster-match

Until Phase 2 integration, `/aftermath/report` accepts `cluster_context` directly in the request body. Module D will pass the real Module B output after Checkpoint 2.

**Mock cluster context (used in Build Block 1 & 2):**
```json
{
  "cluster_id": "mock-cluster-001",
  "cluster_size": 7,
  "cluster_confidence": 0.82,
  "similar_cases_summary": "7 similar cases reported in the last 72h. Common pattern: fake KYC calls followed by UPI transfer requests."
}
```

#### 4. DB schema agreement

Schema lives in [`backend/shared/db_schema.sql`](./backend/shared/db_schema.sql).  
Run it in **Supabase Dashboard → SQL Editor → New query**.

Key columns agreed for the `reports` table:

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `fraud_type` | VARCHAR(32) | Required |
| `incident_ts` | TIMESTAMPTZ | Timezone-aware |
| `receiving_upi_id` | VARCHAR(256) | Separate from `receiving_account` (Fix 2) |
| `receiving_account` | VARCHAR(256) | Separate from `receiving_upi_id` (Fix 2) |
| `evidence_fields` | JSONB | Only Pydantic-validated keys (Fix 4) |
| `urgency_label` | VARCHAR(16) | Stored at intake time (Fix 1) |
| `next_steps` | JSONB | Stored at intake time (Fix 1) |
| `exit_risk_flag` | BOOLEAN | |
| `da_alert` | BOOLEAN | Digital Arrest Shield result |

#### 5. Health-check endpoint

By end of Phase 0, [`main.py`](./backend/aftermath/main.py) must return `200 OK` at `GET /health` so Module D can confirm the server is reachable.

---

## Build Block 1 — Core Engine (Hours 3–16)

> **Heads-down, no meetings.** Target: fraud-type routing + urgency score + Digital Arrest Shield working and testable via Postman/curl.

### Step 1.1 — Scaffold the FastAPI app

**File:** [`backend/aftermath/main.py`](./backend/aftermath/main.py)

Sets up the FastAPI app, CORS middleware (allow `localhost:3000`), and mounts the router from `routes.py`.

Run: `uvicorn main:app --reload --port 8003`

---

### Step 1.2 — Fraud-Type Branching Classifier

**File:** [`backend/aftermath/classifier.py`](./backend/aftermath/classifier.py)

**Goal:** Given a `fraud_type` from the intake payload, validate `evidence_fields` against the correct per-type Pydantic schema and return the canonical `next_steps` list.

**Design decisions:**
- Pure rule-based switch — no ML. The user's branching questionnaire in Module D determines `fraud_type`; this module only validates and attaches schema.
- Each fraud type has a dedicated Pydantic sub-model (`UpiCardEvidence`, `JobFraudEvidence`, etc.) defined in `EVIDENCE_SCHEMA_MAP`.
- `next_steps` are hardcoded per fraud type in `NEXT_STEPS_MAP`.
- Returns `(validated_evidence_model, next_steps)`. The validated model **must** be used for any DB insert — never the raw dict (see Fix 4 in [Known Ambiguities](#known-ambiguities--fixes)).

---

### Step 1.3 — Recovery Urgency Score

**File:** [`backend/aftermath/urgency_score.py`](./backend/aftermath/urgency_score.py)

**Model:** `P(t) = P₀ × e^(−λt)`

| Parameter | Value | Rationale |
|---|---|---|
| `P₀` | 1.0 | Maximum recovery probability immediately after fraud |
| `λ` | `0.03` | Half-life ≈ 23 minutes — aligns with RBI's 30-min chargeback window |
| `t` | minutes since `incident_timestamp` | Provided in intake payload |

**Output buckets:**

| Score Range | Label | Meaning |
|---|---|---|
| ≥ 0.75 | `CRITICAL` | Act NOW — within first ~10 min |
| 0.50–0.74 | `HIGH` | Strong chance — within ~23 min |
| 0.25–0.49 | `MEDIUM` | Partial recovery still possible |
| < 0.25 | `LOW` | Low probability — focus shifts to FIR/NCRP |

**Worked example / test vectors:**
```
t =  0 min  →  score = 1.00  (CRITICAL)
t = 10 min  →  score = 0.74  (HIGH)
t = 23 min  →  score = 0.50  (HIGH)
t = 46 min  →  score = 0.25  (MEDIUM)
t = 92 min  →  score = 0.06  (LOW)
```

> **Fix 3:** `compute_urgency` raises `ValueError` on naive (timezone-unaware) timestamps. The `IntakeRequest` Pydantic validator in `routes.py` surfaces this as a `422` before `compute_urgency` is even called. See [Known Ambiguities](#known-ambiguities--fixes).

---

### Step 1.4 — Digital Arrest Shield

**File:** [`backend/aftermath/digital_arrest_shield.py`](./backend/aftermath/digital_arrest_shield.py)

**Rule:** Fire panic alert if **2 or more** of 4 hardcoded conditions are matched in `digital_arrest_signals`.

**The 4 conditions:**

| ID | Triggered by |
|---|---|
| `STAY_ON_CALL` | "stay on call", "don't hang up", "remain on call" |
| `DONT_TELL_ANYONE` | "don't tell anyone", "don't disconnect", "keep this secret" |
| `TRANSFER_TO_PROVE` | "transfer to prove innocence", "deposit for bail", "pay for custody" |
| `CLAIMS_AUTHORITY` | "police", "CBI", "ED", "customs", "narcotic", "NCB", "judge" |

**Detection strategy:** Keyword/regex matching on lowercased signal strings — no ML.

**Test cases (verify before Checkpoint 1):**
- 2 matching conditions → `digital_arrest_alert: true`
- 1 matching condition → `digital_arrest_alert: false`
- 3 matching conditions → `digital_arrest_alert: true`

---

### Step 1.5 — Intake Route

**File:** [`backend/aftermath/routes.py`](./backend/aftermath/routes.py) — `POST /aftermath/intake`

Wires `classifier.py`, `urgency_score.py`, and `digital_arrest_shield.py` together.

**Processing pipeline:**
1. Validate `evidence_fields` via `classify_and_validate()` — get back `(_validated_evidence, next_steps)`
2. Compute `urgency` via `compute_urgency(payload.incident_timestamp)`
3. Run `check_digital_arrest(payload.digital_arrest_signals)`
4. Run `check_exit_risk(upi_id=..., account=...)` — stub in BB1, implemented in BB2
5. Generate `case_id` and persist to `_case_store` (BB1) or Supabase (BB2)

**BB1 store structure** (in-memory `_case_store`):  
Includes `urgency_label`, `next_steps`, and `evidence_fields` (validated) — so `_case_store` and the Supabase `reports` table have identical shapes. This makes the BB1→BB2 swap a drop-in replacement.

> **Checkpoint 1 target:** Hit `POST /aftermath/intake` via Postman/curl — returns valid `IntakeResponse` JSON.

---

## Checkpoint 1 — Standalone Verified (~Hour 16–18)

**What Module C must demonstrate:**

- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `POST /aftermath/intake` with a `upi_card` payload returns correct `urgency_score`, `urgency_label`, and `digital_arrest_alert: false`
- [ ] `POST /aftermath/intake` with digital arrest signals returns `digital_arrest_alert: true` when 2+ conditions match
- [ ] `urgency_score` math is correct: verify `t=0` → ~1.0, `t=46` → ~0.25
- [ ] Sending a naive timestamp (no UTC offset) returns `422` with a clear message
- [ ] Confirm `CONTRACTS.md` still matches actual response shapes (no drift)

---

## Build Block 2 — Exit-Risk + Auto-Draft Report (Hours 18–28)

### Step 2.1 — Exit-Risk Flag

**File:** [`backend/aftermath/exit_risk.py`](./backend/aftermath/exit_risk.py)

**Goal:** Flag when a receiving UPI ID or account shows a conversion-endpoint pattern (money being laundered via crypto/forex exchange).

**Detection rules (no ML — hardcoded patterns):**

| Pattern type | Examples | Method |
|---|---|---|
| Known crypto/forex exchange UPI handles | `@wazirx`, `@coindcx`, `@zebpay` | Substring match |
| Forex platform keywords | `forex`, `fx`, `exchange`, `remit` in UPI ID | Regex |
| Mule account name patterns | `traders`, `enterprise`, `pvt ltd`, `escrow` | Regex |

**Test cases:**
- `pay@wazirx` → `flagged: true`
- `john@okicici` → `flagged: false`
- `ABC Forex Solutions Pvt Ltd` → `flagged: true`

---

### Step 2.2 — Auto-Drafted Report Generator

**File:** [`backend/aftermath/report_generator.py`](./backend/aftermath/report_generator.py)

**Goal:** Compile victim evidence + Module B cluster context into a submission-ready complaint document. Output: HTML (primary) + plain text (fallback).

**Format routing:**

| Format | Use case | Auto-selected for fraud types |
|---|---|---|
| `1930` | Cybercrime helpline immediate complaint | `upi_card`, `digital_arrest` |
| `NCRP` | NCRP online portal (cybercrime.gov.in) | `job_fraud`, `sextortion`, `data_breach` |
| `bank` | Bank fraud complaint letter | Manually requested via Module D |

**Report sections:**
1. Victim Information
2. Incident Details (+ exit-risk warning banner if flagged)
3. Evidence (free-text + structured fields)
4. Related Cases (cluster intelligence from Module B)
5. Recovery Urgency Assessment
6. Recommended Next Steps

---

### Step 2.3 — Report Route

**File:** [`backend/aftermath/routes.py`](./backend/aftermath/routes.py) — `POST /aftermath/report`

Loads the case from `_case_store` (BB1) or Supabase SELECT (BB2) and calls `generate_report()`.

**Key point (Fix 1):** `urgency_label` and `next_steps` are **read from the stored case** — they are never recalculated from the current timestamp. The timestamp at report-generation time is irrelevant to urgency.

---

### Step 2.4 — DB Integration (Supabase)

**Files:**  
- [`backend/shared/db.py`](./backend/shared/db.py) — Supabase client singleton  
- [`backend/shared/db_schema.sql`](./backend/shared/db_schema.sql) — DDL (run in Supabase SQL Editor)

**Setup:**
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run [`db_schema.sql`](./backend/shared/db_schema.sql) in **Dashboard → SQL Editor**.
3. Copy **Project URL** and **anon/service-role key** from **Dashboard → Settings → API**.
4. Add to `.env`:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-or-service-key>
   ```

**INSERT pattern** (replaces `_case_store[case_id] = {...}` in `aftermath_intake`):
- Use `sb.table("reports").insert({...}).execute()` via `get_supabase()` from `db.py`.
- Insert both `receiving_upi_id` **and** `receiving_account` as separate fields (Fix 2).
- Use `_validated_evidence.dict(exclude_none=True)` for `evidence_fields` (Fix 4).
- Include `urgency_label` and `next_steps` in the insert payload (Fix 1).

**SELECT pattern** (replaces `_case_store.get(payload.case_id)` in `aftermath_report`):
- Use `sb.table("reports").select(...).eq("id", payload.case_id).single().execute()`.
- Reconstruct the `case` dict from `result.data`, including `urgency_label`, `next_steps`, `receiving_upi_id`, `receiving_account` (Fix 5).
- Pass `receiving_id = case["receiving_upi_id"] or case["receiving_account"]` to `generate_report()`.

> See [`routes.py`](./backend/aftermath/routes.py) — comments mark the `# BB2:` swap points.

---

## Checkpoint 2 — Full Integration (~Hour 28–30)

**What Module C must demonstrate end-to-end:**

- [ ] `POST /aftermath/intake` → correct urgency, alert flags, persists to Supabase
- [ ] `POST /aftermath/report` → accepts real `cluster_context` from Module B (not mock), returns full HTML
- [ ] Module D displays urgency label + exit-risk warning + full HTML report in the UI
- [ ] Demo path: intake form → urgency banner → generate report → view/download

**Integration handoff with Module B:**
- Module D calls `/cluster/match` with the behavioral fingerprint from intake, then passes the result as `cluster_context` in `/aftermath/report`
- Test with a real `cluster_id` from Module B's seeded dataset

---

## Build Block 3 — Polish (Hours 30–34)

### Polish tasks (priority order)

1. **Edge cases**
   - `incident_timestamp` in the future → clamp `t=0`, return `CRITICAL`
   - `amount_lost = 0` → still process; urgency applies to non-monetary fraud types
   - Empty `digital_arrest_signals` → no alert, no crash
   - Unknown `fraud_type` → FastAPI 422 validation (handled by Pydantic automatically)

2. **Error handling**
   - Supabase client error → `503` with `{"detail": "Database unavailable"}`
   - `case_id` not found → `404`
   - Wrap all Supabase calls in `try/except`

3. **Logging**
   - Use `logging.getLogger("aftermath")`
   - Log `case_id`, `fraud_type`, `urgency_label` at intake; `case_id` at report generation

4. **Demo fallback**  
   Keep `DEMO_CASE` hardcoded dict in `routes.py`. If Supabase is flaky during demo, swap `_case_store` back in — report still generates correctly from in-memory data.

5. **Optional PDF** (only if time permits — see below)

---

## File Map

```
backend/
├── shared/
│   ├── db.py                  # Supabase client singleton (get_supabase())
│   └── db_schema.sql          # reports table DDL — run in Supabase SQL Editor
└── aftermath/
    ├── main.py                # FastAPI app entry + /health + CORS
    ├── routes.py              # Route handlers: /aftermath/intake, /aftermath/report
    ├── classifier.py          # Fraud-type branching + evidence schema validation
    ├── urgency_score.py       # P(t) = P0 * e^(-λt) time-decay model
    ├── exit_risk.py           # Crypto/forex conversion-endpoint pattern detection
    ├── digital_arrest_shield.py  # Panic alert rule engine (2-of-4 condition check)
    ├── report_generator.py    # HTML + text report compiler
    └── requirements.txt
```

Run server:
```bash
cd backend/aftermath
pip install -r requirements.txt
uvicorn main:app --reload --port 8003
```

---

## API Contract Reference

### `POST /aftermath/intake`

| Field | Type | Required | Notes |
|---|---|---|---|
| `fraud_type` | enum | ✅ | `upi_card` \| `job_fraud` \| `sextortion` \| `data_breach` \| `digital_arrest` |
| `victim_name` | string | ❌ | |
| `victim_contact` | string | ❌ | Phone or email |
| `incident_timestamp` | ISO-8601 | ✅ | **Must include UTC offset** (e.g. `+05:30`) — naive timestamps return `422` |
| `amount_lost` | float | ❌ | Default `0.0` |
| `currency` | string | ❌ | Default `"INR"` |
| `receiving_upi_id` | string | ❌ | UPI ID that received funds |
| `receiving_account` | string | ❌ | Bank account/IFSC — stored separately, not merged |
| `digital_arrest_signals` | list[str] | ❌ | Verbatim phrases the caller used |
| `evidence_text` | string | ❌ | Free-text victim account |
| `evidence_fields` | object | ❌ | Per-fraud-type structured fields (see schemas below) |

### `POST /aftermath/report`

| Field | Type | Required | Notes |
|---|---|---|---|
| `case_id` | UUID string | ✅ | Returned from intake |
| `cluster_context` | object | ❌ | Module B `/cluster/match` output; use mock until Checkpoint 2 |

---

## Data Schemas

### `evidence_fields` per `fraud_type`

| `fraud_type` | Fields |
|---|---|
| `upi_card` | `upi_id`, `transaction_ref`, `bank_name`, `card_last4` |
| `job_fraud` | `company_name`, `recruiter_name`, `platform_used`, `registration_fee_paid` |
| `sextortion` | `platform`, `threat_screenshot_url`, `demanded_amount` |
| `data_breach` | `affected_service`, `data_types_exposed`, `phishing_link` |
| `digital_arrest` | `caller_claimed_identity`, `call_duration_minutes`, `coercion_type` |

### Digital Arrest Shield — condition IDs

| ID | Triggered by |
|---|---|
| `STAY_ON_CALL` | "stay on call", "don't hang up", "remain on call" |
| `DONT_TELL_ANYONE` | "don't tell anyone", "don't disconnect", "keep this secret" |
| `TRANSFER_TO_PROVE` | "transfer to prove innocence", "deposit for bail", "pay for custody" |
| `CLAIMS_AUTHORITY` | "police", "CBI", "ED", "customs", "narcotic", "NCB", "judge" |

### Urgency score buckets

| Label | Score range | Time since fraud |
|---|---|---|
| `CRITICAL` | ≥ 0.75 | 0–10 min |
| `HIGH` | 0.50–0.74 | 10–23 min |
| `MEDIUM` | 0.25–0.49 | 23–46 min |
| `LOW` | < 0.25 | > 46 min |

---

## Known Ambiguities & Fixes

These were identified in the original draft and are resolved across the source files above.

| # | Issue | Resolution |
|---|---|---|
| **Fix 1** | `urgency_label` and `next_steps` missing from DB schema → `KeyError` at `/aftermath/report` | Added `urgency_label VARCHAR(16)` and `next_steps JSONB` to schema; stored at intake time; read at report time — never recalculated |
| **Fix 2** | Single `receiving_id` column silently dropped bank account when both UPI ID and account were provided | Split into `receiving_upi_id` + `receiving_account` (separate columns in schema, separate keys in INSERT and case dict) |
| **Fix 3** | Naive (timezone-unaware) IST timestamps silently treated as UTC → 330 min added to `delta_minutes` → immediate `LOW` urgency | `compute_urgency()` raises `ValueError` on naive timestamps; `IntakeRequest` field validator surfaces this as `422` before the function is called |
| **Fix 4** | Raw `payload.evidence_fields` bypassed Pydantic validation before reaching DB → arbitrary JSON keys persisted | DB insert uses `_validated_evidence.dict(exclude_none=True)` (return value of `classify_and_validate()`), not the raw payload dict |
| **Fix 5** | No SELECT logic documented for `/aftermath/report` DB path | Full SELECT + `case` dict reconstruction documented in Step 2.4; `routes.py` comments mark the BB2 swap points |

---

## Optional Add-on: PDF Generation

> **Time-permitting only.** Do NOT start until core functionality is complete and Checkpoint 2 is passed.

**Decision checklist before starting:**
- [ ] Core is 100% done
- [ ] Checkpoint 2 passed
- [ ] More than 4 hours remain in Build Block 3
- [ ] WeasyPrint system deps install cleanly on the demo machine

**Approach:** WeasyPrint (HTML → PDF). Reuses `report_html` from `generate_report()` — minimal extra code.

- `generate_pdf_bytes(report_html)` is already stubbed in [`report_generator.py`](./backend/aftermath/report_generator.py).
- `GET /aftermath/report/download/{case_id}` endpoint is already stubbed in [`routes.py`](./backend/aftermath/routes.py).
- Set `download_url` in `ReportResponse` to `/aftermath/report/download/{case_id}` once PDF is working.

Install: `pip install weasyprint`  
System deps (Ubuntu/Debian): `apt-get install libpango-1.0-0 libpangoft2-1.0-0`

---

> **Document status:** Phase 0 draft — all known ambiguities resolved (2026-09-12).  
> Key changes: timezone enforcement (Fix 3), dual receiving columns (Fix 2), validated evidence in DB (Fix 4), urgency_label/next_steps persisted (Fix 1), full SELECT documented (Fix 5), psycopg2 → supabase-py (Fix 6).  
> Update BB1/BB2 references and integration notes as each checkpoint is reached.
