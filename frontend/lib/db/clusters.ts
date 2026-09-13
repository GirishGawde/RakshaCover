/**
 * lib/db/clusters.ts — Direct Supabase queries for clusters table
 *
 * Read-only from the frontend. Writes are done by Module B (service_role).
 * RLS: public SELECT policy is set.
 */

import { supabase } from "@/lib/supabase";
import type { ClusterGraphResponse } from "@/lib/types";

export interface ClusterRow {
  id: string;
  network_hash: string;
  label: string | null;
  report_count: number;
  confidence_score: number;
  graph_json: ClusterGraphResponse | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all clusters ordered by confidence (highest first).
 */
export async function getAllClusters(): Promise<ClusterRow[]> {
  const { data, error } = await supabase
    .from("clusters")
    .select("*")
    .order("confidence_score", { ascending: false });

  if (error) {
    console.error("[Supabase] clusters fetch failed:", error.message);
    return [];
  }
  return (data as ClusterRow[]) ?? [];
}

/**
 * Fetch a single cluster by ID.
 */
export async function getClusterById(id: string): Promise<ClusterRow | null> {
  const { data, error } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ClusterRow;
}
