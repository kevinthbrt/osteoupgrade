import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
À partir d'une anamnèse et d'une liste de tests orthopédiques, sélectionne les tests les plus pertinents.

RÉPONDS UNIQUEMENT EN JSON valide :
{
  "detected_regions": ["Région1", "Région2"],
  "clinical_summary": "Résumé clinique en 1 ligne",
  "suggested_tests": [
    {
      "test_id": "uuid-exact-du-test",
      "test_name": "Nom exact du test",
      "region": "Région anatomique",
      "cluster_names": ["Cluster"],
      "priority": "high",
      "rationale": "Justification clinique en 1 phrase"
    }
  ]
}

Priorités :
- "high" : test indispensable selon les symptômes décrits
- "medium" : test utile à considérer
- "low" : test de confirmation ou différentiel

Règles : 3 tests minimum, 8 maximum, ordonnés du plus au moins pertinent.
Utilise UNIQUEMENT les test_id de la liste fournie. Réponds en français.`

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
      console.error('[suggest-tests] Missing Supabase env vars:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey })
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    // Use anon key — orthopedic tables have anon SELECT policies (non-sensitive catalog data)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Use separate queries to avoid PostgREST embedded-join permission issues
    const [testsResult, clustersResult, clusterItemsResult] = await Promise.all([
      supabase
        .from('orthopedic_tests')
        .select('id, name, region, category, indications')
        .order('region')
        .order('name'),
      supabase
        .from('orthopedic_test_clusters')
        .select('id, name')
        .order('name'),
      supabase
        .from('orthopedic_test_cluster_items')
        .select('cluster_id, test_id'),
    ])

    if (testsResult.error) {
      console.error('[suggest-tests] tests query error:', JSON.stringify(testsResult.error))
      throw testsResult.error
    }
    if (clustersResult.error) {
      console.error('[suggest-tests] clusters query error:', JSON.stringify(clustersResult.error))
    }
    if (clusterItemsResult.error) {
      console.error('[suggest-tests] cluster_items query error:', JSON.stringify(clusterItemsResult.error))
    }

    const tests = testsResult.data ?? []
    const clusters = clustersResult.data ?? []
    const clusterItems = clusterItemsResult.data ?? []

    // Build cluster name map: test_id → cluster names
    const clusterNameById: Record<string, string> = {}
    for (const c of clusters) clusterNameById[c.id] = c.name

    const testToClusterNames: Record<string, string[]> = {}
    for (const item of clusterItems) {
      const clusterName = clusterNameById[item.cluster_id]
      if (!clusterName) continue
      if (!testToClusterNames[item.test_id]) testToClusterNames[item.test_id] = []
      testToClusterNames[item.test_id].push(clusterName)
    }

    const testsCompact = tests.map(t => ({
      id: t.id,
      name: t.name,
      region: t.region,
      ...(t.category ? { category: t.category } : {}),
      ...(t.indications ? { indications: (t.indications as string).substring(0, 100) } : {}),
      clusters: testToClusterNames[t.id] ?? [],
    }))

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[suggest-tests] Missing ANTHROPIC_API_KEY')
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const userContent = `Anamnèse :\n${reason ? `Motif : ${reason}\n\n` : ''}${anamnesis}\n\nTests disponibles (${testsCompact.length}) :\n${JSON.stringify(testsCompact)}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[suggest-tests] Anthropic error:', res.status, err.substring(0, 300))
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = (data.content?.[0]?.text ?? '').trim()

    let parsed: unknown
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      console.error('[suggest-tests] JSON parse error:', content.substring(0, 300))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[suggest-tests] unhandled error:', JSON.stringify(err), err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
