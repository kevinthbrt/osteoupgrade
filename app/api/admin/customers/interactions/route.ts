import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { CANAUX_CONTACT, CHURN_REASONS, escapeHtml, type CanalContact } from '@/lib/customer-tracking'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/customers/interactions
 *
 * Inscrit dans la chronologie ce qui s'est passé en dehors du module : un
 * email parti de votre boîte, un appel, une réponse reçue ailleurs, ou le
 * motif de départ d'un client résilié avant la mise en service du suivi.
 *
 * Sans cette route, la fiche d'une personne relancée trois fois à la main
 * afficherait « jamais relancé », et le filtre du même nom la remonterait
 * en tête des comptes à contacter. Une fiche fausse est pire qu'une fiche
 * vide : elle fait agir à tort.
 *
 * Accepte une liste de comptes : « j'ai déjà écrit à tous ceux-là le mois
 * dernier » est le cas qui se présente au moment de la reprise.
 */
export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { userIds, action, date, subject, reason, comment } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'Aucun compte sélectionné.' }, { status: 400 })
  }
  if (userIds.length > 200) {
    return NextResponse.json({ error: 'Sélection trop large (200 comptes au plus).' }, { status: 400 })
  }

  const estContact = CANAUX_CONTACT.includes(action as CanalContact)
  if (!estContact && action !== 'motif_depart') {
    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
  }

  // Une action consignée est par nature passée. Autoriser une date future
  // ferait apparaître un contact « à venir » dans une chronologie, et
  // fausserait aussi bien le tri que la dernière relance affichée.
  const quand = date ? new Date(date) : new Date()
  if (Number.isNaN(quand.getTime())) {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }
  if (quand.getTime() > Date.now() + 60_000) {
    return NextResponse.json({ error: 'La date ne peut pas être dans le futur.' }, { status: 400 })
  }
  const occurredAt = quand.toISOString()

  const texte = typeof comment === 'string' ? comment.trim().slice(0, 4000) : ''
  const objet = typeof subject === 'string' ? subject.trim().slice(0, 300) : ''

  if (action === 'motif_depart' && !reason && !texte) {
    return NextResponse.json({ error: 'Renseignez un motif ou un commentaire.' }, { status: 400 })
  }
  if (action === 'motif_depart' && reason && !CHURN_REASONS[reason]) {
    return NextResponse.json({ error: 'Motif inconnu.' }, { status: 400 })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('id', userIds)

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })
  if (!profiles?.length) return NextResponse.json({ error: 'Comptes introuvables.' }, { status: 404 })

  let traites = 0

  for (const profile of profiles) {
    if (action === 'motif_depart') {
      // On complète l'événement de résiliation existant plutôt que d'en
      // ajouter un second : deux « Résiliation » dans une chronologie
      // laisseraient croire à deux départs.
      const { data: existant } = await supabaseAdmin
        .from('customer_events')
        .select('id, metadata')
        .eq('user_id', profile.id)
        .in('event_type', ['canceled', 'trial_canceled'])
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existant) {
        await supabaseAdmin
          .from('customer_events')
          .update({
            reason: reason || null,
            comment: texte || null,
            metadata: { ...(existant.metadata || {}), motif_manuel: true, saisi_par: admin.id },
          })
          .eq('id', existant.id)
      } else {
        await supabaseAdmin.from('customer_events').insert({
          user_id: profile.id,
          email: profile.email,
          event_type: 'canceled',
          plan: 'free',
          source: 'admin',
          reason: reason || null,
          comment: texte || null,
          occurred_at: occurredAt,
          metadata: { manuel: true, motif_manuel: true, saisi_par: admin.id },
        })
      }

      traites++
      continue
    }

    const canal = action as CanalContact

    // Un email consigné doit compter comme une relance, sinon le filtre
    // « jamais relancé » continuerait de le proposer. Il prend donc une ligne
    // dans `customer_emails`, marquée `provider = 'manuel'` : elle n'aura
    // jamais de statut d'ouverture, et l'interface ne doit pas en promettre.
    let emailId: string | null = null
    if (canal === 'email') {
      const { data: ligne } = await supabaseAdmin
        .from('customer_emails')
        .insert({
          user_id: profile.id,
          email: profile.email,
          subject: objet || 'Relance envoyée à la main',
          html: texte ? `<p>${escapeHtml(texte)}</p>` : '',
          category: 'relance',
          provider: 'manuel',
          status: 'sent',
          sent_by: admin.id,
          sent_at: occurredAt,
          metadata: { manuel: true },
        })
        .select('id')
        .single()
      emailId = ligne?.id ?? null
    }

    await supabaseAdmin.from('customer_events').insert({
      user_id: profile.id,
      email: profile.email,
      event_type: canal === 'email' ? 'admin_email' : 'other',
      source: 'admin',
      comment: texte || null,
      occurred_at: occurredAt,
      metadata: {
        manuel: true,
        canal,
        objet: objet || null,
        email_id: emailId,
        saisi_par: admin.id,
      },
    })

    traites++
  }

  return NextResponse.json({ success: true, traites })
}

/**
 * DELETE /api/admin/customers/interactions?eventId=...
 *
 * Retire une entrée consignée à la main. Réservé à celles-ci : un événement
 * posé par Stripe est un fait, pas une saisie, et l'effacer ferait mentir la
 * chronologie sur ce qui s'est réellement produit.
 */
export async function DELETE(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const eventId = new URL(request.url).searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId manquant' }, { status: 400 })

  const { data: evenement } = await supabaseAdmin
    .from('customer_events')
    .select('id, source, metadata')
    .eq('id', eventId)
    .maybeSingle()

  if (!evenement) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  if (evenement.source !== 'admin' || !(evenement.metadata as any)?.manuel) {
    return NextResponse.json(
      { error: "Seules les entrées consignées à la main peuvent être retirées." },
      { status: 409 }
    )
  }

  // La ligne d'email consignée part avec son événement, sinon le compteur de
  // relances resterait incrémenté par une entrée devenue invisible.
  const emailId = (evenement.metadata as any)?.email_id
  if (emailId) {
    await supabaseAdmin.from('customer_emails').delete().eq('id', emailId).eq('provider', 'manuel')
  }

  const { error } = await supabaseAdmin.from('customer_events').delete().eq('id', eventId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
