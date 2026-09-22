import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { coerceDoc } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Newsletter introuvable' }, { status: 404 })

  return NextResponse.json({ newsletter: data })
}

/**
 * Enregistrement du brouillon. Seuls les champs présents dans le corps sont
 * touchés, ce qui permet à la page de n'envoyer que ce qui a changé.
 *
 * Une newsletter déjà envoyée n'est plus modifiable : son contenu est la trace
 * de ce que les abonnés ont reçu. Pour repartir de là, on la duplique.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('newsletters')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Newsletter introuvable' }, { status: 404 })
  if (existing.status === 'sent') {
    return NextResponse.json(
      { error: 'Cette newsletter a déjà été envoyée : dupliquez-la pour en repartir.' },
      { status: 409 }
    )
  }

  const patch: Record<string, any> = {}

  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200)
  if (typeof body.subject === 'string') patch.subject = body.subject.slice(0, 300)
  if (typeof body.preheader === 'string') patch.preheader = body.preheader.slice(0, 300)
  if (body.header || body.blocks) {
    const doc = coerceDoc({ ...body, subject: body.subject ?? '', preheader: body.preheader ?? '' })
    if (body.header) patch.header = doc.header
    if (body.blocks) patch.blocks = doc.blocks
  }
  if (['all', 'plan', 'prelaunch', 'test'].includes(body.audience)) patch.audience = body.audience
  if (body.subscriptionFilter === null || typeof body.subscriptionFilter === 'string') {
    patch.subscription_filter = body.subscriptionFilter || null
  }
  if (['marketing', 'direct'].includes(body.deliveryMode)) patch.delivery_mode = body.deliveryMode

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Rien à enregistrer' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ newsletter: data })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await supabaseAdmin.from('newsletters').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
