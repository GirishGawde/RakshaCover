/**
 * API Client — RakshaCover Module D
 *
 * USE_MOCKS is now set to false for Phase 4.
 * Endpoints will attempt to hit live FastAPI routes, but have a built-in
 * fallback in the modules to use mock data if the backend is unreachable.
 */

export const USE_MOCKS = false;

// Note: Ensure this matches the FastAPI ports. We have 3 different ports (8001, 8002, 8003).
// I will create specific fetch functions that accept the base URL.

export async function apiGet<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
