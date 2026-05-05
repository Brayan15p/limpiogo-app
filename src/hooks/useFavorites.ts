import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type FavPro = {
  pro_id: string;
  full_name: string;
  rating: number | null;
  total_reviews: number;
  bio: string | null;
  is_verified: boolean;
};

export function useFavorites() {
  const { profile } = useAuth();
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favPros, setFavPros] = useState<FavPro[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('favorites')
      .select('pro_id, pro:profiles!favorites_pro_id_fkey(full_name, rating, total_reviews, bio, is_verified)')
      .eq('user_id', profile.id);

    const ids = new Set((data ?? []).map((f: any) => f.pro_id as string));
    const pros = (data ?? []).map((f: any) => ({
      pro_id:        f.pro_id,
      full_name:     f.pro?.full_name ?? '',
      rating:        f.pro?.rating ?? null,
      total_reviews: f.pro?.total_reviews ?? 0,
      bio:           f.pro?.bio ?? null,
      is_verified:   f.pro?.is_verified ?? false,
    }));

    setFavIds(ids);
    setFavPros(pros);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (proId: string, proData?: Partial<FavPro>) => {
    if (!profile?.id) return;
    const isFav = favIds.has(proId);

    // Optimistic update
    if (isFav) {
      setFavIds(prev => { const s = new Set(prev); s.delete(proId); return s; });
      setFavPros(prev => prev.filter(p => p.pro_id !== proId));
    } else {
      setFavIds(prev => new Set([...prev, proId]));
      if (proData) {
        setFavPros(prev => [...prev, { pro_id: proId, full_name: '', rating: null,
          total_reviews: 0, bio: null, is_verified: false, ...proData }]);
      }
    }

    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('user_id', profile.id).eq('pro_id', proId);
    } else {
      await supabase.from('favorites').insert({ user_id: profile.id, pro_id: proId });
    }
  }, [profile?.id, favIds]);

  return { favIds, favPros, loading, toggle, reload: load };
}

// Animación de corazón reutilizable
export function useHeartAnim() {
  const scale = useRef(new Animated.Value(1)).current;
  const fire = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 60 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
  };
  return { scale, fire };
}
