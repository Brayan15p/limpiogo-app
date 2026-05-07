-- =====================================================
-- LimpioGO — Migration: Notificación push al verificar (F10)
-- Ejecutar DESPUÉS de supabase_migration_verification.sql
-- Requiere: extensión pg_net (ya activa en Supabase)
-- =====================================================

-- Trigger que llama a la Edge Function verify-identity-notify
-- cuando el admin cambia verification_status a 'verified' o 'rejected'

CREATE OR REPLACE FUNCTION notify_verification_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
  v_old_status text := OLD.verification_status;
  v_new_status text := NEW.verification_status;
  v_changed    boolean := v_new_status IS DISTINCT FROM v_old_status;
  v_relevant   boolean := v_new_status IN ('verified', 'rejected');
BEGIN
  IF v_changed AND v_relevant THEN
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/verify-identity-notify',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := jsonb_build_object(
        'user_id', NEW.id,
        'status',  v_new_status,
        'reason',  NEW.verification_rejection_reason
      )::text
    );
  END IF;
  RETURN NEW;
END;
$body$;

DROP TRIGGER IF EXISTS on_verification_status_changed ON profiles;
CREATE TRIGGER on_verification_status_changed
  AFTER UPDATE OF verification_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_result();
