-- ═══════════════════════════════════════════════════════════════════════════
-- RakshaCover — Shared PostgreSQL Schema (Phase 0 Output)
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
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fraud_type      TEXT NOT NULL CHECK (fraud_type IN ('UPI_FRAUD','JOB_FRAUD','SEXTORTION','DIGITAL_ARREST','OTHER')),
  upi_id          TEXT,                   -- Receiving VPA, if applicable
  utr             TEXT,                   -- Transaction UTR number
  amount          NUMERIC(12, 2),         -- Amount lost (INR)
  description     TEXT,                   -- Free-text victim description
  urgency_score   NUMERIC(4, 3),          -- 0.000–1.000 (Module C output)
  exit_risk       BOOLEAN DEFAULT FALSE,  -- Exit-risk flag (Module C)
  cluster_id      UUID,                   -- FK to clusters (populated by Module B)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_reports_upi_id      ON reports (upi_id);
CREATE INDEX IF NOT EXISTS idx_clusters_hash       ON clusters (network_hash);
CREATE INDEX IF NOT EXISTS idx_whitelist_domain    ON domain_whitelist (domain_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Schema created successfully.
-- ═══════════════════════════════════════════════════════════════════════════
