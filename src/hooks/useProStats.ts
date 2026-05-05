import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type ProStats = {
  active: number;
  completed: number;
  totalEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  yearEarnings: number;
  // Barras para gráfica: { label, amount }[]
  weekBars:  { label: string; amount: number }[];
  monthBars: { label: string; amount: number }[];
  yearBars:  { label: string; amount: number }[];
  // Últimos trabajos completados (para transacciones)
  recentJobs: {
    id: string;
    type: string;
    agreed_price: number;
    completed_at: string;
    client_name: string;
  }[];
};

const EMPTY: ProStats = {
  active: 0, completed: 0,
  totalEarnings: 0, weekEarnings: 0, monthEarnings: 0, yearEarnings: 0,
  weekBars: [], monthBars: [], yearBars: [],
  recentJobs: [],
};

export function useProStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ProStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, type, agreed_price, budget, status, completed_at, scheduled_at, client:profiles!jobs_client_id_fkey(full_name)')
      .eq('pro_id', profile.id)
      .in('status', ['in_progress', 'completed'])
      .order('completed_at', { ascending: false });

    if (!jobs) { setLoading(false); return; }

    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const completed = jobs.filter(j => j.status === 'completed');
    const active    = jobs.filter(j => j.status === 'in_progress');

    const price = (j: any) => Number(j.agreed_price ?? j.budget ?? 0);

    const weekJobs  = completed.filter(j => j.completed_at && new Date(j.completed_at) >= startOfWeek);
    const monthJobs = completed.filter(j => j.completed_at && new Date(j.completed_at) >= startOfMonth);
    const yearJobs  = completed.filter(j => j.completed_at && new Date(j.completed_at) >= startOfYear);

    // Barras semana: últimos 7 días
    const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekBars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(d.getDate() + i);
      const dayJobs = completed.filter(j => {
        if (!j.completed_at) return false;
        const jd = new Date(j.completed_at);
        return jd.toDateString() === d.toDateString();
      });
      return { label: DAY_LABELS[d.getDay()], amount: dayJobs.reduce((s, j) => s + price(j), 0) };
    });

    // Barras mes: semanas del mes actual
    const monthBars = [1, 2, 3, 4].map(w => {
      const weekStart = new Date(startOfMonth); weekStart.setDate((w - 1) * 7 + 1);
      const weekEnd   = new Date(startOfMonth); weekEnd.setDate(w * 7);
      const wJobs = completed.filter(j => {
        if (!j.completed_at) return false;
        const d = new Date(j.completed_at);
        return d >= weekStart && d <= weekEnd;
      });
      return { label: `S${w}`, amount: wJobs.reduce((s, j) => s + price(j), 0) };
    });

    // Barras año: por mes
    const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const yearBars = Array.from({ length: now.getMonth() + 1 }, (_, m) => {
      const mJobs = completed.filter(j => {
        if (!j.completed_at) return false;
        const d = new Date(j.completed_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === m;
      });
      return { label: MONTH_LABELS[m], amount: mJobs.reduce((s, j) => s + price(j), 0) };
    });

    setStats({
      active:        active.length,
      completed:     completed.length,
      totalEarnings: completed.reduce((s, j) => s + price(j), 0),
      weekEarnings:  weekJobs.reduce((s, j) => s + price(j), 0),
      monthEarnings: monthJobs.reduce((s, j) => s + price(j), 0),
      yearEarnings:  yearJobs.reduce((s, j) => s + price(j), 0),
      weekBars, monthBars, yearBars,
      recentJobs: completed.slice(0, 10).map(j => ({
        id:           j.id,
        type:         j.type,
        agreed_price: price(j),
        completed_at: j.completed_at ?? j.scheduled_at ?? '',
        client_name:  (j.client as any)?.full_name ?? 'Cliente',
      })),
    });
    setLoading(false);
  };

  return { stats, loading, reload: load };
}
