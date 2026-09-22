import { NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { getBroadcastFooterHtml } from '@/lib/email-footer'
import { verifyAdmin } from '@/lib/api-guards'
import { getOrCreateSegment, syncContactsToSegment, createAndSendBroadcast } from '@/lib/resend-marketing'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isPlan, planLabel } from '@/lib/entitlements'
import {
  applyMergeTags,
  coerceDoc,
  renderNewsletterHtml,
  renderNewsletterText,
  type AudienceKind,
  type DeliveryMode
} from '@/lib/newsletter'

// Synchroniser plusieurs centaines de contacts vers Resend (séquentiel, ~4 req/s)
// peut prendre plusieurs minutes pour les grands segments.
export const maxDuration = 280

interface Contact {
  email: string
  firstName?: string | null
  lastName?: string | null
}

/**
 * Un envoi direct part un message à la fois sur le quota transactionnel, celui
 * des emails critiques (bienvenue, facture, confirmation d'abonnement). Au-delà
 * de ce seuil, la campagne marketing est le seul chemin raisonnable, et le
 * message d'erreur le dit plutôt que de laisser partir mille appels.
 */
const MAX_DIRECT_RECIPIENTS = 200

function splitName(fullName?: string | null): { firstName: string | null; lastName: string | null } {
  const trimmed = fullName?.trim()
  if (!trimmed) return { firstName: null, lastName: null }
  const [first, ...rest] = trimmed.split(/\s+/)
  return { firstName: first, lastName: rest.join(' ') || null }
}

/** Insère le pied de désinscription dans le corps du message, pas après lui. */
function injectFooter(html: string, footer: string): string {
  if (html.includes('</body>')) return html.replace('</body>', `${footer}</body>`)
  return html + footer
}

/**
 * Traduit le choix de liste en destinataires réels.
 *
 * RGPD : hors « pré-lancement » (des contacts qui se sont inscrits pour ça et
 * pour rien d'autre), on ne retient que les comptes ayant coché la newsletter.
 */
async function resolveContacts(
  audience: AudienceKind,
  subscriptionFilter?: string
): Promise<{ contacts: Contact[]; segmentName: string }> {
  if (audience === 'all') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .not('email', 'is', null)
      .eq('newsletter_opt_in', true)

    if (error) throw new Error('Erreur lors de la récupération des emails')
    return {
      contacts: (data || []).map((p) => ({ email: p.email as string, ...splitName(p.full_name) })),
      segmentName: 'Newsletter - Tous les inscrits'
    }
  }

  if (audience === 'prelaunch') {
    const { data, error } = await supabaseAdmin
      .from('mail_contacts')
      .select('email, first_name, last_name')
      .eq('status', 'newsletter_pre_launch')
      .not('email', 'is', null)

    if (error) throw new Error('Erreur lors de la récupération des contacts newsletter')
    return {
      contacts: (data || []).map((c) => ({ email: c.email as string, firstName: c.first_name, lastName: c.last_name })),
      segmentName: 'Newsletter pré-lancement'
    }
  }

  // Le filtre porte sur l'offre souscrite, pas sur le rôle : `premium` recouvre
  // le bundle ET l'offre OsteoUpgrade seule, et `trial` est le rôle miroir
  // permanent de l'offre MyOsteoFlow. Les anciennes valeurs de rôle restent
  // acceptées pour ne pas casser un envoi programmé avec l'ancienne interface.
  const parOffre = isPlan(subscriptionFilter)
  const colonne = parOffre ? 'plan' : 'role'

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq(colonne, subscriptionFilter)
    .not('email', 'is', null)
    .eq('newsletter_opt_in', true)

  if (error) throw new Error('Erreur lors de la récupération des emails')

  return {
    contacts: (data || []).map((p) => ({ email: p.email as string, ...splitName(p.full_name) })),
    segmentName: parOffre
      ? `Newsletter - Offre ${planLabel(subscriptionFilter as any)}`
      : `Newsletter - Rôle ${subscriptionFilter}`
  }
}

