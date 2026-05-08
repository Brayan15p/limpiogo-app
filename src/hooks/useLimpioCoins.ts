import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

const REASON_LABEL: Record<string, string> = {
  booking_completed: 'Servicio completado',
  referral:          'Referido exitoso',
  review_left:       'Reseña dejada',
  birthday:          'Regalo de cumpleaños',
  redemption:        'Canje de descuento',
};

export { REASON_LABEL };

export function useLimpioCoins() {
  const { user, profile } = useAuth();
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) return;
    setBalance(profile?.limpio_coins ?? 0);

    supabase
      .from('coins_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setTransactions((data ?? []) as CoinTransaction[]);
        setLoading(false);
      });

    const sub = supabase
      .channel(`coins_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'coins_transactions',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setTransactions(prev => [payload.new as CoinTransaction, ...prev]);
        setBalance(prev => prev + (payload.new as CoinTransaction).amount);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user, profile?.limpio_coins]);

  return { balance, transactions, loading };
}
