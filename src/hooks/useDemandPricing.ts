import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DemandData {
  activePros: number;
  activeJobs: number;
  surgeMultiplier: number; // 1.0 = normal, 1.15 = +15%, 1.30 = +30%
  isHighDemand: boolean;
  label: string;
}

const SURGE_THRESHOLDS = [
  { maxPros: 2, multiplier: 1.30, label: '🔥🔥 Demanda muy alta · +30%' },
  { maxPros: 5, multiplier: 1.15, label: '🔥 Alta demanda · +15%' },
];

export function useDemandPricing(city?: string) {
  const [demand, setDemand] = useState<DemandData>({
    activePros: 10,
    activeJobs: 0,
    surgeMultiplier: 1.0,
    isHighDemand: false,
    label: '',
  });

  useEffect(() => {
    const fetchDemand = async () => {
      // Pros activos (online) en la ciudad
      const prosQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'pro')
        .eq('is_online', true);
      if (city) (prosQuery as any).ilike('city', `%${city}%`);

      // Jobs abiertos buscando pro ahora
      const jobsQuery = supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      const [{ count: prosCount }, { count: jobsCount }] = await Promise.all([prosQuery, jobsQuery]);

      const activePros = prosCount ?? 10;
      const activeJobs = jobsCount ?? 0;

      // Determinar surge
      const tier = SURGE_THRESHOLDS.find(t => activePros <= t.maxPros);
      const surgeMultiplier = tier?.multiplier ?? 1.0;
      const isHighDemand = surgeMultiplier > 1.0;

      setDemand({
        activePros,
        activeJobs,
        surgeMultiplier,
        isHighDemand,
        label: tier?.label ?? '',
      });
    };

    fetchDemand();
    // Actualizar cada 10 minutos — no necesita ser más frecuente
    const interval = setInterval(fetchDemand, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const applyMultiplier = (basePrice: number) =>
    Math.round((basePrice * demand.surgeMultiplier) / 1000) * 1000; // redondear a miles

  return { demand, applyMultiplier };
}
