"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { submitIntake } from "@/lib/api/aftermath";
import type { AftermathIntakeResponse } from "@/lib/types";

export default function ReportStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<AftermathIntakeResponse | null>(null);

  useEffect(() => {
    submitIntake({}).then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] text-[#4b5563]">
      Calculating threat level…
    </div>
  );

  const pct = Math.round(data.urgencyScore * 100);
  const urgencyColor = pct > 70 ? "#e63946" : pct > 40 ? "#f59e0b" : "#10b981";

  return (
    <div className="max-w-2xl mx-auto px-6 py-14 animate-fade-in">
      <div className="mb-2 text-[#e63946] text-xs font-semibold uppercase tracking-widest">Aftermath · Module C</div>
      <h1 className="text-3xl font-black mb-8">Threat Assessment</h1>

      {/* Exit-risk alert */}
      {data.exitRisk && (
        <div className="mb-6 p-5 rounded-xl border border-[#e63946]/40 bg-[#e63946]/10 flex gap-4 items-start">
          <ShieldAlert className="w-8 h-8 text-[#e63946] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#e63946] text-lg mb-1">High Exit-Risk Detected</div>
            <p className="text-[#fca5a5] text-sm">{data.exitRiskReason}</p>
            <p className="text-[#fca5a5] text-sm mt-2 font-semibold">
              Funds may be converted to crypto imminently. Call 1930 NOW.
            </p>
          </div>
        </div>
      )}

      {/* Urgency Score */}
      <div className="card p-8 mb-5">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[#9ca3af] text-xs uppercase tracking-widest font-semibold mb-2">Urgency Score</div>
            <div className="text-6xl font-black" style={{ color: urgencyColor }}>
              {pct}<span className="text-3xl text-[#4b5563]">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-[#2a2a2a] px-4 py-2 rounded-xl bg-[#1e1e1e]">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-semibold text-sm">Golden Hour Active</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#1e1e1e] rounded-full h-3 overflow-hidden border border-[#2a2a2a]">
          <div
            className="h-3 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: urgencyColor, boxShadow: `0 0 12px ${urgencyColor}` }}
          />
        </div>
        <p className="text-xs text-[#6b7280] text-right mt-2">
          Recovery probability drops {(data.decayRate * 100).toFixed(0)}% every hour
        </p>
      </div>

      {/* Fraud type warning */}
      {!data.exitRisk && (
        <div className="flex gap-3 items-center p-4 rounded-xl border border-[#2a2a2a] bg-[#161616] mb-6 text-sm text-[#9ca3af]">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          Act within the golden hour to maximise fund recovery chances.
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => router.push("/report/result")}
          className="btn-red flex items-center gap-2 px-7 py-3"
        >
          View Auto-Drafted Report <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
