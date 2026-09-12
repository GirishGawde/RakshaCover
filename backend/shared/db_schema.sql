-- ═══════════════════════════════════════════════════════════════════════════
-- RakshaCover — Shared PostgreSQL Schema
-- Module E: Database & Supabase Infrastructure
--
-- HOW TO USE:
--   1. Log in to your Supabase project dashboard.
--   2. Go to: SQL Editor → New Query
--   3. Paste this entire file and click Run.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- TABLE: reports
-- Stores individual fraud incident reports.
-- ─────────────────────────────────────────────
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
    cluster_id        UUID,
    report_html       TEXT,
    status            VARCHAR(32) DEFAULT 'open'
);

-- ─────────────────────────────────────────────
-- TABLE: clusters
-- Stores fraud network clusters (built by Module B).
-- Realtime is enabled on this table (see Phase 2 of database.md).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clusters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_hash     TEXT UNIQUE NOT NULL,      -- Hash identifying this cluster pattern
  label            TEXT,                      -- Human-readable cluster label
  report_count     INTEGER DEFAULT 0,
  confidence_score NUMERIC(4, 3) DEFAULT 0,  -- 0.000–1.000
  graph_json       JSONB,                     -- Full nodes/edges payload for Cytoscape
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: domain_whitelist
-- Pre-seeded with trusted bank/merchant domains.
-- Frontend (Module D) can query this directly via Supabase REST.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domain_whitelist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT UNIQUE NOT NULL,    -- e.g. "sbi.co.in", "paytm.com"
  description TEXT,                   -- Human-readable label
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FK: reports → clusters
-- ─────────────────────────────────────────────
ALTER TABLE reports
  ADD CONSTRAINT fk_reports_cluster
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- AUTO-UPDATE: clusters.updated_at trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clusters_updated_at
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Enable on ALL tables immediately. Default = deny everything.
-- Specific policies are added below.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_whitelist ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- RLS POLICIES: domain_whitelist
-- Public read (anon key OK). No writes from frontend.
-- ─────────────────────────────────────────────
CREATE POLICY "domain_whitelist__public_read"
  ON domain_whitelist FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- RLS POLICIES: reports
-- Public read (needed for Module D graph display).
-- Insert from authenticated users only.
-- Module B/C update via service_role (bypasses RLS).
-- ─────────────────────────────────────────────
CREATE POLICY "reports__public_read"
  ON reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "reports__authenticated_insert"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- RLS POLICIES: clusters
-- Public read (frontend Cytoscape graph).
-- All writes via service_role only (Module B).
-- ─────────────────────────────────────────────
CREATE POLICY "clusters__public_read"
  ON clusters FOR SELECT
  TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES (for performance on common queries)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_reports_fraud_type  ON reports (fraud_type);
CREATE INDEX IF NOT EXISTS idx_reports_cluster_id  ON reports (cluster_id);
CREATE INDEX IF NOT EXISTS idx_reports_ingested_ts ON reports (ingested_ts DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports (status);
CREATE INDEX IF NOT EXISTS idx_clusters_hash       ON clusters (network_hash);
CREATE INDEX IF NOT EXISTS idx_whitelist_domain    ON domain_whitelist (domain_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Schema created successfully.
-- ═══════════════════════════════════════════════════════════════════════════
