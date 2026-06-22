import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
// Clinical reasoning over the anamnesis can take a while on Sonnet; keep the
// function alive past the default Vercel ceiling. Hobby caps at 60s.
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
À partir de l'anamnèse SEULE (interrogatoire, sans examen physique) et d'une liste de tests
orthopédiques disponibles, tu dois produire un raisonnement clinique probabiliste.

RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact :
{
  "hypotheses": [
    { "id": 1, "label": "intitulé court de l'hypothèse", "prior": 45, "rationale": "éléments de l'anamnèse en faveur, 1 phrase" },
    { "id": 2, "label": "...", "prior": 30, "rationale": "..." },
    { "id": 3, "label": "...", "prior": 20, "rationale": "..." }
  ],
  "tests": [
    { "test_id": "uuid-exact-du-test", "name": "Nom exact du test", "region": "Région",
      "targetId": 1, "deltaPositive": 20, "deltaNegative": -15,
      "rationale": "ce que le test confirme/infirme, 1 phrase" }
  ]
}

Règles pour "hypotheses" :
- EXACTEMENT 3 hypothèses, classées de la plus à la moins probable (id 1, 2, 3)
- Ce sont des HYPOTHÈSES cliniques, jamais un diagnostic médical
- "prior" = probabilité estimée en % d'après l'interrogatoire seul (estimation indicative)

Règles pour "tests" :
- 3 à 6 tests maximum, choisis UNIQUEMENT dans la liste fournie (utilise le test_id exact)
- "targetId" = l'id de l'hypothèse que le test discrimine le mieux
- "deltaPositive" / "deltaNegative" = effet indicatif du test sur la probabilité de l'hypothèse ciblée,
  exprimé en points de pourcentage ARRONDIS à un multiple de 5, bornés entre -25 et +25
  (positif = en faveur, négatif = en défaveur). deltaPositive > 0, deltaNegative < 0.
- Privilégie les tests qui font vraiment basculer une hypothèse plutôt que des tests peu discriminants

Ne jamais inventer de test absent de la liste. Réponds en français.`

interface Hypothesis {
  id: number
  label: string
  prior: number
  rationale: string
}

interface HypothesisTest {
  test_id: string
  name: string
  region: string
  targetId: number
  deltaPositive: number
  deltaNegative: number
  rationale: string
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json() as { anamnesis: string; reason?: string }
    const { anamnesis, reason } = body

    if (!anamnesis?.trim()) {
      return NextResponse.json({ error: 'Anamnèse vide' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[hypotheses] missing env:', { url: !!supabaseUrl, key: !!supabaseAnonKey })
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Same orthopedic catalogue as suggest-tests: region lives on the clusters.
    const [testsResult, clustersResult, clusterItemsResult] = await Promise.all([
      supabase.from('orthopedic_tests').select('id, name, category, indications').order('name'),
      supabase.from('orthopedic_test_clusters').select('id, name, region').order('name'),
      supabase.from('orthopedic_test_cluster_items').select('cluster_id, test_id'),
    ])

    if (testsResult.error) {
      const e = testsResult.error
      console.error(`[hypotheses] ERR code=${e.code} msg=${e.message}`)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    const tests = testsResult.data ?? []
    const clusters = clustersResult.data ?? []
    const clusterItems = clusterItemsResult.data ?? []

    const clusterById: Record<string, { region: string }> = {}
    for (const c of clusters) clusterById[c.id] = { region: c.region ?? '' }
    const testToRegion: Record<string, string> = {}
    for (const item of clusterItems) {
      const cluster = clusterById[item.cluster_id]
      if (cluster && !testToRegion[item.test_id]) testToRegion[item.test_id] = cluster.region
    }

    const testsCompact = tests.map(t => ({
      id: t.id,
      name: t.name,
      region: testToRegion[t.id] ?? '',
      ...(t.indications ? { indications: (t.indications as string).substring(0, 100) } : {}),
    }))

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[hypotheses] missing ANTHROPIC_API_KEY')
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const userContent = `Anamnèse :\n${reason ? `Motif : ${reason}\n\n` : ''}${anamnesis}\n\nTests disponibles (${testsCompact.length}) :\n${JSON.stringify(testsCompact)}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[hypotheses] Anthropic', res.status, err.substring(0, 200))
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    // Pas de prefill assistant — rejeté (400) par les modèles Claude 4.6.
    const content = (data.content?.[0]?.text ?? '').trim()

    let parsed: { hypotheses?: Hypothesis[]; tests?: HypothesisTest[] }
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      console.error('[hypotheses] JSON parse fail:', content.substring(0, 200))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[hypotheses] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
