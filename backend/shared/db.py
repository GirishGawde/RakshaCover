# backend/shared/db.py
# Supabase client singleton — shared across all modules.
#
# Required env vars (add to .env):
#   SUPABASE_URL              = https://<project-ref>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY = <service-role-key>

import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    """Returns a singleton Supabase client. Thread-safe for FastAPI's default worker model."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
        _client = create_client(url, key)
    return _client
