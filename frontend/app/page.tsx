"use client";

import Link from "next/link";
import { ShieldCheck, FileWarning, Network, Zap, Eye, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="grid-bg min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 animate-fade-in">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="pulse-red"></span>
            <span className="text-[#e63946] text-sm font-semibold tracking-widest uppercase">
              Active Threat Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-balance">
            Stop Fraud<br />
            <span className="text-[#e63946]">Before It Strikes.</span>
          </h1>

          <div className="red-line pl-4 mb-8">
            <p className="text-[#9ca3af] text-lg leading-relaxed">
              RakshaCover is India's AI-powered fraud intelligence platform — scan threats in real time,
              report incidents instantly, and visualise criminal networks like never before.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/check" className="btn-red text-sm px-6 py-3 rounded-lg inline-block">
              Scan a Link / UPI ID
            </Link>
            <Link href="/report" className="btn-ghost text-sm px-6 py-3 rounded-lg inline-block">
              Report an Incident
            </Link>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <p className="text-[#6b7280] text-sm uppercase tracking-widest font-semibold mb-6">Platform Modules</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link href="/check" className="card card-hover p-6 block group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold mb-2">Prevention Check</h2>
            <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
              Scan URLs, QR codes, and UPI IDs through our ML detection engine before making any payment.
            </p>
            <span className="text-[#e63946] text-xs font-semibold tracking-wider uppercase">Module A →</span>
          </Link>

          <Link href="/report" className="card card-hover p-6 block group">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-red-500/20 transition-colors">
              <FileWarning className="w-6 h-6 text-[#e63946]" />
            </div>
            <h2 className="text-lg font-bold mb-2">Aftermath Response</h2>
            <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
              Already scammed? Dynamic urgency scoring, exit-risk detection, and auto-drafted 1930 helpline scripts.
            </p>
            <span className="text-[#e63946] text-xs font-semibold tracking-wider uppercase">Module C →</span>
          </Link>

          <Link href="/graph" className="card card-hover p-6 block group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
              <Network className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold mb-2">3D Cluster Graph</h2>
            <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
              Visualise interconnected fraud networks in real-time 3D — mule accounts, victim chains, and script patterns.
            </p>
            <span className="text-[#e63946] text-xs font-semibold tracking-wider uppercase">Module B →</span>
          </Link>

          <Link href="/family" className="card card-hover p-6 block group border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h2 className="text-lg font-bold mb-2 text-white">Family Guardian</h2>
            <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
              Link vulnerable family members to your account to instantly receive alerts when they encounter high-risk threats.
            </p>
            <span className="text-purple-400 text-xs font-semibold tracking-wider uppercase">New Feature →</span>
          </Link>
        </div>

        {/* Feature strip */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "Instant Detection", desc: "Sub-second ML risk scoring on every scan" },
            { icon: <Eye className="w-5 h-5 text-blue-400" />, title: "Live Network Updates", desc: "Supabase Realtime pushes cluster changes instantly" },
            { icon: <Lock className="w-5 h-5 text-[#e63946]" />, title: "RLS Secured", desc: "Row-Level Security on all data — zero unauthorized access" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-[#161616] border border-[#2a2a2a]">
              <div className="shrink-0 w-10 h-10 bg-[#1e1e1e] rounded-lg flex items-center justify-center">{icon}</div>
              <div>
                <div className="font-semibold text-sm mb-1">{title}</div>
                <div className="text-[#6b7280] text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
