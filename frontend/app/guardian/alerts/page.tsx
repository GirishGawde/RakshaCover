"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Activity, MapPin, PhoneCall, Check, X, ShieldAlert, UserPlus, Bell, Filter, Search, Eye, Radio, Lock, RefreshCw, Zap, ExternalLink, Volume2, Shield, Info, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { GuardianAlert, fetchGuardianAlerts, acceptGuardianLink } from "../../../lib/api/guardian";
import { supabase } from "../../../lib/supabase";

interface LinkRow {
  id: string;
  parent_user_id: string;
  guardian_email: string;
  status: string;
  device_name?: string;
  battery_level?: number;
  last_active?: string;
}

export default function GuardianAlertsPage() {
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLinks, setPendingLinks] = useState<LinkRow[]>([]);
  const [activeLinks, setActiveLinks] = useState<LinkRow[]>([]);
  const [guardianEmail, setGuardianEmail] = useState<string>("demo@example.com");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  
  // New premium dashboard states
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<GuardianAlert | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let userEmail = "demo@example.com";
    try {
      const stored = sessionStorage.getItem("raksha_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) userEmail = parsed.email;
      }
    } catch (e) {}
    setGuardianEmail(userEmail);

    const fetchLinks = async () => {
      const { data: pending } = await supabase
        .from("guardian_links")
        .select("*")
        .eq("guardian_email", userEmail)
        .eq("status", "pending");

      const { data: active } = await supabase
        .from("guardian_links")
        .select("*")
        .eq("guardian_email", userEmail)
        .eq("status", "active");

      setPendingLinks((pending as LinkRow[]) || []);
      setActiveLinks((active as LinkRow[]) || []);

      if (active && active.length > 0) {
        const allAlerts: GuardianAlert[] = [];
        for (const link of active) {
          const linkAlerts = await fetchGuardianAlerts(link.id);
          allAlerts.push(...linkAlerts);
          setupSubscription(link.id);
        }
        allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAlerts(allAlerts);
      }

      setLoading(false);
      setHasChecked(true);
    };
    fetchLinks();
  }, []);

  const setupSubscription = (linkId: string) => {
    supabase
      .channel(`guardian_${linkId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guardian_alerts", filter: `link_id=eq.${linkId}` },
        (payload) => {
          const newAlert = payload.new as GuardianAlert;
          setAlerts((prev) => [newAlert, ...prev]);
          showToast(`🚨 New High-Risk Alert from Monitored Account!`);
        }
      )
      .subscribe();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAccept = async (link: LinkRow) => {
    setAccepting(link.id);
    try {
      await acceptGuardianLink(link.id);
      localStorage.setItem("raksha_guardian_link_id", link.id);
      setPendingLinks(prev => prev.filter(l => l.id !== link.id));
      setActiveLinks(prev => [...prev, { ...link, status: "active" }]);
      setupSubscription(link.id);
      showToast("Successfully linked as Guardian!");
    } catch (e) {
      alert("Failed to accept");
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = (linkId: string) => {
    setPendingLinks(prev => prev.filter(l => l.id !== linkId));
    showToast("Guardian request declined.");
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.risk_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.source_module?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === "all") return true;
    if (filterTab === "digital_arrest") return alert.risk_type === "digital_arrest";
    if (filterTab === "prevention") return alert.source_module === "prevention";
    if (filterTab === "unread") return alert.status === "unread";
    return true;
  });

  const criticalCount = alerts.filter(a => a.risk_score >= 90).length;
  const unreadCount = alerts.filter(a => a.status === 'unread').length;

  if (!hasChecked) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-[#e63946]/30 border-t-[#e63946] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#e63946] selection:text-white pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#18181b] border border-[#e63946]/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e63946] animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#18181b] via-[#121215] to-[#09090b] border-b border-[#27272a] pt-10 pb-8 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#e63946]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-[#e63946]/10 border border-[#e63946]/30 text-[#e63946] text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Guardian Grid
              </span>
              <span className="text-xs text-[#a1a1aa]">• Secure Telemetry</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              Guardian Command Center
            </h1>
            <p className="text-[#a1a1aa] mt-1 text-sm lg:text-base">
              Logged in as <span className="text-white font-semibold">{guardianEmail}</span> • Monitoring senior family members in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl text-sm flex items-center gap-3 shadow-inner">
              <div className={`w-3 h-3 rounded-full ${activeLinks.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              <div>
                <p className="text-[10px] uppercase text-[#a1a1aa] font-bold">Active Shields</p>
                <p className="text-white font-bold text-xs">{activeLinks.length} Account{activeLinks.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl text-sm flex items-center gap-3 shadow-inner">
              <div className="w-3 h-3 rounded-full bg-[#e63946]" />
              <div>
                <p className="text-[10px] uppercase text-[#a1a1aa] font-bold">Critical Alerts</p>
                <p className="text-white font-bold text-xs">{criticalCount} Flagged</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
        {/* Pending Requests Section */}
        {pendingLinks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Pending Guardian Requests
                <span className="ml-2 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-black rounded-full">{pendingLinks.length}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLinks.map(link => (
                <div key={link.id} className="bg-[#121215] border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/60 transition-all">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{link.parent_user_id}</p>
                      <p className="text-[#a1a1aa] text-xs mt-1 leading-relaxed">Requested you as their Guardian. You will have real-time visibility into high-risk cyber threats and Digital Arrest simulations.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-[#27272a]">
                    <button onClick={() => handleDecline(link.id)} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-[#1f1f23] hover:bg-[#27272a] transition-colors flex items-center justify-center gap-2 text-sm">
                      <X className="w-4 h-4 text-zinc-400" /> Decline
                    </button>
                    <button onClick={() => handleAccept(link)} disabled={accepting === link.id} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-lg shadow-purple-500/20">
                      {accepting === link.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Check className="w-4 h-4" /> Accept Link</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currently Monitored Accounts */}
        {activeLinks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#a1a1aa] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Monitored Profiles ({activeLinks.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLinks.map(link => (
                <div key={link.id} className="bg-[#121215] border border-[#27272a] hover:border-emerald-500/40 rounded-2xl p-5 flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {link.parent_user_id.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{link.parent_user_id}</p>
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Shield Active
                      </p>
                    </div>
                  </div>
                  <button onClick={() => showToast(`Pinged ${link.parent_user_id} device status.`)} className="p-2.5 bg-[#1f1f23] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl transition-colors text-xs font-medium flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Feed Section */}
        {activeLinks.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#e63946]" /> Real-Time Threat & Incident Feed
                </h2>
                <p className="text-[#a1a1aa] text-xs mt-0.5">Live telemetry from Module A (Prevention) & Module C (Panic Shield)</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121215] border border-[#27272a] focus:border-[#e63946] text-white text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none w-48 lg:w-60 transition-colors"
                  />
                </div>

                <div className="flex bg-[#121215] border border-[#27272a] rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setFilterTab("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterTab === "all" ? "bg-[#e63946] text-white" : "text-[#a1a1aa] hover:text-white"}`}
                  >
                    All ({alerts.length})
                  </button>
                  <button
                    onClick={() => setFilterTab("digital_arrest")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterTab === "digital_arrest" ? "bg-[#e63946] text-white" : "text-[#a1a1aa] hover:text-white"}`}
                  >
                    Digital Arrests
                  </button>
                  <button
                    onClick={() => setFilterTab("unread")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterTab === "unread" ? "bg-[#e63946] text-white" : "text-[#a1a1aa] hover:text-white"}`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#e63946]/30 border-t-[#e63946] rounded-full animate-spin" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="bg-[#121215] border border-[#27272a] rounded-3xl p-16 text-center">
                <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-bold text-white mb-2">No Threats Detected</h3>
                <p className="text-[#a1a1aa] text-sm max-w-md mx-auto">All monitored accounts are currently secure. You will instantly receive an alert if any suspicious activity or digital arrest scam is attempted.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const isDigitalArrest = alert.risk_type === "digital_arrest";
                  const isCritical = alert.risk_score >= 90;

                  return (
                    <div
                      key={alert.id}
                      className={`p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                        alert.status === 'unread'
                          ? 'bg-gradient-to-r from-[#e63946]/10 via-[#121215] to-[#121215] border-[#e63946]/50 shadow-[0_0_35px_rgba(230,57,70,0.12)]'
                          : 'bg-[#121215] border-[#27272a] hover:border-[#3f3f46]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isCritical
                            ? 'bg-[#e63946]/20 border-[#e63946]/40 text-[#e63946]'
                            : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                        }`}>
                          <AlertTriangle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-bold text-white text-base lg:text-lg">
                              {isDigitalArrest ? "🚨 Digital Arrest / Impersonation Alert" : "Malicious Scan Blocked"}
                            </span>
                            {alert.status === 'unread' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#e63946] text-white">
                                New Incident
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                              Risk Score: {alert.risk_score}/100
                            </span>
                          </div>

                          <p className="text-[#a1a1aa] text-sm leading-relaxed max-w-2xl">
                            {isDigitalArrest
                              ? "Parent triggered the panic shield indicating an ongoing fraudulent video call or threat of digital arrest. Immediate intervention recommended."
                              : `Parent attempted to interact with a high-risk entity (Score: ${alert.risk_score}). Automatically blocked by Raksha Prevention Engine.`}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-xs text-[#71717a] flex-wrap">
                            <span className="flex items-center gap-1.5 font-medium text-[#a1a1aa]">
                              <Shield className="w-3.5 h-3.5 text-[#e63946]" /> Source: Module {alert.source_module === 'prevention' ? 'A (Prevention)' : 'C (Panic Shield)'}
                            </span>
                            <span>•</span>
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-4 py-2.5 bg-[#1f1f23] hover:bg-[#27272a] text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-xs"
                        >
                          <Eye className="w-4 h-4 text-[#a1a1aa]" /> Details
                        </button>
                        <button
                          onClick={() => showToast("Initiating secure encrypted call to parent...")}
                          className="px-5 py-2.5 bg-[#e63946] hover:bg-[#d02e3b] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#e63946]/25 flex items-center gap-2 text-xs"
                        >
                          <PhoneCall className="w-4 h-4" /> Call Parent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State when no links */}
        {pendingLinks.length === 0 && activeLinks.length === 0 && (
          <div className="py-24 text-center bg-[#121215] border border-[#27272a] rounded-3xl mt-8">
            <div className="w-16 h-16 bg-[#1f1f23] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#71717a] border border-[#27272a]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Guardian Links</h2>
            <p className="text-[#a1a1aa] text-sm max-w-md mx-auto">You are not currently monitoring any accounts, and you have no pending verification requests. Share your guardian email with family members to get started.</p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-3xl max-w-xl w-full p-6 lg:p-8 relative shadow-2xl animate-scale-in">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-6 right-6 w-9 h-9 bg-[#1f1f23] hover:bg-[#27272a] rounded-full flex items-center justify-center text-[#a1a1aa] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#e63946]/20 border border-[#e63946]/40 text-[#e63946] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#e63946] text-white">
                  Incident Report
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedAlert.risk_type === "digital_arrest" ? "Digital Arrest / Panic Shield Trigger" : "High-Risk Threat Blocked"}
                </h3>
              </div>
            </div>

            <div className="space-y-4 mb-8 bg-[#18181b] p-5 rounded-2xl border border-[#27272a]">
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Incident ID</span>
                <span className="font-mono text-white text-xs">{selectedAlert.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Risk Score</span>
                <span className="font-bold text-[#e63946]">{selectedAlert.risk_score} / 100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Source Module</span>
                <span className="font-semibold text-white">Module {selectedAlert.source_module === 'prevention' ? 'A (Prevention Engine)' : 'C (Panic Shield)'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Timestamp</span>
                <span className="text-white">{new Date(selectedAlert.created_at).toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-[#27272a]">
                <p className="text-xs text-[#a1a1aa] font-semibold uppercase mb-1">Recommended Guardian Action:</p>
                <p className="text-sm text-white leading-relaxed">
                  {selectedAlert.risk_type === "digital_arrest"
                    ? "1. Call your family member immediately.\n2. Reassure them that law enforcement NEVER conducts arrests over video calls or demands money via UPI/crypto.\n3. Report to Cyber Crime Helpline (1930)."
                    : "The malicious interaction was successfully blocked. Review browsing habits and ensure SafeGuard extension is active."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 py-3 bg-[#1f1f23] hover:bg-[#27272a] font-bold text-white rounded-xl transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  showToast("Connecting secure call...");
                }}
                className="flex-1 py-3 bg-[#e63946] hover:bg-[#d02e3b] font-bold text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#e63946]/30"
              >
                <PhoneCall className="w-4 h-4" /> Call Family Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
