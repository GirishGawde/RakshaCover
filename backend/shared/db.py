"""
backend/shared/db.py — Shared Supabase / PostgreSQL connection helper
Module E: Database Infrastructure

Used by: Module A (prevention), Module B (cluster), Module C (aftermath)

IMPORTANT:
  - This module uses the SERVICE ROLE key — it bypasses Row-Level Security.
  - Never expose this key on the frontend.
  - Store SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a .env file
    at the backend root or per-module, and load with python-dotenv.

Install dependency:
  pip install supabase python-dotenv
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")

# Singleton client
_client: Client | None = None

def get_db() -> Client:
    """
    Returns a Supabase client using the service_role key.
    This bypasses RLS and is safe to use ONLY on the backend.
    """
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client

# Alias for backwards compatibility with aftermath branch
get_supabase = get_db

# ─── Convenience helpers ─────────────────────────────────────────────────────

def insert_report(payload: dict) -> dict:
    """Insert a new fraud report. Returns the inserted row."""
    db = get_db()
    response = db.table("reports").insert(payload).execute()
    return response.data[0] if response.data else {}


def get_cluster_by_hash(network_hash: str) -> dict | None:
    """Look up a cluster by its network hash."""
    db = get_db()
    response = (
        db.table("clusters")
        .select("*")
        .eq("network_hash", network_hash)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def upsert_cluster(payload: dict) -> dict:
    """Create or update a cluster record."""
    db = get_db()
    response = (
        db.table("clusters")
        .upsert(payload, on_conflict="network_hash")
        .execute()
    )
    return response.data[0] if response.data else {}


def is_upi_in_reports(vpa: str) -> bool:
    """Check if a VPA appears in any existing fraud report."""
    db = get_db()
    response = (
        db.table("reports")
        .select("id", count="exact")
        .eq("upi_id", vpa)
        .execute()
    )
    return (response.count or 0) > 0


def get_domain_whitelist() -> list[dict]:
    """Fetch all entries from the domain_whitelist table."""
    db = get_db()
    response = db.table("domain_whitelist").select("*").execute()
    return response.data or []
