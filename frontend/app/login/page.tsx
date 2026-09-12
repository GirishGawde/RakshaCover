"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Zap, Database, PhoneCall, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    // Fake 500ms network request
    setTimeout(() => {
      sessionStorage.setItem("raksha_user", JSON.stringify({ 
        name: "Demo User", 
        email: email.toLowerCase().trim() || "demo@example.com",
        role: "citizen" 
      }));
      router.push("/");
    }, 500);
  };

  const handleEmergencyBypass = () => {
    sessionStorage.setItem("raksha_user", JSON.stringify({ name: "Emergency Victim", role: "victim" }));
    router.push("/report");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0a0a0a]">

      {/* Left Side: Marketing / Context (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-between p-12 overflow-hidden">

        {/* Top Text */}
        <div className="text-[#9ca3af] text-sm font-medium z-10">
          Advanced threat intelligence made simple – cyber protection for every citizen.
        </div>

        {/* Center Graphic & Typography */}
        <div className="flex flex-col items-center text-center z-10 w-full max-w-lg mt-10">

          {/* Concentric rings graphic */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            <div className="absolute inset-0 rounded-full border border-[#2a2a2a] animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-[#3a3a3a] animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute inset-8 rounded-full border border-[#4a4a4a]/50" />

            {/* Center glowing element */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#e63946] to-[#b91c1c] rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(230,57,70,0.5)] rotate-45 group">
              <Shield className="w-10 h-10 text-white -rotate-45" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-6">
            Stop Fraud<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e63946] to-[#fca5a5]">Before It Strikes</span>
          </h1>
        </div>

        {/* Bottom Security Badges */}
        <div className="flex items-center gap-6 text-[#6b7280] text-xs font-medium z-10">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" /> Deterministic Privacy
          </div>
          <div className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> No Data Sold
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#e63946]/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative bg-[#111111] lg:rounded-l-[40px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-20">

        <div className="w-full max-w-md mx-auto">

          {/* Logo & Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">RakshaCover</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">Sign In</h2>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="sr-only">Email or Username</label>
              <input
                type="email"
                required
                className="w-full bg-transparent border border-[#2a2a2a] text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] transition-all placeholder:text-[#6b7280]"
                placeholder="Email or Username"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="sr-only">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-transparent border border-[#2a2a2a] text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] transition-all placeholder:text-[#6b7280]"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#d1d5db] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium text-[#e63946] cursor-pointer hover:underline">
                Forgot password?
              </span>
              <span className="text-xs text-[#6b7280]">Any password works for demo</span>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-4 mt-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#e63946] to-[#b91c1c] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(230,57,70,0.3)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-10 relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-[#2a2a2a]" />
            <span className="relative bg-[#111111] px-4 text-xs uppercase tracking-widest text-[#6b7280] font-semibold">
              Emergency Action
            </span>
          </div>

          {/* Emergency Bypass */}
          <button
            onClick={handleEmergencyBypass}
            type="button"
            className="w-full flex items-center justify-between p-4 rounded-xl border border-[#e63946]/40 bg-[#e63946]/5 hover:bg-[#e63946]/10 transition-colors group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#e63946]/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#e63946]" />
              </div>
              <div>
                <div className="font-bold text-[#e63946] text-sm group-hover:text-[#fca5a5] transition-colors">
                  Active Scam Emergency?
                </div>
                <div className="text-[#9ca3af] text-xs mt-0.5">Skip login to launch Golden Hour Dossier</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#e63946] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Footer Footer */}
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-xs text-[#6b7280]">
            <div>© 2026 RakshaCover</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5" /> 1930 Helpline</span>
              <span className="hover:text-white cursor-pointer">English</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
