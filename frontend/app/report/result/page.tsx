"use client";

import { useEffect, useState } from "react";
import { FileText, Copy, Download, CheckCircle2 } from "lucide-react";
import { generateReport } from "@/lib/api/aftermath";
import type { AftermathReportResponse } from "@/lib/types";

export default function ReportResultPage() {
  const [report, setReport] = useState<AftermathReportResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateReport({}).then((res) => {
      // Dynamic Mock Overwrite for Demo Purposes
      const savedData = sessionStorage.getItem("raksha_intake");
      if (savedData) {
        const data = JSON.parse(savedData);
        let dynamicText = `=================================================\nFORMAL COMPLAINT TO CYBER CRIME HELPLINE (1930)\n=================================================\n\nDate of Generation: ${new Date().toLocaleDateString()}\nVictim Name: [Your Name]\n\n`;
        
        if (data.fraudType === "UPI_FRAUD") {
          dynamicText += `SUBJECT: Request for Immediate Account Freeze & Reversal of Fraudulent Transaction\n\nI wish to report a financial fraud transaction. I was deceived into transferring funds to a fraudulent UPI account.\n\nTRANSACTION DETAILS:\n--------------------\n• UTR Number      : ${data.utr || "N/A"}\n• Amount          : ₹${data.amount || "0"}\n• Receiving VPA   : ${data.receivingVpa || "N/A"}\n\n`;
        } else if (data.fraudType === "JOB_FRAUD") {
          dynamicText += `SUBJECT: Request for Action Against Fraudulent Job Offer Scheme\n\nI wish to report an online job/task fraud. I was recruited under false pretenses and coerced into making payments.\n\nINCIDENT DETAILS:\n-----------------\n• Platform Used   : ${data.platform || "N/A"}\n• Recruiter Contact: ${data.recruiterContact || "N/A"}\n• Proof of Payment: ${data.paymentProof || "Provided upon request"}\n\n`;
        } else if (data.fraudType === "SEXTORTION") {
          dynamicText += `SUBJECT: Confidential Report of Online Extortion & Coercion\n\nI wish to urgently report a case of online extortion. The perpetrator is threatening to release private media unless their demands are met.\n\nINCIDENT DETAILS:\n-----------------\n• Platform & Handle : ${data.platformHandle || "N/A"}\n• Encrypted Locker  : ${data.evidenceLocker || "Provided upon official request"}\n\n`;
        } else if (data.fraudType === "DIGITAL_ARREST") {
          dynamicText += `SUBJECT: Report of Impersonation of Law Enforcement (Digital Arrest Scam)\n\nI wish to report a severe impersonation scam where individuals posed as Police/CBI/Customs officials over a video call to extort funds through intimidation.\n\nINCIDENT DETAILS:\n-----------------\n• Note: Call disconnected safely. No funds were transferred.\n\n`;
        }
        
        dynamicText += `RAKSHA-COVER INTELLIGENCE BRIEF:\n--------------------------------\n⚠️ HIGH SEVERITY ALERT\nThe provided entities have been flagged by the RakshaCover Intelligence Platform. They are positively linked to a known threat cluster, indicating professional organized activity.\n\nREQUESTED ACTION:\n-----------------\n1. Initiate immediate investigation and tracking of digital footprints.\n2. Register an FIR under relevant sections of the IT Act.\n\nThank you for your prompt action.\n\n[Your Signature]`;
        
        res.reportText = dynamicText;
      }
      setReport(res);
    }).catch(console.error);
  }, []);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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

      <div className="flex gap-4 print:hidden">
        <button onClick={handleCopy} className="btn-red flex-1 flex items-center justify-center gap-2 py-3">
          <Copy className="w-5 h-5" /> Copy Script for 1930 Call
        </button>
        <button onClick={handlePrint} className="btn-ghost flex-1 flex items-center justify-center gap-2 py-3">
          <Download className="w-5 h-5" /> Download / Print PDF
        </button>
      </div>
    </div>
  );
}
