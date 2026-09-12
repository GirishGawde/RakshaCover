"use client";

import { useState } from "react";
import { Link2, Search, QrCode, UploadCloud } from "lucide-react";
import { RiskBanner } from "@/components/RiskBanner";
import { checkLink, checkQr, checkUpi } from "@/lib/api/prevention";
import type { CheckLinkResponse, CheckQrResponse, CheckUpiResponse } from "@/lib/types";

const tabs = [
  { id: "LINK", label: "Link Scanner", icon: Link2 },
  { id: "UPI",  label: "UPI Lookup",   icon: Search  },
  { id: "QR",   label: "QR Safety",    icon: QrCode  },
] as const;

type Tab = typeof tabs[number]["id"];

export default function CheckPage() {
  const [active, setActive] = useState<Tab>("LINK");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkRes, setLinkRes] = useState<CheckLinkResponse | null>(null);
  const [upiRes, setUpiRes] = useState<CheckUpiResponse | null>(null);
  const [qrRes, setQrRes] = useState<CheckQrResponse | null>(null);

  const switchTab = (t: Tab) => {
    setActive(t); setInput("");
    setLinkRes(null); setUpiRes(null); setQrRes(null);
  };

  const scan = async () => {
    setLoading(true);
    try {
      if (active === "LINK") { const r = await checkLink(input); setLinkRes(r); }
      if (active === "UPI")  { const r = await checkUpi(input);  setUpiRes(r); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      if (!base64) return;
      setLoading(true);
      try { const r = await checkQr(base64); setQrRes(r); }
      catch (err) { console.error(err); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const result = linkRes ?? upiRes ?? qrRes;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 animate-fade-in">
      {/* Header */}
      <div className="mb-2 text-[#e63946] text-xs font-semibold uppercase tracking-widest">Prevention · Module A</div>
      <h1 className="text-3xl font-black mb-2">Proactive Risk Check</h1>
      <p className="text-[#9ca3af] mb-10">Verify links, UPI IDs, and QR codes before transacting.</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#161616] border border-[#2a2a2a] rounded-xl mb-8 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              active === id
                ? "bg-[#e63946] text-white shadow-lg shadow-red-900/30"
                : "text-[#9ca3af] hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="card p-8">
        {active !== "QR" ? (
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              {active === "LINK" ? "URL to scan" : "Virtual Payment Address (VPA)"}
            </label>
            <div className="flex gap-3">
              <input
                className="input-dark flex-1"
                placeholder={active === "LINK" ? "https://suspicious-site.com/pay" : "merchant@sbi"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && scan()}
              />
              <button
                onClick={scan}
                disabled={loading || !input}
                className="btn-red px-6 shrink-0"
              >
                {loading ? "Scanning…" : active === "LINK" ? "Detonate & Scan" : "Check Trust Score"}
              </button>
            </div>
          </div>
        ) : (
          <label
            className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-12 flex flex-col items-center text-center hover:border-[#e63946] transition-colors cursor-pointer"
          >
            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleQrUpload} disabled={loading} />
            <UploadCloud className="w-10 h-10 text-[#4b5563] mb-3" />
            <p className="text-[#9ca3af] mb-1">Drag & drop or click to upload QR code</p>
            <p className="text-[#4b5563] text-sm mb-4">PNG, JPG, JPEG supported</p>
            <div className={`btn-ghost text-sm px-5 ${loading ? "opacity-50" : ""}`}>
              {loading ? "Decoding…" : "Upload & Decode"}
            </div>
          </label>
        )}

        {result && (
          <RiskBanner label={result.riskLabel} recommendation={result.recommendation} flags={(result as any).flags} />
        )}
      </div>
    </div>
  );
}
