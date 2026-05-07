import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SRV_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SRV_KEY);

  // Verificar que el JWT es válido
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return new Response('Unauthorized', { status: 401 });

  let body: { user_id: string; cedula_path: string; selfie_path: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 });
  }

  const { user_id, cedula_path, selfie_path } = body;

  // Solo el propio pro puede enviar su verificación
  if (user.id !== user_id) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  // Marcar como pending
  const { error: updateErr } = await adminClient
    .from('profiles')
    .update({
      verification_status:          'pending',
      verification_submitted_at:    new Date().toISOString(),
      verification_provider:        'manual_review',
      verification_provider_id:     `manual_${Date.now()}`,
    })
    .eq('id', user_id);

  if (updateErr) {
    console.error('DB error:', updateErr);
    return new Response(JSON.stringify({ error: 'db_error' }), { status: 500 });
  }

  // Obtener datos del pro para el log
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', user_id)
    .single();

  // Log visible en Supabase Dashboard → Edge Functions → Logs
  // El admin revisa las fotos en Storage y aprueba/rechaza con SQL
  console.log(`
╔══════════════════════════════════════════╗
║   NUEVA VERIFICACIÓN DE IDENTIDAD        ║
╠══════════════════════════════════════════╣
║ Pro:     ${profile?.full_name}
║ Email:   ${profile?.email}
║ ID:      ${user_id}
║ Cédula:  ${cedula_path}
║ Selfie:  ${selfie_path}
║ Fecha:   ${new Date().toISOString()}
╠══════════════════════════════════════════╣
║ Ver fotos en Storage → identity-docs
║
║ APROBAR:
║ UPDATE profiles
║   SET verification_status = 'verified'
║   WHERE id = '${user_id}';
║
║ RECHAZAR:
║ UPDATE profiles
║   SET verification_status = 'rejected',
║       verification_rejection_reason = 'Docs no válidos'
║   WHERE id = '${user_id}';
╚══════════════════════════════════════════╝
  `);

  return new Response(
    JSON.stringify({
      success: true,
      status:  'pending',
      message: 'Solicitud recibida. Revisaremos tu identidad en 24–48 horas.',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
