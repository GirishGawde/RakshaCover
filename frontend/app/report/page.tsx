"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Briefcase, Camera, Video, AlertOctagon, CheckSquare } from "lucide-react";
import { submitIntake } from "@/lib/api/aftermath";

const fraudTypes = [
  { id: "UPI_FRAUD",      label: "UPI / Card Fraud",  icon: CreditCard, color: "blue",  desc: "Money sent to a scammer via UPI, IMPS, or card." },
  { id: "JOB_FRAUD",      label: "Job / Task Fraud",  icon: Briefcase,  color: "amber", desc: "Paid money for a fake job or online tasks." },
  { id: "SEXTORTION",     label: "Sextortion",        icon: Camera,     color: "purple",desc: "Blackmail using intimate photos or videos." },
  { id: "DIGITAL_ARREST", label: "Digital Arrest",    icon: Video,      color: "red",   desc: "Fake police/CBI on video call threatening arrest." },
] as const;

type FraudTypeId = typeof fraudTypes[number]["id"];

const colorMap = {
  blue:   { ring: "hover:border-blue-500",   icon: "bg-blue-500/10 group-hover:bg-blue-500/20",   text: "text-blue-400" },
  amber:  { ring: "hover:border-amber-500",  icon: "bg-amber-500/10 group-hover:bg-amber-500/20", text: "text-amber-400" },
  purple: { ring: "hover:border-purple-500", icon: "bg-purple-500/10 group-hover:bg-purple-500/20",text: "text-purple-400" },
  red:    { ring: "hover:border-red-500",    icon: "bg-red-500/10 group-hover:bg-red-500/20",     text: "text-[#e63946]" },
};

export default function ReportPage() {
  const router = useRouter();
  const [fraudType, setFraudType] = useState<FraudTypeId | null>(null);
  const [loading, setLoading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const [form, setForm] = useState({
    // UPI
    utr: "", amount: "", receivingVpa: "", timestamp: "",
    // Job
    platform: "", recruiterContact: "", paymentProof: "",
    // Sextortion
    platformHandle: "", evidenceLocker: ""
  });

  const handleNext = async () => {
    if (!fraudType) return;
    setLoading(true);
    try { 
      // Save form locally for the result page to use
      sessionStorage.setItem("raksha_intake", JSON.stringify({ fraudType, ...form }));
      await submitIntake({ fraudType, ...form }); 
      router.push("/report/status"); 
    } catch (e) { 
      console.error(e); 
      setLoading(false); 
    }
  };

  const isFormValid = () => {
    switch (fraudType) {
      case "UPI_FRAUD": return form.utr && form.amount;
      case "JOB_FRAUD": return form.platform && form.recruiterContact;
      case "SEXTORTION": return form.platformHandle;
      case "DIGITAL_ARREST": return disclaimerAccepted;
      default: return false;
    }
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
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-[#2a2a2a]">
            <h2 className="text-xl font-bold flex items-center gap-3">
              {fraudTypes.find(f => f.id === fraudType)?.icon && (
                <div className="w-8 h-8 rounded bg-[#1e1e1e] flex items-center justify-center">
                  {(() => {
                    const Icon = fraudTypes.find(f => f.id === fraudType)!.icon;
                    return <Icon className="w-4 h-4 text-[#9ca3af]" />;
                  })()}
                </div>
              )}
              {fraudTypes.find(f => f.id === fraudType)?.label} Details
            </h2>
            <button onClick={() => setFraudType(null)} className="text-sm text-[#e63946] hover:underline">
              ← Change type
            </button>
          </div>

          <div className="space-y-5">
            
            {/* 1. UPI / Card Fraud Fields */}
            {fraudType === "UPI_FRAUD" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">UTR / Transaction Number *</label>
                  <input className="input-dark" placeholder="123456789012" value={form.utr} onChange={e => setForm({ ...form, utr: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Amount Lost (₹) *</label>
                  <input className="input-dark" type="number" placeholder="25000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Receiving VPA / Account</label>
                  <input className="input-dark" placeholder="fraudster@ybl" value={form.receivingVpa} onChange={e => setForm({ ...form, receivingVpa: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Date & Time of Transaction</label>
                  <input className="input-dark" type="datetime-local" value={form.timestamp} onChange={e => setForm({ ...form, timestamp: e.target.value })} />
                </div>
              </>
            )}

            {/* 2. Job / Task Fraud Fields */}
            {fraudType === "JOB_FRAUD" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Platform used (Telegram, WhatsApp, etc) *</label>
                  <input className="input-dark" placeholder="e.g., Telegram Group 'Earn Money Fast'" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Recruiter Contact / Phone Number *</label>
                  <input className="input-dark" placeholder="+91 98765 43210" value={form.recruiterContact} onChange={e => setForm({ ...form, recruiterContact: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Proof of Payment Link (Optional)</label>
                  <input className="input-dark" placeholder="Google Drive link to screenshots" value={form.paymentProof} onChange={e => setForm({ ...form, paymentProof: e.target.value })} />
                </div>
              </>
            )}

            {/* 3. Sextortion Fields */}
            {fraudType === "SEXTORTION" && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg mb-4 text-sm text-purple-200">
                  Your privacy is our priority. Do not upload sensitive media directly to this form.
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Platform & Handle of the Scammer *</label>
                  <input className="input-dark" placeholder="e.g., Instagram: @fake_profile_123" value={form.platformHandle} onChange={e => setForm({ ...form, platformHandle: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Evidence Locker Link (Encrypted Drive)</label>
                  <input className="input-dark" placeholder="Link to encrypted folder (if instructed by police)" value={form.evidenceLocker} onChange={e => setForm({ ...form, evidenceLocker: e.target.value })} />
                </div>
              </>
            )}

            {/* 4. Digital Arrest Fields */}
            {fraudType === "DIGITAL_ARREST" && (
              <div className="space-y-4">
                <div className="bg-[#e63946]/10 border border-[#e63946]/30 p-5 rounded-lg flex gap-4">
                  <AlertOctagon className="w-8 h-8 text-[#e63946] shrink-0" />
                  <div>
                    <h3 className="font-bold text-[#e63946] mb-2">CRITICAL LEGAL DISCLAIMER</h3>
                    <ul className="text-sm text-[#fca5a5] space-y-2 list-disc pl-4">
                      <li>Indian Police, CBI, ED, or Customs <strong>NEVER</strong> arrest anyone digitally over a video call (Skype/WhatsApp).</li>
                      <li>Government agencies <strong>NEVER</strong> ask you to transfer money to a "Safe Account" or "RBI Account".</li>
                      <li>Disconnect the call immediately. You are not in legal trouble.</li>
                    </ul>
                  </div>
                </div>
                
                <label className="flex items-start gap-3 p-4 bg-[#161616] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#e63946] transition-colors mt-6">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e63946] focus:ring-[#e63946]"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  />
                  <div className="text-sm text-[#d1d5db]">
                    I understand that this is a scam. I have disconnected the call and blocked the numbers. Generate my 1930 complaint script.
                  </div>
                </label>
              </div>
            )}
            
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={loading || !isFormValid()}
              className="btn-red px-7 py-3"
            >
              {loading ? "Analysing Threat Level…" : "Assess Risk & Generate Report →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
