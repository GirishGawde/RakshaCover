# RakshaCover — Sync Phases (36-hour timeline)

Three sync checkpoints, kept deliberately few so each module gets long uninterrupted build blocks.

| Phase | Hours | What happens | Sync requirement |
|---|---|---|---|
| **Phase 0 — Contracts** | 0–3 | All 4 people together: lock DB schema, lock API request/response contracts for every endpoint, agree on seed data shape, scaffold repo. | Mandatory, full team, before anyone branches off |
| **Build Block 1** | 3–16 | Independent work: Module A builds scoring engine, Module B builds clustering/graph core, Module C builds aftermath routing + urgency + shield, Module D builds UI shells against mocked API responses. | None — heads-down |
| **Checkpoint 1 — Standalone Verified** | ~16–18 | Each module demonstrates its core logic working standalone (script/Postman call, not UI): A returns a real risk score, B builds a cluster graph from seed data, C routes a case and computes urgency, D has UI shells ready to receive real data. First real API wiring: at least the Link Checker path (A → D) goes fully live end-to-end. | Short team sync (~1hr): confirm no contract has drifted, unblock anyone stuck |
| **Build Block 2** | 18–28 | Continue building: A finishes QR/UPI checks + classifier, B finishes Bayesian priors + static graph export, C finishes exit-risk + auto-draft report, D wires remaining endpoints as they land. | None — heads-down |
| **Checkpoint 2 — Full Integration** | ~28–30 | All modules wired together through Module D. Full seeded dataset loaded. End-to-end flows tested: Link/QR/UPI check → risk score; report submission → cluster match → aftermath routing → auto-drafted report with cluster context. | Full team, this is the critical sync — treat as a hard bug-bash session |
| **Build Block 3 — Polish** | 30–34 | Fix integration bugs found in Checkpoint 2, polish UI, tighten demo flow, prepare fallback (cached/seeded responses) for anything flaky. | None, but keep channel open for quick fixes |
| **Final — Submission** | 34–36 | PPT, demo video, README, GitHub public repo, deploy. | Full team, final review together |

## Notes

- **Checkpoint 1 is the riskiest to skip** — it's where you catch contract mismatches (e.g. Module A returns a score as a float when Module D expects an int) while there's still enough runway to fix them cheaply.
- **Checkpoint 2 is non-negotiable** — this is the actual "is the project alive end-to-end" moment. If something core isn't working by hour 30, cut it from the demo script rather than the timeline.
- Keep Build Blocks 1 and 2 genuinely heads-down — no scheduled meetings — so each module owner gets real uninterrupted time; ad-hoc questions can go in a shared chat instead of a call.
