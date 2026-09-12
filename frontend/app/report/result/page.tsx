"use client";

import { useEffect, useState } from "react";
import { FileText, Copy, Download, CheckCircle2 } from "lucide-react";
import { generateReport } from "@/lib/api/aftermath";
import type { AftermathReportResponse } from "@/lib/types";

export default function ReportResultPage() {
  const [report, setReport] = useState<AftermathReportResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateReport({}).then(setReport).catch(console.error);
  }, []);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!report) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] text-[#4b5563]">
      Generating complaint script…
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 animate-fade-in">
      <div className="mb-2 text-[#e63946] text-xs font-semibold uppercase tracking-widest">Aftermath · Module C</div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Auto-Drafted Report</h1>
          <p className="text-[#9ca3af]">Your 1930 helpline script is ready to use.</p>
        </div>
        <div className="text-right">
          <div className="text-[#6b7280] text-xs uppercase tracking-wider mb-1">Report ID</div>
          <div className="font-mono text-sm text-[#e63946] bg-[#e63946]/10 px-3 py-1 rounded-lg">{report.reportId}</div>
        </div>
      </div>

      {/* Script card */}
      <div className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="w-4 h-4 text-[#e63946]" />
            1930 Helpline Script
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white transition-colors">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="p-6 max-h-80 overflow-y-auto">
          <pre className="font-mono text-sm text-[#d1d5db] whitespace-pre-wrap leading-relaxed">
            {report.reportText}
          </pre>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleCopy} className="btn-red flex-1 flex items-center justify-center gap-2 py-3">
          <Copy className="w-5 h-5" /> Copy Script for 1930 Call
        </button>
        <button className="btn-ghost flex-1 flex items-center justify-center gap-2 py-3">
          <Download className="w-5 h-5" /> Download NCRP PDF
        </button>
      </div>
    </div>
  );
}