/** L'ancienne interface envoyait `audienceMode` ; on la traduit sans la casser. */
function legacyAudience(audienceMode: string | undefined, subscriptionFilter: string | undefined): AudienceKind {
  if (audienceMode === 'all') return 'all'
  if (audienceMode === 'subscription') {
    return subscriptionFilter === 'newsletter_pre_launch' ? 'prelaunch' : 'plan'
  }
  return 'test'
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      newsletterId,
      to,
      from,
      tags,
      attachments,
      audienceMode,
      subscriptionFilter: rawSubscriptionFilter
    } = body

    let subject: string = body.subject
    let html: string = body.html
    let text: string | undefined = body.text
    let subscriptionFilter: string | undefined = rawSubscriptionFilter

    const audience: AudienceKind = body.audience ?? legacyAudience(audienceMode, rawSubscriptionFilter)

    // Un test de relecture et un envoi à des adresses saisies à la main
    // empruntent le même chemin : seul ce drapeau les distingue. Le test ne
    // clôt pas la newsletter et reste possible sur une newsletter déjà partie,
    // ce qui est aussi le moyen de rattraper des destinataires en échec.
    const isPreview = body.preview === true

    // Le HTML d'une newsletter est reconstruit ici, à partir des blocs stockés :
    // ce qui part n'est jamais le HTML façonné par le navigateur.
    let newsletter: { id: string; subject: string } | null = null
    if (newsletterId) {
      const { data, error } = await supabaseAdmin
        .from('newsletters')
        .select('id, subject, preheader, header, blocks, status')
        .eq('id', newsletterId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Newsletter introuvable' }, { status: 404 })
      }
      if (data.status === 'sent' && !isPreview) {
        return NextResponse.json({ error: 'Cette newsletter a déjà été envoyée.' }, { status: 409 })
      }

      const doc = coerceDoc(data)
      subject = doc.subject
      html = renderNewsletterHtml(doc)
      text = renderNewsletterText(doc)
      newsletter = { id: data.id, subject: doc.subject }
    }

    if (!subject || !html) {
      return NextResponse.json({ error: 'Sujet et contenu sont requis.' }, { status: 400 })
    }

    if (audience === 'prelaunch') subscriptionFilter = 'newsletter_pre_launch'

    // Par défaut, une liste part en campagne marketing et un test part en direct.
    const deliveryMode: DeliveryMode =
      audience === 'test' ? 'direct' : body.deliveryMode === 'direct' ? 'direct' : 'marketing'

    // ── Liste explicite : le test de relecture, et l'ancienne composition ────
    if (audience === 'test') {
      const recipients = (Array.isArray(to)
        ? to
        : String(to || '')
            .split(/[,;\n]/)
            .map((email: string) => email.trim())
            .filter(Boolean)) as string[]

      if (!recipients.length) {
        return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
      }

      const { sent, errors, failed } = await sendDirect(recipients.map((email) => ({ email })), {
        subject,
        html,
        text,
        from,
        tags: tags || ['newsletter'],
        attachments
      })

      const marque = newsletter && !isPreview && sent > 0
        ? await markSent(newsletter.id, sent, null)
        : { done: false, warning: null as string | null }

      return NextResponse.json({
        success: true,
        mode: 'transactional',
        sent,
        total: recipients.length,
        errors: errors.length > 0 ? errors : undefined,
        failedRecipients: failed.length > 0 ? failed : undefined,
        newsletterStatus: marque.done ? 'sent' : undefined,
        warning: marque.warning || undefined
      })
    }

    // ── Vraie liste de diffusion ────────────────────────────────────────────
    const { contacts, segmentName } = await resolveContacts(audience, subscriptionFilter)

    if (!contacts.length) {
      return NextResponse.json(
        { error: 'Aucun destinataire trouvé (vérifiez que des utilisateurs ont accepté la newsletter).' },
        { status: 400 }
      )
    }

    if (deliveryMode === 'direct') {
      if (contacts.length > MAX_DIRECT_RECIPIENTS) {
        return NextResponse.json(
          {
            error: `L’envoi direct s’arrête à ${MAX_DIRECT_RECIPIENTS} destinataires (cette liste en compte ${contacts.length}). Choisissez le mode « campagne marketing ».`
          },
          { status: 400 }
        )
      }

      const { sent, errors, failed } = await sendDirect(contacts, {
        subject,
        html,
        text,
        from,
        tags: tags || ['newsletter'],
        attachments
      })

      // Même partiel, l'envoi est clos : laisser la newsletter en brouillon
      // inviterait à tout renvoyer, donc à écrire deux fois à ceux qui l'ont
      // déjà reçue. Les adresses en échec repartent dans la réponse, et se
      // rattrapent en les collant dans « Adresses saisies à la main ».
      const marque = newsletter && sent > 0
        ? await markSent(newsletter.id, sent, null)
        : { done: false, warning: null as string | null }

      return NextResponse.json({
        success: true,
        mode: 'transactional',
        sent,
        total: contacts.length,
        errors: errors.length > 0 ? errors : undefined,
        failedRecipients: failed.length > 0 ? failed : undefined,
        newsletterStatus: marque.done ? 'sent' : undefined,
        warning: marque.warning || undefined
      })
    }

    // Campagne marketing : un seul HTML pour tout le segment, les balises
    // `{{{contact.*}}}` étant résolues par Resend pour chaque destinataire.
    const segmentId = await getOrCreateSegment(segmentName)
    const { synced, errors: syncErrors } = await syncContactsToSegment(contacts, segmentId)

    const broadcast = await createAndSendBroadcast({
      segmentId,
      from: from || process.env.RESEND_FROM || '',
      subject,
      html: injectFooter(html, getBroadcastFooterHtml()),
      text,
      name: `${segmentName} (${new Date().toISOString().slice(0, 10)})`
    })

    const marque = newsletter
      ? await markSent(newsletter.id, contacts.length, broadcast.id)
      : { done: false, warning: null as string | null }

    return NextResponse.json({
      success: true,
      mode: 'broadcast',
      broadcastId: broadcast.id,
      totalContacts: contacts.length,
      synced,
      syncErrors: syncErrors.length > 0 ? syncErrors : undefined,
      newsletterStatus: marque.done ? 'sent' : undefined,
      warning: marque.warning || undefined
    })
  } catch (error: any) {
    console.error('Mailing send error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}

/**
 * Envoi un par un via l'API transactionnelle. Les balises Resend n'y sont pas
 * résolues : on les remplace nous-mêmes, sinon le destinataire lirait
 * `{{{contact.first_name}}}` en toutes lettres.
 */
async function sendDirect(
  contacts: Contact[],
  payload: {
    subject: string
    html: string
    text?: string
    from?: string
    tags?: string[]
    attachments?: any[]
  }
): Promise<{ sent: number; errors: string[]; failed: string[] }> {
  let sent = 0
  const errors: string[] = []
  // Les adresses seules, en plus du message d'erreur : c'est ce qu'on recolle
  // dans « Adresses saisies à la main » pour rattraper un envoi partiel.
  const failed: string[] = []

  for (const contact of contacts) {
    try {
      await sendTransactionalEmail({
        to: contact.email,
        subject: applyMergeTags(payload.subject, contact),
        html: applyMergeTags(payload.html, contact),
        text: payload.text ? applyMergeTags(payload.text, contact) : undefined,
        from: payload.from,
        tags: payload.tags,
        attachments: payload.attachments
      })
      sent++
    } catch (err: any) {
      errors.push(`${contact.email}: ${err.message}`)
      failed.push(contact.email)
    }
    // Petite pause pour rester sous la limite de débit de Resend.
    if (contacts.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return { sent, errors, failed }
}

/**
 * Clôt la newsletter, une fois le message accepté par Resend.
 *
 * Le client Supabase renvoie l'erreur plutôt que de la lever : sans ce
 * contrôle, un échec d'écriture laissait la newsletter en brouillon alors que
 * les abonnés l'avaient déjà reçue, et un second clic l'envoyait une deuxième
 * fois à toute la liste.
 *
 * L'échec n'est pas relayé comme une erreur d'envoi, ce qu'il n'est pas : le
 * message est parti. Il ressort en avertissement, pour que l'interface le dise
 * sans laisser croire qu'il faut recommencer.
 */
async function markSent(
  id: string,
  sentCount: number,
  broadcastId: string | null
): Promise<{ done: boolean; warning: string | null }> {
  // `.select()` est indispensable : sans lui, une mise à jour qui ne touche
  // aucune ligne (newsletter supprimée entre-temps) ne remonte aucune erreur.
  // C'est la ligne rendue, et non l'absence d'erreur, qui prouve l'écriture.
  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      broadcast_id: broadcastId
    })
    .eq('id', id)
    .select('id')

  if (error || !data || data.length === 0) {
    console.error(
      `Newsletter ${id} envoyée, mais son état n'a pas pu être enregistré :`,
      error?.message || 'aucune ligne mise à jour'
    )
    return {
      done: false,
      warning:
        'La newsletter est bien partie, mais son état n’a pas pu être enregistré en base. Ne la renvoyez pas : marquez-la manuellement comme envoyée.'
    }
  }

  return { done: true, warning: null }
}
