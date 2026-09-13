import { supabase } from '../supabase';

const API_BASE = process.env.NEXT_PUBLIC_MODULE_GUARDIAN_URL || "http://localhost:8000";

export interface GuardianAlert {
  id: string;
  link_id: string;
  source_module: string;
  risk_type: string;
  risk_score: number;
  status: string;
  created_at: string;
}

export async function fetchGuardianAlerts(linkId: string): Promise<GuardianAlert[]> {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching guardian alerts:", error);
    return [];
  }
  return data as GuardianAlert[];
}

export async function acceptGuardianLink(linkId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/guardian/link/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkId })
  });
  
  if (!res.ok) {
    throw new Error("Failed to accept link");
  }
  
  const data = await res.json();
  return data.success;
}

export async function linkGuardian(parentUserId: string, guardianContact: string): Promise<{ linkId: string, status: string }> {
  const res = await fetch(`${API_BASE}/guardian/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentUserId, guardianContact })
  });
  
  if (!res.ok) {
    throw new Error("Failed to create link");
  }
  
  return res.json();
}
