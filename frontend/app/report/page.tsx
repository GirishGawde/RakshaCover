"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Briefcase, Camera, Video } from "lucide-react";
import { submitIntake } from "@/lib/api/aftermath";

const fraudTypes = [
  { id: "UPI_FRAUD",      label: "UPI / Card Fraud",  icon: CreditCard, color: "blue",  desc: "Money sent to a scammer via UPI, IMPS, or card." },
  { id: "JOB_FRAUD",      label: "Job / Task Fraud",  icon: Briefcase,  color: "amber", desc: "Paid money for a fake job or online tasks." },
  { id: "SEXTORTION",     label: "Sextortion",        icon: Camera,     color: "purple",desc: "Blackmail using intimate photos or videos." },
  { id: "DIGITAL_ARREST", label: "Digital Arrest",    icon: Video,      color: "red",   desc: "Fake police/CBI on video call threatening arrest." },
] as const;

const colorMap = {
  blue:   { ring: "hover:border-blue-500",   icon: "bg-blue-500/10 group-hover:bg-blue-500/20",   text: "text-blue-400" },
  amber:  { ring: "hover:border-amber-500",  icon: "bg-amber-500/10 group-hover:bg-amber-500/20", text: "text-amber-400" },
  purple: { ring: "hover:border-purple-500", icon: "bg-purple-500/10 group-hover:bg-purple-500/20",text: "text-purple-400" },
  red:    { ring: "hover:border-red-500",    icon: "bg-red-500/10 group-hover:bg-red-500/20",     text: "text-[#e63946]" },
};

export default function ReportPage() {
  const router = useRouter();
  const [fraudType, setFraudType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ utr: "", amount: "", receivingVpa: "" });

  const handleNext = async () => {
    if (!fraudType) return;
    setLoading(true);
    try { await submitIntake({ fraudType, ...form }); router.push("/report/status"); }
    catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14 animate-fade-in">
      <div className="mb-2 text-[#e63946] text-xs font-semibold uppercase tracking-widest">Aftermath · Module C</div>
      <h1 className="text-3xl font-black mb-2">Report an Incident</h1>
      <p className="text-[#9ca3af] mb-10">Select the fraud type, fill in the details, and we'll generate your 1930 script.</p>

      {!fraudType ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fraudTypes.map(({ id, label, icon: Icon, color, desc }) => {
            const c = colorMap[color];
            return (
              <button
                key={id}
                onClick={() => setFraudType(id)}
                className={`card card-hover text-left p-5 block group border border-[#2a2a2a] ${c.ring} transition-all`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${c.icon}`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <div className="font-bold mb-1">{label}</div>
                <div className="text-[#6b7280] text-sm">{desc}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Incident Details</h2>
            <button onClick={() => setFraudType(null)} className="text-sm text-[#e63946] hover:underline">
              ← Change type
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">UTR / Transaction Number</label>
              <input className="input-dark" placeholder="123456789012" value={form.utr} onChange={e => setForm({ ...form, utr: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Amount Lost (₹)</label>
              <input className="input-dark" type="number" placeholder="25000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Receiving VPA / Account</label>
              <input className="input-dark" placeholder="fraudster@ybl" value={form.receivingVpa} onChange={e => setForm({ ...form, receivingVpa: e.target.value })} />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={loading || !form.utr || !form.amount}
              className="btn-red px-7 py-3"
            >
              {loading ? "Analysing…" : "Assess Risk & Generate Report →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
