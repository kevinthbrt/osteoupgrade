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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [testsResult, clustersResult] = await Promise.all([
      supabase
        .from('orthopedic_tests')
        .select('id, name, region, category, indications')
        .order('region')
        .order('name'),
      supabase
        .from('orthopedic_test_clusters')
        .select('id, name, region, orthopedic_test_cluster_items(test_id)')
        .order('region'),
    ])

    if (testsResult.error) throw testsResult.error

    const tests = testsResult.data ?? []
    const testToClusterNames: Record<string, string[]> = {}

    for (const cluster of (clustersResult.data ?? [])) {
      const items = (cluster as unknown as { orthopedic_test_cluster_items: { test_id: string }[] })
        .orthopedic_test_cluster_items ?? []
      for (const item of items) {
        if (!testToClusterNames[item.test_id]) testToClusterNames[item.test_id] = []
        testToClusterNames[item.test_id].push(cluster.name)
      }
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
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const userContent = `Anamnèse :
${reason ? `Motif : ${reason}\n\n` : ''}${anamnesis}

Tests disponibles (${testsCompact.length}) :
${JSON.stringify(testsCompact)}`

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
      console.error('[suggest-tests]', res.status, err)
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = (data.content?.[0]?.text ?? '').trim()

    let parsed: unknown
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      console.error('[suggest-tests] JSON parse error', content.substring(0, 200))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[suggest-tests]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
