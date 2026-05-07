import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Invocada por cron diario. Detecta clientes que "ya es hora" de limpiar.
Deno.serve(async () => {
  const now = new Date();

  // Clientes con al menos 2 bookings completados
  const { data: stats } = await supabase
    .from('client_booking_stats')
    .select('client_id, avg_interval_days, last_booking_at, total_bookings')
    .gte('total_bookings', 2)
    .not('avg_interval_days', 'is', null);

  if (!stats?.length) return new Response('no stats', { status: 200 });

  let notified = 0;

  for (const row of stats) {
    const lastBooking  = new Date(row.last_booking_at);
    const daysSinceLast = (now.getTime() - lastBooking.getTime()) / 86400000;
    const threshold     = row.avg_interval_days * 0.9; // 90% del intervalo normal

    if (daysSinceLast < threshold) continue;

    // No spamear: no enviar si ya se notificó en las últimas 48h
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, last_push_prediction, push_token')
      .eq('id', row.client_id)
      .single();

    if (!profile) continue;
    if (profile.last_push_prediction) {
      const hoursSince = (now.getTime() - new Date(profile.last_push_prediction).getTime()) / 3600000;
      if (hoursSince < 48) continue;
    }

    // Insertar notificación en tabla
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: '🏠 Ya es hora de limpiar',
      body: `Han pasado ${Math.round(daysSinceLast)} días desde tu último servicio. ¿Agendamos?`,
      type: 'prediction',
      data: { action: 'open_booking' },
    });

    // Actualizar timestamp para no spamear
    await supabase.from('profiles')
      .update({ last_push_prediction: now.toISOString() })
      .eq('id', profile.id);

    notified++;
  }

  return new Response(JSON.stringify({ notified }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
