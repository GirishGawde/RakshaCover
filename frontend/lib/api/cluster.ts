const API_BASE = "http://localhost:8000";

export async function getClusterGraph(edgeThreshold?: number) {
  const url = edgeThreshold !== undefined 
    ? `${API_BASE}/cluster/graph?edge_threshold=${edgeThreshold}` 
    : `${API_BASE}/cluster/graph`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cluster graph");
  return await res.json();
}

export async function matchCluster(payload: any) {
  const res = await fetch(`${API_BASE}/cluster/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) throw new Error("Failed to match cluster");
  return await res.json();
}
