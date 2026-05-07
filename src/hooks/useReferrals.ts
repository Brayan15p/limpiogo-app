import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ReferralReward {
  id: string;
  referred_id: string;
  referrer_id: string;
  reward_amount: number;
  credited_at: string | null;
  created_at: string;
  referred?: { full_name: string };
}

export function useReferrals() {
  const { profile } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!profile) return;

    const [{ data: profileData }, { data: rewardsData }] = await Promise.all([
      supabase.from('profiles').select('referral_code').eq('id', profile.id).single(),
      supabase
        .from('referral_rewards')
        .select('*, referred:profiles!referral_rewards_referred_id_fkey(full_name)')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);

    setReferralCode(profileData?.referral_code ?? null);
    setRewards(rewardsData ?? []);
    setTotalEarned(
      (rewardsData ?? [])
        .filter((r: ReferralReward) => r.credited_at)
        .reduce((sum: number, r: ReferralReward) => sum + r.reward_amount, 0),
    );
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  return { referralCode, rewards, totalEarned, loading, refetch: fetchReferrals };
}
