"use client";

import { useEffect, useState } from "react";
import { getAllWhitelistDomains, type WhitelistEntry } from "@/lib/db/whitelist";
import { getRecentReports, type ReportRow } from "@/lib/db/reports";
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react";

export default function DbTestPage() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setStatus("loading");
    setError(null);
    try {
      const [wl, rp] = await Promise.all([
        getAllWhitelistDomains(),
        getRecentReports(5),
      ]);
      setWhitelist(wl);
      setReports(rp);
      setStatus("ok");
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      setStatus("error");
    }
  };

  useEffect(() => { runTest(); }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
      </div>
      <p className="text-gray-500 mb-8">
        Phase 1 verification — confirms the frontend can read from Supabase directly.
        <br />
        <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
          supabase.from(&apos;domain_whitelist&apos;).select(&apos;*&apos;)
        </span>
      </p>

      {/* Status Badge */}
      <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border">
        {status === "loading" && <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />}
        {status === "ok"      && <CheckCircle2 className="w-6 h-6 text-green-600" />}
        {status === "error"   && <XCircle className="w-6 h-6 text-red-600" />}
        <div>
          <div className="font-semibold text-gray-900">
            {status === "loading" && "Connecting to Supabase..."}
            {status === "ok"      && `Connected ✅  — ${whitelist.length} domains, ${reports.length} reports fetched`}
            {status === "error"   && "Connection failed ❌"}
          </div>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          {status === "error" && (
            <p className="text-sm text-gray-500 mt-1">
              Check that <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set in{" "}
              <code>.env.local</code> and restart the dev server.
            </p>
          )}
        </div>
        <button
          onClick={runTest}
          className="ml-auto px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          Re-run test
        </button>
      </div>

      {/* domain_whitelist results */}
      {whitelist.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            domain_whitelist <span className="text-gray-400 font-normal">({whitelist.length} rows)</span>
          </h2>
          <div className="overflow-auto max-h-60 border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Domain</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody>
                {whitelist.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-indigo-700">{row.domain_name}</td>
                    <td className="px-4 py-2 text-gray-600">{row.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* reports results */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          reports <span className="text-gray-400 font-normal">({reports.length} most recent)</span>
        </h2>
        {reports.length === 0 ? (
          <p className="text-gray-400 italic text-sm">No reports yet. Seed data will appear here after Phase 4.</p>
        ) : (
          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Fraud Type</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">UPI ID</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{row.fraud_type}</td>
                    <td className="px-4 py-2 text-gray-700">{row.upi_id ?? "—"}</td>
                    <td className="px-4 py-2">₹{row.amount?.toLocaleString("en-IN") ?? "—"}</td>
                    <td className="px-4 py-2">{row.urgency_score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
