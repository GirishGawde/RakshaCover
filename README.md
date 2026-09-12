# RakshaCover

> **Hackathon Project** — Anti-fraud detection and reporting platform.  
> Read this file fully before you start. It is the single source of truth for project structure, module ownership, and how to run each part.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Module Ownership](#module-ownership)
3. [Frontend — Module D](#frontend--module-d)
4. [Backend — Module A (Prevention)](#backend--module-a-prevention)
5. [Backend — Module B (Cluster)](#backend--module-b-cluster)
6. [Backend — Module C (Aftermath)](#backend--module-c-aftermath)
7. [Shared Backend](#shared-backend)
8. [Docs](#docs)
9. [Phase 0 Checklist](#phase-0-checklist)
10. [How to Run](#how-to-run)

---

## Project Structure

```
RakshaCover/
├── README.md
├── CONTRACTS.md                     # Agreed request/response JSON shapes (Phase 0 sync doc)
│
├── frontend/                        # MODULE D
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing/home
│   │   ├── check/
│   │   │   └── page.tsx             # Link / QR / UPI Risk Check UI
│   │   ├── report/
│   │   │   ├── page.tsx             # Aftermath Intake UI (branching questionnaire)
│   │   │   ├── status/
│   │   │   │   └── page.tsx         # Urgency & Exit-Risk display UI
│   │   │   └── result/
│   │   │       └── page.tsx         # Auto-Drafted Report view UI
│   │   └── graph/
│   │       └── page.tsx             # Cluster Graph view UI
│   ├── components/                  # Shared UI components (navbar, banners, cards)
│   ├── lib/
│   │   ├── types.ts                 # Shared TypeScript types (mirrors CONTRACTS.md)
│   │   └── api/
│   │       ├── prevention.ts        # Calls Module A routes
│   │       ├── cluster.ts           # Calls Module B routes
│   │       └── aftermath.ts         # Calls Module C routes
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/
│   ├── prevention/                  # MODULE A
│   │   ├── main.py
│   │   ├── routes.py                # /check/link, /check/qr, /check/upi
│   │   ├── domain_check.py          # Levenshtein/RapidFuzz typo-domain logic
│   │   ├── whois_ssl_check.py       # Domain age + SSL check
│   │   ├── threat_feed.py           # PhishTank / URLhaus integration
│   │   ├── classifier.py            # scikit-learn model on UCI Phishing dataset
│   │   ├── qr_check.py              # QR decode (pyzbar) + VPA validity check
│   │   ├── upi_lookup.py            # UPI trust lookup against reports/clusters table
│   │   ├── data/
│   │   │   ├── domain_whitelist.csv
│   │   │   └── uci_phishing_dataset.csv
│   │   └── requirements.txt
│   │
│   ├── cluster/                     # MODULE B
│   │   ├── main.py
│   │   ├── routes.py                # /cluster/match, /cluster/graph
│   │   ├── feature_extraction.py    # TF-IDF + cosine similarity, pattern features
│   │   ├── clustering.py            # Incremental clustering logic
│   │   ├── graph_builder.py         # NetworkX graph construction
│   │   ├── bayesian_priors.py       # Cold-start priors + Bayesian updating
│   │   ├── data/
│   │   │   └── seed_reports.json    # Seeded/synthetic report data
│   │   └── requirements.txt
│   │
│   ├── aftermath/                   # MODULE C
│   │   ├── main.py
│   │   ├── routes.py                # /aftermath/intake, /aftermath/report
│   │   ├── classifier.py            # Fraud-type branching logic
│   │   ├── urgency_score.py         # P(t) = P0 * e^(-λt) time-decay model
│   │   ├── exit_risk.py             # Exit-risk flagging logic
│   │   ├── digital_arrest_shield.py # Hardcoded panic-check rule engine
│   │   ├── report_generator.py      # Auto-drafted report compiler
│   │   └── requirements.txt
│   │
│   └── shared/
│       ├── db_schema.sql            # Shared Postgres schema (Phase 0 output)
│       └── db.py                    # Shared DB connection helper
│
└── docs/
    ├── problem_statement.md
    ├── architecture_diagram.png
    └── demo_script.md
```

---

## Module Ownership

| Module | Folder | Responsibility |
|--------|--------|---------------|
| **Module A** | `backend/prevention/` | Link / QR / UPI fraud detection |
| **Module B** | `backend/cluster/` | Report clustering & graph construction |
| **Module C** | `backend/aftermath/` | Intake, urgency scoring, report generation |
| **Module D** | `frontend/` | All UI pages and API integration |

> **Rule:** Only touch your own module folder. For shared schema/DB changes, coordinate with the whole team first and update `CONTRACTS.md`.

---

## Frontend — Module D

**Stack:** Next.js 14 · App Router · TypeScript · Tailwind CSS

### Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing / home |
| `/check` | `app/check/page.tsx` | Link / QR / UPI Risk Check UI |
| `/report` | `app/report/page.tsx` | Aftermath Intake UI (branching questionnaire) |
| `/report/status` | `app/report/status/page.tsx` | Urgency & Exit-Risk display UI |
| `/report/result` | `app/report/result/page.tsx` | Auto-Drafted Report view UI |
| `/graph` | `app/graph/page.tsx` | Cluster Graph view UI |

### API helper files

| File | Calls |
|------|-------|
| `lib/api/prevention.ts` | Module A — `/check/link`, `/check/qr`, `/check/upi` |
| `lib/api/cluster.ts` | Module B — `/cluster/match`, `/cluster/graph` |
| `lib/api/aftermath.ts` | Module C — `/aftermath/intake`, `/aftermath/report` |

### Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Backend — Module A (Prevention)

**Stack:** Python · FastAPI (or Flask) · scikit-learn · pyzbar · RapidFuzz

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/check/link` | Analyse a URL for phishing |
| `POST` | `/check/qr` | Decode QR and check embedded link/VPA |
| `POST` | `/check/upi` | Validate UPI ID against reports/clusters |

### Key files

| File | Purpose |
|------|---------|
| `domain_check.py` | Levenshtein / RapidFuzz typo-domain detection |
| `whois_ssl_check.py` | Domain age + SSL validity |
| `threat_feed.py` | PhishTank / URLhaus live feed integration |
| `classifier.py` | scikit-learn model trained on UCI Phishing dataset |
| `qr_check.py` | QR decode (pyzbar) + VPA validity check |
| `upi_lookup.py` | UPI trust lookup against shared DB |

### Setup

```bash
cd backend/prevention
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

> **Note:** Some components in Module A currently use stubbed or localized mock data for hackathon purposes. Specifically, `upi_lookup.py` will require future wiring to Module B (Cluster) and Module C (Aftermath) to validate UPIs against real cross-module database tables instead of mocked scenarios.

---

## Backend — Module B (Cluster)

**Stack:** Python · FastAPI · scikit-learn (TF-IDF) · NetworkX

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/cluster/match` | Match incoming report to an existing cluster |
| `GET` | `/cluster/graph` | Return graph data for frontend visualisation |

### Key files

| File | Purpose |
|------|---------|
| `feature_extraction.py` | TF-IDF + cosine similarity, pattern feature engineering |
| `clustering.py` | Incremental clustering logic |
| `graph_builder.py` | NetworkX graph construction for the cluster graph |
| `bayesian_priors.py` | Cold-start priors + Bayesian score updating |
| `data/seed_reports.json` | Seeded / synthetic reports for initial clustering |

### Setup

```bash
cd backend/cluster
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

---

## Backend — Module C (Aftermath)

**Stack:** Python · FastAPI

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/aftermath/intake` | Accept branching questionnaire answers |
| `POST` | `/aftermath/report` | Generate and return auto-drafted report |

### Key files

| File | Purpose |
|------|---------|
| `classifier.py` | Fraud-type branching logic (routes questionnaire) |
| `urgency_score.py` | Time-decay model — `P(t) = P₀ · e^(−λt)` |
| `exit_risk.py` | Exit-risk flagging logic |
| `digital_arrest_shield.py` | Hardcoded panic-check rule engine |
| `report_generator.py` | Compiles auto-drafted FIR/complaint report |

### Setup

```bash
cd backend/aftermath
pip install -r requirements.txt
uvicorn main:app --reload --port 8003
```

---

## Shared Backend

Location: `backend/shared/`

| File | Purpose |
|------|---------|
| `db_schema.sql` | Shared Postgres schema — agreed in Phase 0 |
| `db.py` | Shared DB connection helper — import from any module |

> ⚠️ **Do not modify `db_schema.sql` without team consensus.** Any schema change must be reflected in `CONTRACTS.md`.

---

## Docs

| File | Purpose |
|------|---------|
| `docs/problem_statement.md` | Problem statement and scope |
| `docs/architecture_diagram.png` | System architecture diagram |
| `docs/demo_script.md` | Demo flow script for presentation |

---

## Phase 0 Checklist

Before anyone writes feature code, complete these as a team:

- [ ] Agree on all request/response JSON shapes → document in `CONTRACTS.md`
- [ ] Finalise `backend/shared/db_schema.sql` and run migrations
- [ ] Each backend module's `main.py` returns a `200 OK` health check at `/health`
- [ ] Frontend `lib/api/*.ts` files have base URL env var (`NEXT_PUBLIC_API_BASE_URL`) configured
- [ ] All modules can be run simultaneously without port conflicts (8001 / 8002 / 8003 / 3000)

---

## How to Run (All Modules)

Open **4 terminals**:

```bash
# Terminal 1 — Frontend
cd frontend && npm install && npm run dev

# Terminal 2 — Module A (Prevention)
cd backend/prevention && pip install -r requirements.txt && uvicorn main:app --reload --port 8001

# Terminal 3 — Module B (Cluster)
cd backend/cluster && pip install -r requirements.txt && uvicorn main:app --reload --port 8002

# Terminal 4 — Module C (Aftermath)
cd backend/aftermath && pip install -r requirements.txt && uvicorn main:app --reload --port 8003
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Module A — Prevention | http://localhost:8000 |
| Module B — Cluster | http://localhost:8000 |
| Module C — Aftermath | http://localhost:8000 |
