import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0';

const client = new Anthropic();
const today = new Date().toISOString().split('T')[0];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: 'No text' }), { status: 400 });

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `Eres un parser de reservas de limpieza. Hoy es ${today}.
Extrae del texto del usuario los siguientes campos y responde SOLO con JSON válido:
{
  "service_type": "basic|deep|move|office",  // tipo de servicio. default: "basic"
  "date": "YYYY-MM-DD",                       // fecha pedida. null si no se menciona
  "time": "HH:MM",                            // hora en formato 24h. null si no se menciona
  "preferred_pro_name": "nombre",             // nombre del pro preferido. null si no se menciona
  "address_hint": "texto",                    // dirección o barrio. null si no se menciona
  "notes": "texto"                            // notas adicionales. null si no hay
}
Si el usuario dice "mañana" usa ${new Date(Date.now()+86400000).toISOString().split('T')[0]}.
Si dice "hoy" usa ${today}.
Si dice "lunes/martes/..." calcula la fecha más próxima de ese día.`,
      messages: [{ role: 'user', content: text }],
    });

    const raw = (msg.content[0] as any).text.trim();
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
