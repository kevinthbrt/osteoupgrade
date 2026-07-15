import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

// GET /api/osteoflow/literature-review/[id]
// Returns a single literature review with its full structured content, so
// Osteoflow can display the article in-app instead of linking out.
// La revue de littérature est un contenu Premium (voir CGU 5.1) : on exige
// une session utilisateur identifiée avec le rôle premium/admin — 'trial'
// (essai MyOsteoFlow) et le secret partagé seul (pas d'identité) sont
// explicitement exclus, contrairement à getOsteoflowSessionUser qui autorise
// 'trial' pour l'accès général à l'app.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenUser = await getOsteoflowSessionUser(req)
  console.log('[literature-review] DEBUG tokenUser =', JSON.stringify(tokenUser))
  if (!tokenUser || !['premium', 'admin'].includes(tokenUser.role)) {
    console.log('[literature-review] DEBUG blocked, role was:', tokenUser?.role)
    return NextResponse.json(
      { error: 'Un abonnement Premium est requis pour lire cet article.', code: 'NOT_PREMIUM' },
      { status: 403 }
    )
  }
  console.log('[literature-review] DEBUG allowed through, role was:', tokenUser.role)

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
