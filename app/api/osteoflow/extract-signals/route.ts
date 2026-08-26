import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// Extraction courte, appelée pendant la consultation : la latence compte
// davantage que la profondeur. On reste largement sous le plafond.
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un extracteur de faits cliniques pour ostéopathes francophones.

Tu reçois le texte d'une anamnèse dictée. Tu dois le traduire en signaux issus
EXCLUSIVEMENT du vocabulaire fourni. Tu n'interprètes pas, tu ne diagnostiques
pas, tu ne déduis rien qui ne soit pas dit : tu relèves.

RÉPONDS UNIQUEMENT EN JSON valide :
{
  "signals": [
    { "id": "identifiant.exact.du.vocabulaire", "value": true, "verbatim": "les mots du patient qui le justifient" }
  ]
}

Règles absolues :
- "id" doit être un identifiant du vocabulaire fourni, copié caractère pour
  caractère. Tout autre identifiant est ignoré : n'en invente jamais.
- "value" vaut true si le fait est affirmé, false s'il est explicitement nié
  ("pas de fièvre", "ça ne descend pas sous le genou"). Un fait dont le texte ne
  parle pas ne figure PAS dans la réponse — l'absence de mention n'est pas une
  négation.
- "verbatim" cite le passage du texte qui justifie le signal, sans le
  reformuler. C'est ce qui permet au praticien de vérifier.
- Dans le doute, n'extrais pas. Un signal faux coûte plus cher qu'un signal
  manquant : il oriente le raisonnement dans une mauvaise direction.
- Aucun texte avant ou après le JSON.

Quand une liste « déjà relevé » accompagne le texte, celui-ci est la suite de
l'anamnèse et non son intégralité. Ne renvoie alors que ce que ce passage
ajoute ou contredit : un signal déjà relevé et simplement répété n'a pas à
figurer dans la réponse, un signal déjà relevé que ce passage contredit doit y
figurer avec sa nouvelle valeur.`

interface VocabularyEntry {
  id: string
  label: string
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = (await req.json()) as {
      text: string
      reason?: string
      known?: { id: string; value: boolean }[]
      vocabulary: VocabularyEntry[]
    }
    const { text, reason, vocabulary } = body
    const known = Array.isArray(body.known) ? body.known : []

    if (!text?.trim()) {
      return NextResponse.json({ signals: [] })
    }
    if (!Array.isArray(vocabulary) || vocabulary.length === 0) {
      return NextResponse.json({ error: 'Vocabulaire manquant' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[extract-signals] ANTHROPIC_API_KEY manquante')
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    // Le vocabulaire est identique d'un patient à l'autre : il va dans le
    // préfixe mis en cache. TTL 1h — il survit d'un patient au suivant, donc
    // dès la deuxième extraction de l'heure il est relu à 0,1× du prix.
    const vocabularyText = `Vocabulaire (${vocabulary.length} signaux) :\n${vocabulary
      .map((entry) => `${entry.id} = ${entry.label}`)
      .join('\n')}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31,extended-cache-ttl-2025-04-11',
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: 2000,
        // Relever des faits n'appelle pas de raisonnement profond, et cet appel
        // se fait pendant que le praticien est avec son patient.
        output_config: { effort: 'low' },
        system: [
          { type: 'text', text: SYSTEM_PROMPT },
          { type: 'text', text: vocabularyText, cache_control: { type: 'ephemeral', ttl: '1h' } },
        ],
        messages: [
          {
            role: 'user',
            content: `${reason ? `Motif de consultation : ${reason}\n\n` : ''}${
              known.length > 0
                ? `Déjà relevé :\n${known.map((s) => `${s.id} = ${s.value}`).join('\n')}\n\nSuite de l'anamnèse :\n`
                : 'Anamnèse :\n'
            }${text}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[extract-signals] Anthropic', res.status, err.substring(0, 200))
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = (data.content?.find((block: { type: string }) => block.type === 'text')?.text ?? '').trim()

    // Le modèle peut encadrer le JSON de texte : on isole l'objet.
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start === -1 || end === -1) {
      console.error('[extract-signals] réponse non JSON:', content.substring(0, 200))
      return NextResponse.json({ signals: [] })
    }

    let parsed: { signals?: unknown }
    try {
      parsed = JSON.parse(content.slice(start, end + 1))
    } catch {
      console.error('[extract-signals] JSON invalide:', content.substring(0, 200))
      return NextResponse.json({ signals: [] })
    }

    // Filtrage de sécurité : le vocabulaire fait foi, pas le modèle.
    const allowed = new Set(vocabulary.map((entry) => entry.id))
    const signals = (Array.isArray(parsed.signals) ? parsed.signals : [])
      .filter(
        (signal: unknown): signal is { id: string; value: boolean; verbatim?: string } =>
          typeof signal === 'object' &&
          signal !== null &&
          typeof (signal as { id?: unknown }).id === 'string' &&
          typeof (signal as { value?: unknown }).value === 'boolean' &&
          allowed.has((signal as { id: string }).id),
      )
      .map((signal) => ({
        id: signal.id,
        value: signal.value,
        verbatim: typeof signal.verbatim === 'string' ? signal.verbatim.slice(0, 300) : undefined,
      }))

    return NextResponse.json({ signals })
  } catch (err) {
    console.error('[extract-signals]', err)
    return NextResponse.json({ error: 'Erreur lors de l\'extraction.' }, { status: 500 })
  }
}
