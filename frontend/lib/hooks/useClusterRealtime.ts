import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useClusterRealtime() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [latestEvent, setLatestEvent] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase client not configured. Offline mode active.");
      return;
    }

    // Initial fetch of clusters
    const fetchClusters = async () => {
      const { data, error } = await supabase
        .from('clusters')
        .select('*')
        .order('report_count', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setClusters(data);
        setIsConnected(true);
      }
    };

    fetchClusters();

    // Subscribe to realtime changes on the clusters table
    const channel = supabase
      .channel('clusters_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clusters' },
        (payload) => {
          const eventType = payload.eventType;
          const rowData = payload.new || payload.old;
          
          setLatestEvent({
            type: eventType,
            row: rowData
          });
          
          setClusters((prev) => {
            if (eventType === 'INSERT') {
              return [payload.new, ...prev].sort((a, b) => b.report_count - a.report_count);
            } else if (eventType === 'UPDATE') {
              return prev.map(c => c.id === payload.new.id ? payload.new : c)
                         .sort((a, b) => b.report_count - a.report_count);
            } else if (eventType === 'DELETE') {
              return prev.filter(c => c.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { clusters, latestEvent, isConnected };
}
