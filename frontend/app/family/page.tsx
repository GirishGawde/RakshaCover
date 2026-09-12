"use client";

import Link from "next/link";
import { ShieldPlus, Activity, ArrowRight } from "lucide-react";

export default function FamilyHubPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] grid-bg py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 text-balance">
            Family <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#e63946]">Monitoring Hub</span>
          </h1>
          <p className="text-[#9ca3af] text-lg max-w-xl mx-auto">
            Choose your role in the family safety net. Protect your own account by linking a guardian, or monitor accounts of vulnerable family members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Option 1: Link a Guardian */}
          <Link href="/guardian" className="group relative bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 overflow-hidden hover:border-[#e63946]/50 transition-colors animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e63946]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#e63946]/10 transition-colors" />
            
            <div className="w-16 h-16 bg-[#e63946]/10 rounded-2xl flex items-center justify-center mb-8">
              <ShieldPlus className="w-8 h-8 text-[#e63946]" strokeWidth={2} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">I need protection</h2>
            <p className="text-[#9ca3af] mb-8 leading-relaxed min-h-[80px]">
              Link your account to a trusted family member. They will be alerted automatically if you scan a dangerous link or encounter a Digital Arrest.
            </p>
            
            <div className="flex items-center text-[#e63946] font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
              Link a Guardian <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          {/* Option 2: Monitor Family */}
          <Link href="/guardian/alerts" className="group relative bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 overflow-hidden hover:border-purple-500/50 transition-colors animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
            
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8">
              <Activity className="w-8 h-8 text-purple-400" strokeWidth={2} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">I am the Guardian</h2>
            <p className="text-[#9ca3af] mb-8 leading-relaxed min-h-[80px]">
              Access your real-time dashboard to monitor all linked family members. Receive instant alerts when they encounter high-risk threats.
            </p>
            
            <div className="flex items-center text-purple-400 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
              View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
