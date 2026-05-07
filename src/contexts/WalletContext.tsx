import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Wallet, WalletTransaction } from '../types/wallet';

interface WalletContextType {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  formatBalance: (amount?: number) => string;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  transactions: [],
  loading: true,
  refreshing: false,
  refresh: async () => {},
  formatBalance: () => '$0',
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchWallet = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [{ data: w }, { data: txs }] = await Promise.all([
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
          .then(async (res) => {
            if (!res.data?.length) return res;
            // filtrar solo las del wallet del usuario
            const walletRes = await supabase
              .from('wallets')
              .select('id')
              .eq('user_id', user.id)
              .single();
            if (!walletRes.data) return { data: [] };
            return supabase
              .from('wallet_transactions')
              .select('*')
              .eq('wallet_id', walletRes.data.id)
              .order('created_at', { ascending: false })
              .limit(50);
          }),
      ]);

      if (w) setWallet(w as Wallet);
      if (txs) setTransactions(txs as WalletTransaction[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Suscripción Realtime al wallet para actualizar saldo en tiempo real
  useEffect(() => {
    if (!user) return;
    fetchWallet();

    channelRef.current = supabase
      .channel(`wallet:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setWallet(payload.new as Wallet);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [user, fetchWallet]);

  const refresh = useCallback(() => fetchWallet(true), [fetchWallet]);

  const formatBalance = useCallback((amount?: number) => {
    const value = amount ?? wallet?.balance ?? 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: wallet?.currency ?? 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, [wallet]);

  return (
    <WalletContext.Provider value={{ wallet, transactions, loading, refreshing, refresh, formatBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
