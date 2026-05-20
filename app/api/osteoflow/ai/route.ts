import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
Tu reçois la transcription brute d'une anamnèse et tu dois la structurer.

RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact :
{
  "reason": "motif principal en 1 ligne courte",
  "anamnesis": "anamnèse structurée en markdown"
}

Pour "anamnesis", utilise ce format :

**Histoire de la maladie :** [chronologie, circonstances, évolution]

**Caractéristiques :** [localisation] — [type] — EVA x/10 — [irradiations]

**Facteurs modulants :** aggravants : [...] / soulageants : [...]

**Antécédents mentionnés :** [...]

**Traitements essayés :** [...]

**Impact fonctionnel :** [...]

**Drapeaux rouges :** [aucun identifié — ou liste]

Règles : style médical concis, "—" si non mentionné, ne jamais inventer, corriger les erreurs de transcription, répondre en français.`

export async function POST(req: Request) {
  try {
    // Vérification du secret partagé
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { transcript } = await req.json()
    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcription vide' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Transcription :\n\n${transcript}` }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[AI proxy]', res.status, err)
      return NextResponse.json({ error: `Erreur Anthropic (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = data.content?.[0]?.text ?? ''

    let parsed: { reason: string; anamnesis: string }
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      parsed = { reason: '', anamnesis: content }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[AI proxy]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
