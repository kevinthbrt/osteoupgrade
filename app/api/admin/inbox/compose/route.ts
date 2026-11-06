import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { planLabel, planOf } from '@/lib/entitlements'
import { findProfileByEmail, getInboxSettings } from '@/lib/inbox'
import { guessFirstName, mergeVariables, renderReplyHtml, renderReplyText, type InboxLayout } from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'

/** Adresse d'envoi des nouveaux messages, et de retour des réponses. */
const CONTACT_ADDRESS = process.env.INBOX_FROM_ADDRESS || 'contact@osteo-upgrade.fr'

/**
 * POST /api/admin/inbox/compose
 *
 * Nouveau message (hors conversation existante). Il ouvre un fil : si le
 * destinataire répond, sa réponse s'y rattache.
 */
export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = await request.json().catch(() => ({}))
  const to = typeof payload.to === 'string' ? payload.to.trim() : ''
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
  const corps = typeof payload.body === 'string' ? payload.body.trim() : ''
  const layout: InboxLayout = payload.layout === 'brand' ? 'brand' : 'simple'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return NextResponse.json({ error: 'Adresse invalide' }, { status: 400 })
  if (!subject || !corps) return NextResponse.json({ error: 'Objet et message requis' }, { status: 400 })
  if (/\[À COMPLÉTER/i.test(corps)) {
    return NextResponse.json({ error: 'Le message contient encore un passage « À COMPLÉTER ».' }, { status: 400 })
  }

  const [settings, profile] = await Promise.all([getInboxSettings(), findProfileByEmail(to)])
  const texte = mergeVariables(corps, {
    prenom: guessFirstName(profile?.full_name),
    nom: profile?.full_name,
    email: to,
    offre: profile ? planLabel(planOf(profile)) : null,
  })
  const renderInput = {
    body: texte,
    signature: settings.signature,
    layout,
    subject,
    emoji: typeof payload.emoji === 'string' ? payload.emoji : null,
    bannerTitle: typeof payload.bannerTitle === 'string' ? payload.bannerTitle : null,
    quote: null,
  }
  const html = renderReplyHtml(renderInput)
  const threadId = randomUUID()
  const ligne = {
    thread_id: threadId,
    to_email: to,
    from_email: CONTACT_ADDRESS,
    subject,
    body_text: texte,
    html,
    layout,
    template_id: typeof payload.templateId === 'string' && payload.templateId ? payload.templateId : null,
    sent_by: admin.id,
  }

  try {
    const envoi: any = await sendTransactionalEmail({
      to,
      from: `${settings.from_name} <${CONTACT_ADDRESS}>`,
      replyTo: CONTACT_ADDRESS,
      subject,
      html,
      text: renderReplyText(renderInput),
      tags: ['boite-mail'],
      skipUnsubscribeFooter: true,
    })
    await supabaseAdmin.from('inbox_replies').insert({ ...ligne, provider_message_id: envoi?.id || null, status: 'sent' })
    return NextResponse.json({ success: true, threadId })
  } catch (err: any) {
    await supabaseAdmin.from('inbox_replies').insert({ ...ligne, status: 'failed', error: String(err?.message || err).slice(0, 500) })
    return NextResponse.json({ error: err?.message || 'Échec de l’envoi' }, { status: 502 })
  }
}
