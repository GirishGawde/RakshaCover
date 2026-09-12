"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Zap, ShieldCheck, Database, PhoneCall } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Fake 500ms network request
    setTimeout(() => {
      sessionStorage.setItem("raksha_user", JSON.stringify({ name: "Demo User", role: "victim" }));
      router.push("/");
    }, 500);
  };

  const handleEmergencyBypass = () => {
    // Set a mock session so AuthGuard lets us through
    sessionStorage.setItem("raksha_user", JSON.stringify({ name: "Emergency Victim", role: "victim" }));
    router.push("/report");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Emergency Bypass Link */}
        <button 
          onClick={handleEmergencyBypass}
          type="button"
          className="w-full text-left flex items-center gap-3 p-4 mb-6 rounded-xl border border-[#e63946]/40 bg-[#e63946]/10 hover:bg-[#e63946]/20 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-[#e63946]/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#e63946]" />
          </div>
          <div>
            <div className="font-bold text-[#e63946] text-sm flex items-center gap-2">
              Active Scam Emergency?
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-[#fca5a5] text-xs mt-0.5">Skip login to launch Golden Hour Dossier immediately</div>
          </div>
        </button>

        {/* Login Card */}
        <div className="card p-8 relative overflow-hidden">
          {/* Subtle glow effect behind card content */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#e63946] opacity-5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="w-12 h-12 bg-[#e63946] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(230,57,70,0.4)] mb-4">
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black mb-1">
              Raksha<span className="text-[#e63946]">Cover</span>
            </h1>
            <p className="text-[#9ca3af] text-sm font-medium">Govt-Aligned Prototype • Track 3 Jan Jeevan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                className="input-dark w-full text-sm" 
                placeholder="citizen@india.gov.in" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Password</label>
              <input 
                type="password"
                required
                className="input-dark w-full text-sm" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !email || !password}
              className="btn-red w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In Securely"
              )}
            </button>
          </form>

        </div>

        {/* Security Assurances */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#6b7280]">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-[#9ca3af]" />
            Deterministic On-Device Privacy
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#2a2a2a]" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9ca3af]" />
            No Data Sold
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#2a2a2a]" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <PhoneCall className="w-3.5 h-3.5 text-[#9ca3af]" />
            1930 / CFCFRMS Aligned
          </div>
        </div>

      </div>
    </div>
  );
}
