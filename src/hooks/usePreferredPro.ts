import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface PreferredPro {
  proId: string;
  fullName: string;
  rating: number | null;
  isVerified: boolean;
  bookingsTogether: number;
}

export function usePreferredPro() {
  const { user } = useAuth();
  const [preferred, setPreferred] = useState<PreferredPro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('preferred_pros')
      .select('pro_id, bookings_together, pro:profiles!preferred_pros_pro_id_fkey(full_name, rating, is_verified)')
      .eq('client_id', user.id)
      .gte('bookings_together', 3)
      .order('bookings_together', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const pro = (data as any).pro;
          setPreferred({
            proId:            data.pro_id,
            fullName:         pro?.full_name ?? '',
            rating:           pro?.rating ?? null,
            isVerified:       pro?.is_verified ?? false,
            bookingsTogether: data.bookings_together,
          });
        }
        setLoading(false);
      });
  }, [user]);

  return { preferred, loading };
}
