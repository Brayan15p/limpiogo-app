-- =====================================================
-- LimpioGO — Migration: Wallet & Transactions (F8)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- ─── 1. WALLETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance     numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency    text NOT NULL DEFAULT 'COP',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ─── 2. TIPO ENUM DE TRANSACCIONES ───────────────────
DO $body$ BEGIN
  CREATE TYPE wallet_tx_type AS ENUM (
    'topup',
    'payment',
    'refund',
    'referral_bonus',
    'urgent_premium',
    'pro_payout',
    'withdrawal',
    'adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $body$;

-- ─── 3. WALLET_TRANSACTIONS (append-only, nunca UPDATE) ───
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type            wallet_tx_type NOT NULL,
  amount          numeric(12,2) NOT NULL,        -- positivo=crédito, negativo=débito
  balance_after   numeric(12,2) NOT NULL,
  description     text,
  reference_id    uuid,                           -- job_id, referral_id, etc.
  external_tx_id  text,                           -- ID en Wompi / MP (para idempotencia)
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice principal para listar transacciones del usuario
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id_date
  ON wallet_transactions(wallet_id, created_at DESC);

-- Índice para idempotencia de webhooks externos
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_external
  ON wallet_transactions(external_tx_id)
  WHERE external_tx_id IS NOT NULL;

-- ─── 4. FUNCIÓN ATÓMICA DE TRANSFERENCIA ─────────────
-- Usa FOR UPDATE para evitar race conditions
-- Solo puede ser llamada desde Edge Functions con service_role
CREATE OR REPLACE FUNCTION wallet_transfer(
  p_user_id    uuid,
  p_amount     numeric,
  p_type       wallet_tx_type,
  p_desc       text DEFAULT NULL,
  p_ref_id     uuid DEFAULT NULL,
  p_ext_tx_id  text DEFAULT NULL,
  p_metadata   jsonb DEFAULT '{}'
) RETURNS wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
  v_wallet_id  uuid;
  v_balance    numeric;
  v_tx         wallet_transactions;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'insufficient_balance: current=%, requested=%', v_balance, ABS(p_amount);
  END IF;

  UPDATE wallets
    SET balance = balance + p_amount, updated_at = now()
    WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions(
    wallet_id, type, amount, balance_after,
    description, reference_id, external_tx_id, metadata
  )
  VALUES (
    v_wallet_id, p_type, p_amount, v_balance + p_amount,
    p_desc, p_ref_id, p_ext_tx_id, p_metadata
  )
  ON CONFLICT (external_tx_id) DO UPDATE
    SET metadata = wallet_transactions.metadata
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$body$;

-- ─── 5. AUTO-CREAR WALLET AL REGISTRAR USUARIO ───────
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
BEGIN
  INSERT INTO wallets(user_id, currency)
    VALUES (NEW.id, 'COP')
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$body$;

DROP TRIGGER IF EXISTS on_profile_created_wallet ON profiles;
CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Crear wallets para usuarios existentes
INSERT INTO wallets(user_id, currency)
  SELECT id, 'COP' FROM profiles
  ON CONFLICT (user_id) DO NOTHING;

-- ─── 6. ROW LEVEL SECURITY ───────────────────────────
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet: cada usuario ve y solo puede leer la suya
-- La escritura es exclusiva del service_role (Edge Functions)
DROP POLICY IF EXISTS "user reads own wallet" ON wallets;
CREATE POLICY "user reads own wallet"
  ON wallets FOR SELECT
  USING (user_id = auth.uid());

-- Transacciones: solo lectura del propio wallet
DROP POLICY IF EXISTS "user reads own transactions" ON wallet_transactions;
CREATE POLICY "user reads own transactions"
  ON wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- Habilitar Realtime en wallets
DO $body$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $body$;
