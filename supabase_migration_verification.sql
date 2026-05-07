-- =====================================================
-- LimpioGO — Migration: Identity Verification (F10)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- ─── 1. CAMPOS EN PROFILES ───────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_provider text DEFAULT 'truora',
  ADD COLUMN IF NOT EXISTS verification_provider_id text,
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- Índice para listar pros verificados rápido
CREATE INDEX IF NOT EXISTS idx_profiles_verification
  ON profiles(verification_status)
  WHERE verification_status = 'verified';

-- ─── 2. STORAGE BUCKET identity-docs ─────────────────
-- Crear manualmente en Supabase Dashboard → Storage → New Bucket:
--   Name: identity-docs
--   Public: NO (privado)
--   File size limit: 10MB
--   Allowed MIME types: image/jpeg, image/png, image/webp

-- RLS en storage.objects para el bucket identity-docs
-- (CREATE POLICY no soporta IF NOT EXISTS — usar DROP + CREATE)

DROP POLICY IF EXISTS "pro uploads own identity docs" ON storage.objects;
CREATE POLICY "pro uploads own identity docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'identity-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "pro views own identity docs" ON storage.objects;
CREATE POLICY "pro views own identity docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "pro updates own identity docs" ON storage.objects;
CREATE POLICY "pro updates own identity docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'identity-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ─── 3. FUNCIÓN PARA ACTUALIZAR STATUS (desde Edge Function) ─
CREATE OR REPLACE FUNCTION update_verification_status(
  p_user_id    uuid,
  p_status     text,
  p_provider_id text DEFAULT NULL,
  p_reason     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET
    verification_status           = p_status,
    verification_provider_id      = COALESCE(p_provider_id, verification_provider_id),
    verification_rejection_reason = p_reason,
    verification_submitted_at     = CASE
      WHEN p_status = 'pending' THEN now()
      ELSE verification_submitted_at
    END
  WHERE id = p_user_id;
END;
$$;

-- ─── 4. REALTIME en profiles ─────────────────────────
DO $body$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $body$;
