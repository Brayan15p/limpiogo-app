import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

interface EstimateResult {
  sqm_estimate: number;
  service_type: 'basic' | 'deep' | 'move' | 'office' | 'custom';
  price_min: number;
  price_max: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

const SERVICE_BASE: Record<string, { base: number; perSqm: number }> = {
  basic:  { base: 60000,  perSqm: 400 },
  deep:   { base: 110000, perSqm: 700 },
  move:   { base: 180000, perSqm: 900 },
  office: { base: 90000,  perSqm: 550 },
  custom: { base: 70000,  perSqm: 500 },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { image_base64, media_type = 'image/jpeg' } = await req.json();
  if (!image_base64) return new Response('Missing image_base64', { status: 400 });

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type, data: image_base64 },
        },
        {
          type: 'text',
          text: `Eres un experto en servicios de limpieza doméstica en Colombia.
Analiza esta foto de un espacio y responde ÚNICAMENTE con un JSON válido, sin texto adicional:

{
  "sqm_estimate": <número entero de metros cuadrados visibles, estima entre 10 y 300>,
  "service_type": <"basic" | "deep" | "move" | "office" | "custom">,
  "dirt_level": <"low" | "medium" | "high">,
  "confidence": <"high" | "medium" | "low">,
  "reasoning": <string corto en español, máximo 20 palabras>
}

Reglas:
- basic: limpieza ligera, espacio ordenado
- deep: acumulación de suciedad, necesita trabajo a fondo
- move: espacio vacío o en mudanza
- office: espacio comercial/oficina
- custom: espacio atípico o necesidades especiales`,
        },
      ],
    }],
  });

  let parsed: any;
  try {
    const raw = (message.content[0] as any).text.trim();
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'parse_error' }), { status: 422 });
  }

  const svc    = SERVICE_BASE[parsed.service_type] ?? SERVICE_BASE.basic;
  const sqm    = Math.max(10, Math.min(300, parsed.sqm_estimate ?? 60));
  const base   = svc.base + sqm * svc.perSqm;
  // nivel de suciedad sube precio: low=1x, medium=1.1x, high=1.3x
  const mult   = parsed.dirt_level === 'high' ? 1.3 : parsed.dirt_level === 'medium' ? 1.1 : 1.0;
  const priceMin = Math.round(base * mult);
  const priceMax = Math.round(base * mult * 1.15);

  const result: EstimateResult = {
    sqm_estimate: sqm,
    service_type: parsed.service_type,
    price_min:    priceMin,
    price_max:    priceMax,
    confidence:   parsed.confidence,
    reasoning:    parsed.reasoning,
  };

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
