"use client";

import { useEffect, useRef } from "react";
import type { ClusterGraphResponse } from "@/lib/types";

interface Props {
  graphData: ClusterGraphResponse;
  onNodeClick?: (node: { id: string; label: string; type: string }) => void;
}

const NODE_COLOR: Record<string, string> = {
  victim:         "#3b82f6",
  mule_vpa:       "#e63946",
  script_pattern: "#f59e0b",
};

/**
 * ForceGraph3D — WebGL 3D force-directed graph using three-forcegraph.
 * Dynamically imported to avoid SSR issues.
 */
export function ForceGraph3D({ graphData, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef  = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import("3d-force-graph").then(({ default: ForceGraph3DLib }) => {
      if (instanceRef.current) {
        instanceRef.current._destructor?.();
      }

      const nodes = graphData.nodes.map(n => ({
        id:    n.id,
        label: n.label,
        type:  n.type,
        val:   n.type === "mule_vpa" ? 12 : n.type === "script_pattern" ? 8 : 5,
      }));
      const links = graphData.edges.map(e => ({
        source: e.source,
        target: e.target,
        value:  e.weight ?? 1,
      }));

      const graph = (ForceGraph3DLib as any)()(containerRef.current!)
        .graphData({ nodes, links })
        .backgroundColor("rgba(0,0,0,0)")
        .nodeLabel((n: any) => n.label)
        .nodeColor((n: any) => NODE_COLOR[n.type] ?? "#6b7280")
        .nodeVal((n: any) => n.val)
        .nodeResolution(16)
        .nodeOpacity(0.95)
        .linkColor(() => "#374151")
        .linkWidth(1.5)
        .linkOpacity(0.5)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalParticleColor(() => "#e63946")
        .linkDirectionalParticleSpeed(0.006)
        .onNodeClick((node: any) => {
          if (onNodeClick) onNodeClick({ id: node.id, label: node.label, type: node.type });
          // Zoom to node
          graph.cameraPosition(
            { x: node.x * 1.3, y: node.y * 1.3, z: node.z * 1.3 + 120 },
            node,
            800
          );
        })
        .onNodeHover((node: any) => {
          if (containerRef.current)
            containerRef.current.style.cursor = node ? "pointer" : "default";
        })
        .width(containerRef.current!.clientWidth)
        .height(containerRef.current!.clientHeight);

      instanceRef.current = graph;
    });

    const handleResize = () => {
      if (containerRef.current && instanceRef.current) {
        instanceRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      instanceRef.current?._destructor?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData.clusterId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  );
}
