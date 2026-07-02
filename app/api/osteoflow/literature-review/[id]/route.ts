import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

const EXPECTED_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

// GET /api/osteoflow/literature-review/[id]
// Returns a single literature review with its full structured content, so
// Osteoflow can display the article in-app instead of linking out.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenUser = await getOsteoflowSessionUser(req)
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!tokenUser && authHeader !== EXPECTED_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('literature_reviews')
    .select(`
      id, title, summary, content_structured, images, study_url, published_date,
      thrust_score, thrust_score_explanation,
      tags:literature_review_tag_associations ( tag:literature_review_tags ( id, name, slug, color ) )
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  }

  const review = {
    ...data,
    tags: (data.tags || []).map((t: { tag: unknown }) => t.tag).filter(Boolean),
  }

  return NextResponse.json({ review }, { headers: { 'Cache-Control': 'no-store' } })
}
