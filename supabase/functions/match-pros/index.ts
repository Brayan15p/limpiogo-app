import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface MatchRequest {
  job_id: string;
  lat: number;
  lng: number;
  job_type: string;
}

interface ProCandidate {
  id: string;
  full_name: string;
  rating: number;
  lat: number;
  lng: number;
  health_certifications: string[];
  distance_km?: number;
  score?: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body: MatchRequest = await req.json();
  const { job_id, lat, lng, job_type } = body;

  // Buscar pros activos con disponibilidad
  const { data: pros } = await supabase
    .from('profiles')
    .select('id, full_name, rating, lat, lng, health_certifications, is_online')
    .eq('role', 'pro')
    .eq('is_online', true)
    .not('lat', 'is', null);

  if (!pros?.length) {
    return new Response(JSON.stringify({ top: [], all: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Score ponderado: cercanía 40% + rating 25% + especialidad 20% + disponibilidad 15%
  const scored: ProCandidate[] = pros.map((pro: any) => {
    const dist = haversineKm(lat, lng, pro.lat, pro.lng);
    const proximityScore  = Math.max(0, 1 - dist / 20);   // normalizado a 20km
    const ratingScore     = (pro.rating ?? 3) / 5;
    const specialtyScore  = (pro.health_certifications ?? []).length > 0 ? 1 : 0.5;
    const availScore      = pro.is_online ? 1 : 0.3;

    const total =
      proximityScore * 0.40 +
      ratingScore    * 0.25 +
      specialtyScore * 0.20 +
      availScore     * 0.15;

    return { ...pro, distance_km: Math.round(dist * 10) / 10, score: Math.round(total * 100) };
  });

  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const top3 = scored.slice(0, 3);
  const rest = scored.slice(3);

  // Guardar en el job
  await supabase.from('jobs').update({
    matched_pro_ids: top3.map(p => p.id),
    match_scores: Object.fromEntries(top3.map(p => [p.id, p.score])),
  }).eq('id', job_id);

  return new Response(
    JSON.stringify({ top: top3, all: rest }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
