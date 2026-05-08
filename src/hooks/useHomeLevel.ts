import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type LevelName = 'basico' | 'cuidado' | 'premium' | 'elite' | 'legendario';

export interface HomeLevel {
  levelName: LevelName;
  bookingsCompleted: number;
  levelThreshold: number;
  nextThreshold: number;
  progress: number; // 0–1
}

const LEVEL_CONFIG: Record<LevelName, { emoji: string; label: string; color: string; discount: string }> = {
  basico:     { emoji: '🏠', label: 'Básico',      color: '#94A3B8', discount: '' },
  cuidado:    { emoji: '✨', label: 'Cuidado',     color: '#2563EB', discount: '5% desc.' },
  premium:    { emoji: '⭐', label: 'Premium',     color: '#D97706', discount: '10% desc.' },
  elite:      { emoji: '💎', label: 'Elite',       color: '#7C3AED', discount: '15% desc.' },
  legendario: { emoji: '👑', label: 'Legendario',  color: '#0C4A6E', discount: '20% desc.' },
};

export { LEVEL_CONFIG };

export function useHomeLevel() {
  const { user } = useAuth();
  const [level, setLevel] = useState<HomeLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('client_home_level')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const completed = data.bookings_completed ?? 0;
          const threshold = data.level_threshold ?? 0;
          const next = data.next_threshold ?? 3;
          setLevel({
            levelName:        data.level_name as LevelName,
            bookingsCompleted: completed,
            levelThreshold:   threshold,
            nextThreshold:    next,
            progress:         threshold === next ? 1 : (completed - threshold) / (next - threshold),
          });
        }
        setLoading(false);
      });
  }, [user]);

  return { level, loading };
}
