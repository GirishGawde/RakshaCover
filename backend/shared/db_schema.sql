-- backend/shared/db_schema.sql
-- Module C (Aftermath & Recovery) — reports table
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Design notes:
--   Fix 1: urgency_label + next_steps persisted at intake so /aftermath/report
--          never needs to recalculate them from a stale timestamp.
--   Fix 2: receiving_upi_id and receiving_account stored as separate columns so
--          neither is silently dropped when a victim provides both.
--   Fix 4: evidence_fields stores only Pydantic-validated keys (no raw client input).

CREATE TABLE IF NOT EXISTS reports (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    fraud_type        VARCHAR(32) NOT NULL,
    victim_name       VARCHAR(256),
    victim_contact    VARCHAR(128),
    incident_ts       TIMESTAMPTZ NOT NULL,
    ingested_ts       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount_lost       NUMERIC(14, 2),
    currency          CHAR(3)     DEFAULT 'INR',

    -- Fix 2: two columns, not one — no silent data loss
    receiving_upi_id  VARCHAR(256),
    receiving_account VARCHAR(256),

    evidence_text     TEXT,
    -- Fix 4: only schema-validated fields reach this column
    evidence_fields   JSONB,

    urgency_score     FLOAT,
    -- Fix 1: label + steps stored at intake time
    urgency_label     VARCHAR(16) DEFAULT 'LOW',
    next_steps        JSONB,

    exit_risk_flag    BOOLEAN     DEFAULT FALSE,
    da_alert          BOOLEAN     DEFAULT FALSE,
    cluster_id        VARCHAR(64),
    report_html       TEXT,
    status            VARCHAR(32) DEFAULT 'open'
);

-- Recommended indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reports_fraud_type  ON reports (fraud_type);
CREATE INDEX IF NOT EXISTS idx_reports_ingested_ts ON reports (ingested_ts DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports (status);
