"use client";

import { useEffect, useRef } from "react";
import type { ElementDefinition, StylesheetStyle } from "cytoscape";

interface CytoscapeCanvasProps {
  elements: ElementDefinition[];
  stylesheet: StylesheetStyle[];
  layout?: Record<string, unknown>;
  onNodeClick?: (nodeData: Record<string, unknown>) => void;
  onBackgroundClick?: () => void;
  cyRef?: React.MutableRefObject<any>;
  style?: React.CSSProperties;
}

/**
 * CytoscapeCanvas — raw cytoscape wrapper (no react-cytoscapejs).
 * Dynamically imports cytoscape inside useEffect to avoid SSR issues.
 */
export function CytoscapeCanvas({
  elements,
  stylesheet,
  layout = { name: "cose", padding: 50 },
  onNodeClick,
  onBackgroundClick,
  cyRef,
  style,
}: CytoscapeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import — only runs in the browser
    import("cytoscape").then(({ default: cytoscape }) => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: stylesheet,
        layout,
      });

      // Expose via cyRef prop
      if (cyRef) cyRef.current = cy;
      instanceRef.current = cy;

      if (onNodeClick) {
        cy.on("tap", "node", (evt) => {
          onNodeClick(evt.target.data());
        });
      }
      if (onBackgroundClick) {
        cy.on("tap", (evt) => {
          if (evt.target === cy) onBackgroundClick();
        });
      }
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements.length]); // re-render when elements count changes

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
