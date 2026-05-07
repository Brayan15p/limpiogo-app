import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SRV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL    = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { user_id: string; status: string; reason?: string };
  try { body = await req.json(); }
  catch { return new Response('invalid_body', { status: 400 }); }

  const { user_id, status, reason } = body;
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SRV_KEY);

  // Obtener push_token del pro
  const { data: profile } = await adminClient
    .from('profiles')
    .select('push_token, full_name')
    .eq('id', user_id)
    .single();

  if (!profile?.push_token) {
    console.log(`No push token for user ${user_id}`);
    return new Response(JSON.stringify({ ok: true, skipped: 'no_token' }));
  }

  const isVerified = status === 'verified';
  const notification = {
    to:    profile.push_token,
    title: isVerified ? '🎉 ¡Identidad verificada!' : '⚠️ Verificación no aprobada',
    body:  isVerified
      ? 'Tu perfil ahora tiene el badge de identidad verificada. ¡Los clientes confiarán más en ti!'
      : (reason ?? 'Tus documentos no pudieron ser verificados. Intenta de nuevo con fotos más claras.'),
    data:  { screen: 'Verification', status },
    sound: 'default',
    priority: 'high',
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(notification),
  });

  const result = await res.json();
  console.log(`Push sent to ${user_id} (${status}):`, JSON.stringify(result));

  // Guardar notificación en la tabla notifications si existe
  await adminClient.from('notifications').insert({
    user_id,
    type:    isVerified ? 'verification_approved' : 'verification_rejected',
    title:   notification.title,
    body:    notification.body,
    data:    { status },
  }).then(() => {}).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}, { verify_jwt: false });
