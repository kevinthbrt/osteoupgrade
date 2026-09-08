import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/customers/surveys?statut=repondu|en_attente
 *
 * Toutes les enquêtes, réponses comprises. C'est la contrepartie de la liste
 * de comptes : les motifs de départ et les remarques n'ont d'intérêt que lus
 * ensemble, pas fiche par fiche.
 */
export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const statut = new URL(request.url).searchParams.get('statut') || 'repondu'

  let query = supabaseAdmin
    .from('customer_surveys')
    .select('id, user_id, email, kind, question, rating, choice, answer, sent_at, responded_at')
    .order('responded_at', { ascending: false, nullsFirst: false })
    .order('sent_at', { ascending: false })
    .limit(500)

  if (statut === 'repondu') query = query.not('responded_at', 'is', null)
  else if (statut === 'en_attente') query = query.is('responded_at', null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enquetes = data || []

  // Le nom du répondant n'est pas dans `customer_surveys` : on le rapproche
  // ici plutôt que de dupliquer une donnée qui change (mariage, correction).
  const ids = Array.from(new Set(enquetes.map((s) => s.user_id).filter(Boolean)))
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from('profiles').select('id, full_name, plan, subscription_status').in('id', ids)
    : { data: [] as any[] }

  const parId = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))

  return NextResponse.json({
    enquetes: enquetes.map((s) => ({ ...s, profil: s.user_id ? parId[s.user_id] || null : null })),
  })
}
