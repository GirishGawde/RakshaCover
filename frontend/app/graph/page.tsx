"use client";

import { useState, useEffect } from "react";
import { ForceGraph3D } from "@/components/ForceGraph3D";
import { getClusterGraph } from "@/lib/api/cluster";
import { useClusterRealtime } from "@/lib/hooks/useClusterRealtime";
import type { ClusterGraphResponse, GraphNode } from "@/lib/types";
import { Network, AlertCircle, Wifi, WifiOff } from "lucide-react";

export default function GraphPage() {
  const [graphData, setGraphData] = useState<ClusterGraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { clusters, latestEvent, isConnected } = useClusterRealtime();

  useEffect(() => {
    getClusterGraph().then(setGraphData).catch(console.error);
  }, []);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-[#4b5563]">
        <div className="flex flex-col items-center gap-4">
          <div className="pulse-red"></div>
          <div>Loading cluster intelligence…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#0a0a0a]">
      {/* Realtime status bar */}
      <div className={`flex items-center gap-2 px-6 py-2.5 text-xs font-semibold tracking-wide border-b border-[#2a2a2a] ${isConnected ? "bg-[#e63946]/10 text-[#e63946]" : "bg-[#161616] text-[#6b7280]"}`}>
        {isConnected
          ? <><Wifi className="w-4 h-4" /> REALTIME SYNC ACTIVE — Monitoring Supabase stream</>
          : <><WifiOff className="w-4 h-4" /> OFFLINE MODE — Configure Supabase keys for live updates</>
        }
        {latestEvent && (
          <span className="ml-auto flex items-center gap-2 bg-[#e63946]/20 text-[#e63946] px-3 py-1 rounded border border-[#e63946]/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#e63946]"></span>
            {latestEvent.type}: Cluster &quot;{latestEvent.row.label}&quot; modified
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Graph Canvas */}
        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#161616] via-[#0a0a0a] to-[#050505]">
          
          {/* Cluster info overlay */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 bg-[#161616]/80 backdrop-blur-md p-3 md:p-4 rounded-xl border border-[#2a2a2a] shadow-2xl max-w-[220px] md:max-w-sm pointer-events-none">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#e63946]/10 flex items-center justify-center border border-[#e63946]/20 shrink-0">
                <Network className="w-4 h-4 md:w-5 md:h-5 text-[#e63946]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#e63946] font-bold mb-0.5">Global Network</div>
                <h2 className="font-bold text-white text-sm md:text-base leading-tight truncate">Intelligence Graph</h2>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 md:mt-4 md:pt-4 border-t border-[#2a2a2a]/50 text-[10px] md:text-xs text-[#9ca3af]">
              <span>Nodes: {graphData.nodes?.length || 0}</span>
              <span className="font-mono text-white">{graphData.edges?.length || 0} Edges</span>
            </div>
          </div>

          {/* Legend */}
          <div className="hidden md:block absolute bottom-6 left-6 z-10 bg-[#161616]/80 backdrop-blur-md p-4 rounded-xl border border-[#2a2a2a] text-xs space-y-3 pointer-events-none shadow-2xl">
            <div className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold mb-1">Entity Types</div>
            <div className="flex items-center gap-3 text-[#d1d5db]">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /> 
              Victim Report
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <span className="w-3 h-3 rounded-full bg-[#e63946] shadow-[0_0_10px_rgba(230,57,70,0.8)]" /> 
              Mule Account (VPA)
            </div>
            <div className="flex items-center gap-3 text-[#d1d5db]">
              <span className="w-3 h-3 rounded bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> 
              Script / Pattern
            </div>
            <div className="mt-2 pt-2 border-t border-[#2a2a2a] text-[#6b7280] italic">
              * Red particles indicate money flow
            </div>
          </div>

          <div className="absolute inset-0 cursor-move">
            <ForceGraph3D 
              graphData={graphData} 
              onNodeClick={(node) => setSelectedNode(node as GraphNode)} 
            />
          </div>
          
          <div className="absolute bottom-6 right-6 text-xs text-[#4b5563] pointer-events-none bg-[#0a0a0a]/50 px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
            Left-click: Rotate · Right-click: Pan · Scroll: Zoom
          </div>
        </div>

        {/* Right Drawer - Intelligence Panel */}
        <div className="w-full md:w-96 h-[45%] md:h-auto bg-[#111111] border-t md:border-t-0 md:border-l border-[#2a2a2a] overflow-y-auto flex flex-col z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] shrink-0">
          <div className="p-3 md:p-5 border-b border-[#2a2a2a] bg-[#161616]">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Intelligence Inspector
            </h3>
          </div>

          {/* Node Inspector */}
          <div className="p-5 flex-1">
            {selectedNode ? (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest font-bold mb-2">Entity ID</div>
                  <div className="font-mono text-xs bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded-lg text-[#9ca3af] break-all shadow-inner">
                    {selectedNode.id}
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest font-bold mb-2">Primary Label</div>
                  <p className="text-white text-lg font-medium bg-[#161616] p-4 rounded-lg border border-[#2a2a2a]">
                    {selectedNode.label}
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest font-bold mb-3">Classification</div>
                  <div>
                    {selectedNode.type === "victim" && (
                      <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 text-sm font-semibold tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Victim Report
                      </span>
                    )}
                    {selectedNode.type === "mule_vpa" && (
                      <span className="inline-flex items-center gap-2 bg-[#e63946]/10 text-[#e63946] px-3 py-1.5 rounded border border-[#e63946]/30 text-sm font-semibold tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e63946]"></span>
                        Mule / Receiving VPA
                      </span>
                    )}
                    {selectedNode.type === "script_pattern" && (
                      <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded border border-amber-500/20 text-sm font-semibold tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Behavioral Pattern
                      </span>
                    )}
                  </div>
                </div>
                
                {selectedNode.type === "mule_vpa" && (
                  <div className="mt-8 p-5 bg-[#e63946]/5 border border-[#e63946]/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#e63946]"></div>
                    <div className="flex gap-3 items-start text-[#e63946] font-semibold mb-2">
                      <AlertCircle className="w-5 h-5 shrink-0" /> 
                      High Confidence Hub
                    </div>
                    <p className="text-sm text-[#9ca3af] leading-relaxed">
                      This receiving ID acts as a central collection node. It exhibits high centrality and links multiple disparate victim reports. Recommended for immediate blocking.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="w-12 h-12 rounded-full border border-dashed border-[#2a2a2a] flex items-center justify-center mb-4">
                  <div className="w-6 h-6 border border-[#2a2a2a] rounded-sm transform rotate-45"></div>
                </div>
                <p className="text-[#6b7280] text-sm font-medium">
                  Select a node in the 3D space<br/>to inspect entity intelligence.
                </p>
              </div>
            )}
          </div>

          {/* Live cluster feed */}
          {clusters.length > 0 && (
            <div className="p-5 border-t border-[#2a2a2a] bg-[#0a0a0a]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">Live Cluster Feed</h4>
                <span className="bg-[#161616] text-[#9ca3af] text-[10px] px-2 py-0.5 rounded-full border border-[#2a2a2a]">{clusters.length} tracked</span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {clusters.slice(0, 5).map(c => (
                  <div key={c.id} className="text-xs bg-[#161616] rounded-lg p-3 border border-[#2a2a2a] hover:border-[#4b5563] transition-colors cursor-pointer group">
                    <div className="font-semibold text-[#d1d5db] truncate group-hover:text-white transition-colors">{c.label ?? c.network_hash}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#6b7280]">{c.report_count} reports</span>
                      <span className="text-[#e63946] font-mono bg-[#e63946]/10 px-1.5 py-0.5 rounded">Sc: {c.confidence_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
