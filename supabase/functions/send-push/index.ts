import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SRV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL    = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

async function sendExpoPush(token: string, title: string, body: string, data?: Record<string, unknown>) {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default', priority: 'high' }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const admin = createClient(SUPABASE_URL, SUPABASE_SRV_KEY);

  let payload: PushPayload;
  try { payload = await req.json(); }
  catch { return new Response('invalid_body', { status: 400 }); }

  const { user_id, title, body, type, data } = payload;

  // Obtener push_token del destinatario
  const { data: profile } = await admin
    .from('profiles')
    .select('push_token, full_name')
    .eq('id', user_id)
    .single();

  // Insertar en notifications siempre (feed in-app)
  await admin.from('notifications').insert({
    user_id,
    title,
    body,
    type,
    data: data ?? {},
    read: false,
  });

  // Solo enviar push si tiene token
  if (!profile?.push_token) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no_token' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await sendExpoPush(profile.push_token, title, body, data);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}, { verify_jwt: false });
