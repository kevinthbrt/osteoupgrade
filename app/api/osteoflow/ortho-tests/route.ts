import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const [testsResult, clustersResult, clusterItemsResult] = await Promise.all([
      supabase
        .from('orthopedic_tests')
        .select('id, name, category, indications')
        .order('name'),
      supabase
        .from('orthopedic_test_clusters')
        .select('id, name, region')
        .order('name'),
      supabase
        .from('orthopedic_test_cluster_items')
        .select('cluster_id, test_id'),
    ])

    if (testsResult.error) {
      console.error('[ortho-tests] tests error:', testsResult.error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    const tests = testsResult.data ?? []
    const clusters = clustersResult.data ?? []
    const clusterItems = clusterItemsResult.data ?? []

    const clusterById: Record<string, { name: string; region: string }> = {}
    for (const c of clusters) clusterById[c.id] = { name: c.name, region: c.region ?? '' }

    const testToClusterNames: Record<string, string[]> = {}
    for (const item of clusterItems) {
      const cluster = clusterById[item.cluster_id]
      if (!cluster) continue
      if (!testToClusterNames[item.test_id]) testToClusterNames[item.test_id] = []
      testToClusterNames[item.test_id].push(cluster.name)
    }

    // region = category (Épaule, Genou, Lombaire…) — category is populated for all 116 tests
    // clusters are only assigned to 23 tests and are used as sub-groupings, not regions
    const result = tests.map(t => ({
      id: t.id,
      name: t.name,
      region: t.category ?? null,
      indications: t.indications ?? null,
      clusters: testToClusterNames[t.id] ?? [],
    }))

    return NextResponse.json({ tests: result })
  } catch (err) {
    console.error('[ortho-tests] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
