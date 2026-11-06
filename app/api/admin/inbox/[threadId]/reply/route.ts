import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { logCustomerEvent } from '@/lib/customer-events'
import { planLabel, planOf } from '@/lib/entitlements'
import { findProfileByEmail, getInboxSettings, getThreadHead, outboundThreadHead, resolveAttachments } from '@/lib/inbox'
import {
  guessFirstName,
  htmlToText,
  mergeVariables,
  renderReplyHtml,
  renderReplyText,
  replySubject,
  type InboxLayout,
} from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'

const OWN_DOMAIN = '@osteo-upgrade.fr'

/** Adresse nue d'un expéditeur « Nom <adresse> ». */
function bareAddress(from?: string | null): string | null {
  if (!from) return null
  const m = from.match(/<([^>]+)>/)
  return (m ? m[1] : from).trim() || null
}

/**
 * POST /api/admin/inbox/[threadId]/reply
 *
 * Répond au dernier message de la conversation, dans le même fil :
 *   * expédié depuis l'adresse qui a reçu le message (contact@, admin@…),
 *     avec `Reply-To` sur cette même adresse pour que la suite revienne ici ;
 *   * `In-Reply-To` et `References` vers le message d'origine, pour que le
 *     client mail du destinataire range la réponse dans la conversation ;
 *   * signature ajoutée automatiquement, citation du message d'origine en
 *     option ;
 *   * sans pied de désinscription : c'est une réponse personnelle à un
 *     message reçu, pas un envoi marketing.
 *
 * La réponse est enregistrée (`inbox_replies`) et la conversation passe en
 * « en attente du client » (ou « traité » si demandé).
 */
export async function POST(request: Request, { params }: { params: { threadId: string } }) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = await request.json().catch(() => ({}))
  const corps = typeof payload.body === 'string' ? payload.body.trim() : ''
  const layout: InboxLayout = payload.layout === 'brand' ? 'brand' : 'simple'
  const markAs = payload.markAs === 'done' ? 'done' : 'waiting'
  const includeQuote = payload.includeQuote !== false

  if (!corps) return NextResponse.json({ error: 'Le message est vide.' }, { status: 400 })
  if (/\[À COMPLÉTER/i.test(corps)) {
    return NextResponse.json({ error: 'Le brouillon contient encore un passage « À COMPLÉTER ».' }, { status: 400 })
  }

  const tete: any = (await getThreadHead(params.threadId)) || (await outboundThreadHead(params.threadId))
  if (!tete) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const settings = await getInboxSettings()
  const destinataire = (typeof payload.to === 'string' && payload.to.trim()) || tete.from_email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinataire)) {
    return NextResponse.json({ error: 'Adresse du destinataire invalide' }, { status: 400 })
  }
  const sujet = (typeof payload.subject === 'string' && payload.subject.trim()) || replySubject(tete.subject || '')

  const profile = tete.profile_id
    ? (
        await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, plan, role, is_founding_member, created_at')
          .eq('id', tete.profile_id)
          .maybeSingle()
      ).data
    : await findProfileByEmail(destinataire)

  const nomComplet = profile?.full_name || tete.from_name || null
  const texte = mergeVariables(corps, {
    prenom: guessFirstName(nomComplet),
    nom: nomComplet,
    email: destinataire,
    offre: profile ? planLabel(planOf(profile)) : null,
  })

  const quote = includeQuote && tete.id
    ? {
        fromName: tete.from_name,
        fromEmail: tete.from_email,
        receivedAt: tete.received_at,
        text: tete.text_content || (tete.html_content ? htmlToText(tete.html_content) : ''),
      }
    : null

  const renderInput = {
    body: texte,
    signature: settings.signature,
    layout,
    subject: sujet,
    emoji: typeof payload.emoji === 'string' ? payload.emoji : null,
    bannerTitle: typeof payload.bannerTitle === 'string' ? payload.bannerTitle : null,
    quote,
  }
  const html = renderReplyHtml(renderInput)
  const text = renderReplyText(renderInput)

  // Expéditeur : l'adresse qui a reçu le message, si elle est sur notre domaine.
  const adresseRecue = (tete.to_email || '').toLowerCase()
  const adresse = adresseRecue.endsWith(OWN_DOMAIN) ? adresseRecue : bareAddress(process.env.RESEND_FROM)
  const from = adresse ? `${settings.from_name} <${adresse}>` : undefined

  const references = [...(tete.references_ids || []), tete.resend_message_id].filter(Boolean) as string[]
  const headers: Record<string, string> = {}
  if (tete.resend_message_id) headers['In-Reply-To'] = tete.resend_message_id
  if (references.length) headers['References'] = references.slice(-20).join(' ')

  let pieces: Awaited<ReturnType<typeof resolveAttachments>>
  try {
    pieces = await resolveAttachments(payload.attachments)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const now = new Date().toISOString()
  const ligne = {
    email_id: tete.id,
    thread_id: params.threadId,
    to_email: destinataire,
    from_email: adresse,
    subject: sujet,
    body_text: texte,
    html,
    layout,
    attachments: pieces.stored,
    template_id: typeof payload.templateId === 'string' && payload.templateId ? payload.templateId : null,
    sent_by: admin.id,
  }

  try {
    const envoi: any = await sendTransactionalEmail({
      to: destinataire,
      from,
      replyTo: adresse || undefined,
      subject: sujet,
      html,
      text,
      headers,
      tags: ['boite-mail'],
      skipUnsubscribeFooter: true,
      attachments: pieces.forResend.length ? pieces.forResend : undefined,
    })

    const { data: reply } = await supabaseAdmin
      .from('inbox_replies')
      .insert({ ...ligne, provider_message_id: envoi?.id || null, status: 'sent' })
      .select('id, email_id, to_email, from_email, subject, body_text, html, layout, attachments, status, error, created_at, sent_by')
      .single()

    await supabaseAdmin
      .from('received_emails')
      .update({ status: markAs, status_changed_at: now, replied_at: now, is_read: true })
      .eq('thread_id', params.threadId)

    if (profile) {
      await logCustomerEvent({
        userId: profile.id,
        email: destinataire,
        type: 'admin_email',
        source: 'admin',
        metadata: { sujet, origine: 'boite_mail', thread_id: params.threadId },
      })
    }

    return NextResponse.json({ success: true, reply, status: markAs })
  } catch (err: any) {
    // L'échec reste visible dans la conversation : sinon on croit avoir
    // répondu à quelqu'un qui n'a rien reçu.
    await supabaseAdmin.from('inbox_replies').insert({
      ...ligne,
      status: 'failed',
      error: String(err?.message || err).slice(0, 500),
    })
    return NextResponse.json({ error: err?.message || 'Échec de l’envoi' }, { status: 502 })
  }
}
