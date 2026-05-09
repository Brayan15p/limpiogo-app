import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const CACHE_KEY = 'offline_pro_jobs';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas

export interface OfflineJob {
  id: string;
  job_id: string;
  status: string;
  offered_price: number;
  jobs: {
    id: string;
    type: string;
    status: string;
    scheduled_at: string | null;
    photo_before: string | null;
    photo_after: string | null;
    addresses: { label: string; city: string } | null;
    client: { full_name: string } | null;
  };
}

interface CacheEntry {
  data: OfflineJob[];
  ts: number;
}

export function useOfflineJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs]         = useState<OfflineJob[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading]   = useState(true);
  const pendingRef              = useRef<{ jobId: string; field: string; value: string }[]>([]);

  // Monitor de conectividad
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);
      if (online) syncPending();
    });
    return () => unsub();
  }, []);

  // Sincronizar actualizaciones pendientes cuando vuelve la conexión
  const syncPending = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending.length) return;
    for (const op of pending) {
      await supabase.from('jobs').update({ [op.field]: op.value }).eq('id', op.jobId);
    }
    pendingRef.current = [];
    await AsyncStorage.removeItem('offline_pending_ops');
  }, []);

  const fetchAndCache = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('applications')
      .select(`
        id, job_id, status, offered_price,
        jobs(id, type, status, scheduled_at, photo_before, photo_after,
          addresses(label, city),
          client:profiles!jobs_client_id_fkey(full_name)
        )
      `)
      .eq('pro_id', profile.id)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false })
      .limit(30);

    const fresh = (data ?? []) as unknown as OfflineJob[];
    setJobs(fresh);
    const entry: CacheEntry = { data: fresh, ts: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    setLoading(false);
  }, [profile?.id]);

  const loadFromCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) return false;
      setJobs(entry.data);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const net = await NetInfo.fetch();
      const online = !!(net.isConnected && net.isInternetReachable);
      setIsOnline(online);
      if (online) {
        await fetchAndCache();
      } else {
        const hit = await loadFromCache();
        if (!hit) setJobs([]);
        setLoading(false);
      }
    };
    init();
  }, [fetchAndCache, loadFromCache]);

  // Guardar foto offline (encola la sincronización)
  const savePhotoOffline = useCallback(async (jobId: string, field: 'photo_before' | 'photo_after', uri: string) => {
    // Actualizar estado local y cache inmediatamente
    setJobs(prev => prev.map(a =>
      a.job_id === jobId
        ? { ...a, jobs: { ...a.jobs, [field]: uri } }
        : a,
    ));
    // Si hay internet, sincronizar ahora
    if (isOnline) {
      await supabase.from('jobs').update({ [field]: uri }).eq('id', jobId);
    } else {
      // Encolar para cuando vuelva la conexión
      pendingRef.current.push({ jobId, field, value: uri });
      await AsyncStorage.setItem('offline_pending_ops', JSON.stringify(pendingRef.current));
    }
  }, [isOnline]);

  const refresh = useCallback(async () => {
    const net = await NetInfo.fetch();
    if (net.isConnected && net.isInternetReachable) {
      await fetchAndCache();
    }
  }, [fetchAndCache]);

  return { jobs, isOnline, loading, refresh, savePhotoOffline };
}
