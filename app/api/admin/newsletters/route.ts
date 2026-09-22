import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { coerceDoc, emptyDoc } from '@/lib/newsletter'

/**
 * Brouillons et historique des newsletters.
 *
 * Tout passe par la clé service-role : la table n'a qu'une politique
 * administrateur, et le module n'est accessible que depuis l'administration.
 */

export const dynamic = 'force-dynamic'

/** Liste allégée : de quoi peupler la barre latérale, sans les blocs. */
export async function GET() {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .select('id, title, subject, status, audience, subscription_filter, delivery_mode, sent_at, sent_count, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ newsletters: data || [] })
}

/**
 * Crée un brouillon. Avec `duplicateOf`, reprend le contenu d'une newsletter
 * existante : c'est le geste normal d'un mois sur l'autre.
 */
export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { duplicateOf, title } = body as { duplicateOf?: string; title?: string }

  let source = {
    ...emptyDoc(),
    audience: 'all' as string,
    subscription_filter: null as string | null,
    delivery_mode: 'marketing' as string
  }

  if (duplicateOf) {
    const { data, error } = await supabaseAdmin
      .from('newsletters')
      .select('subject, preheader, header, blocks, audience, subscription_filter, delivery_mode')
      .eq('id', duplicateOf)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Newsletter introuvable' }, { status: 404 })
    }

    const doc = coerceDoc(data)
    source = {
      ...doc,
      audience: data.audience || 'all',
      subscription_filter: data.subscription_filter ?? null,
      delivery_mode: data.delivery_mode || 'marketing'
    }
  }

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .insert({
      title: title?.trim() || defaultTitle(),
      subject: source.subject,
      preheader: source.preheader,
      header: source.header,
      blocks: source.blocks,
      audience: source.audience,
      subscription_filter: source.subscription_filter,
      delivery_mode: source.delivery_mode,
      status: 'draft',
      created_by: admin.id
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ newsletter: data })
}

function defaultTitle(): string {
  const now = new Date()
  const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return `Newsletter ${mois}`
}
