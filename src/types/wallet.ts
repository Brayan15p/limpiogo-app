export type WalletTxType =
  | 'topup'
  | 'payment'
  | 'refund'
  | 'referral_bonus'
  | 'urgent_premium'
  | 'pro_payout'
  | 'withdrawal'
  | 'adjustment';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTxType;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  external_tx_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const TX_LABELS: Record<WalletTxType, string> = {
  topup:          'Recarga',
  payment:        'Pago de servicio',
  refund:         'Reembolso',
  referral_bonus: 'Bono por referido',
  urgent_premium: 'Servicio urgente',
  pro_payout:     'Pago recibido',
  withdrawal:     'Retiro',
  adjustment:     'Ajuste',
};

export const TX_ICONS: Record<WalletTxType, string> = {
  topup:          'add-circle',
  payment:        'card',
  refund:         'return-down-back',
  referral_bonus: 'gift',
  urgent_premium: 'flash',
  pro_payout:     'cash',
  withdrawal:     'arrow-up-circle',
  adjustment:     'settings',
};
