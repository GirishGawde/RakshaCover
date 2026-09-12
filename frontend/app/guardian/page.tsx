"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Link as LinkIcon, CheckCircle2, UserPlus, ArrowRight } from "lucide-react";
import { linkGuardian } from "../../lib/api/guardian";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function GuardianLinkPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "accepted">("idle");
  const [loggedInEmail, setLoggedInEmail] = useState("demo_parent_user");
  
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("raksha_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) setLoggedInEmail(parsed.email);
      }
    } catch(e) {}
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get logged in parent's email
      let parentId = "demo_parent_user";
      try {
        const stored = sessionStorage.getItem("raksha_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) parentId = parsed.email;
        }
      } catch(e) {}
      
      const cleanEmail = email.toLowerCase().trim();
      const res = await linkGuardian(parentId, cleanEmail);
      
      // Save link ID to local storage so the mock alerts feed can use it
      localStorage.setItem("raksha_guardian_link_id", res.linkId);
      
      setStatus("sent");
      
      // Start listening for link acceptance (Fallback to reliable HTTP polling for demo)
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${process.env.NEXT_PUBLIC_MODULE_GUARDIAN_URL || 'http://localhost:8000'}/guardian/status?linkId=${res.linkId}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status === "active") {
              setStatus("accepted");
              clearInterval(interval);
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000);
      
      // Still try realtime just in case
      const channel = supabase
        .channel("link_updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "guardian_links", filter: `id=eq.${res.linkId}` },
          (payload) => {
            if (payload.new.status === "active") {
              setStatus("accepted");
              clearInterval(interval);
            }
          }
        )
        .subscribe();
        
      // Clean up on component unmount is not strictly necessary here because it's a demo, 
      // but interval should be cleared when status changes.
        
    } catch (error) {
      console.error(error);
      alert("Failed to link guardian account. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-4 text-center">
        <span className="px-3 py-1 bg-[#2a2a2a] text-[#9ca3af] text-xs rounded-full">
          Logged in as: <strong>{loggedInEmail}</strong>
        </span>
      </div>
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#e63946]/10 text-[#e63946] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">
          Family Guardian
        </h1>
        <p className="text-[#9ca3af] text-lg max-w-lg mx-auto leading-relaxed">
          Link your account to a trusted family member. If we detect high-risk fraud or a Digital Arrest attempt, we'll instantly alert them to help protect you.
        </p>
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e63946]/5 rounded-full blur-[80px] pointer-events-none" />

        {status === "accepted" ? (
          <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Protected</h2>
            <p className="text-[#9ca3af] mb-6">
              Your account is actively monitored. If you encounter a severe threat, an alert will be sent immediately.
            </p>
            <div className="px-5 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2 text-green-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              Guarded by {email}
            </div>
          </div>
        ) : status === "sent" ? (
          <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 border-2 border-dashed border-[#e63946]/50 text-[#e63946] rounded-full flex items-center justify-center mb-6">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
            <p className="text-[#9ca3af]">
              A link request has been sent to <span className="text-white font-bold">{email}</span>.
            </p>
            <p className="text-sm text-[#6b7280] mt-4 mb-8">
              Waiting for them to accept the request on their Guardian Dashboard...
            </p>
            
            <div className="flex flex-col items-center gap-6 mt-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              
              <button 
                onClick={() => setStatus("idle")}
                className="text-sm text-[#6b7280] hover:text-white underline transition-colors"
              >
                Cancel request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLink} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Guardian's Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., son@example.com"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] transition-all placeholder:text-[#4b5563]"
                />
                <UserPlus className="w-5 h-5 text-[#6b7280] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-[#6b7280] mt-3 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                They will receive a notification to accept this link.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#e63946] to-[#b91c1c] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(230,57,70,0.2)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Link Guardian <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
