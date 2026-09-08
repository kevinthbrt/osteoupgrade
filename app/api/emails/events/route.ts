import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/emails/events
 *
 * Webhook d'événements Resend (délivré, ouvert, cliqué, rejeté, plainte).
 * À configurer sur https://resend.com/webhooks avec le même secret que le
 * webhook de réception (`RESEND_WEBHOOK_SECRET`).
 *
 * Sans lui, le module de suivi saurait qu'un email a été envoyé, jamais s'il
 * a été lu : c'est pourtant la différence entre « il ignore la relance » et
 * « il n'a rien reçu ».
 *
 * Seuls les emails envoyés depuis la fiche client (`customer_emails`) sont
 * concernés : un événement qui ne correspond à aucune ligne est ignoré sans
 * erreur, pour ne pas faire réessayer Resend indéfiniment.
 */
export async function POST(request: Request) {
  const payload = await request.text()

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')
  const secret = process.env.RESEND_WEBHOOK_SECRET

  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET non configuré')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
  }

  try {
    new Webhook(secret).verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messageId: string | undefined = event?.data?.email_id || event?.data?.id
  if (!messageId) return NextResponse.json({ received: true, ignored: 'no email id' })

  const { data: ligne } = await supabaseAdmin
    .from('customer_emails')
    .select('id, status, open_count, click_count, opened_at, clicked_at')
    .eq('provider_message_id', messageId)
    .maybeSingle()

  if (!ligne) return NextResponse.json({ received: true, ignored: 'unknown message' })

  const maintenant = new Date(event?.created_at || Date.now()).toISOString()
  const patch: Record<string, any> = {}

  switch (event.type) {
    case 'email.delivered':
      patch.delivered_at = ligne.status === 'sent' ? maintenant : undefined
      // Un email déjà ouvert ne redevient pas « seulement délivré » : le
      // statut ne recule jamais, les événements pouvant arriver désordonnés.
      if (ligne.status === 'sent') patch.status = 'delivered'
      break
    case 'email.opened':
      patch.open_count = (ligne.open_count || 0) + 1
      patch.opened_at = ligne.opened_at || maintenant
      if (ligne.status === 'sent' || ligne.status === 'delivered') patch.status = 'opened'
      break
    case 'email.clicked':
      patch.click_count = (ligne.click_count || 0) + 1
      patch.clicked_at = ligne.clicked_at || maintenant
      if (ligne.status !== 'bounced' && ligne.status !== 'complained') patch.status = 'clicked'
      break
    case 'email.bounced':
      patch.status = 'bounced'
      patch.error = event?.data?.reason || 'Rejeté par le serveur destinataire'
      break
    case 'email.complained':
      patch.status = 'complained'
      break
    default:
      return NextResponse.json({ received: true, ignored: event.type })
  }

  for (const cle of Object.keys(patch)) {
    if (patch[cle] === undefined) delete patch[cle]
  }

  if (Object.keys(patch).length) {
    const { error } = await supabaseAdmin.from('customer_emails').update(patch).eq('id', ligne.id)
    if (error) console.error('[resend-events] update failed:', error.message)
  }

  return NextResponse.json({ received: true })
}
