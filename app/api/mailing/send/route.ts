import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { sendTransactionalEmail } from '@/lib/mailing'
import { getBroadcastFooterHtml } from '@/lib/email-footer'
import { getOrCreateSegment, syncContactsToSegment, createAndSendBroadcast } from '@/lib/resend-marketing'
import { supabaseAdmin } from '@/lib/supabase-server'

// Synchroniser plusieurs centaines de contacts vers Resend (séquentiel, ~4 req/s)
// peut prendre plusieurs minutes pour les grands segments.
export const maxDuration = 280

interface Contact {
  email: string
  firstName?: string | null
  lastName?: string | null
}

function splitName(fullName?: string | null): { firstName: string | null; lastName: string | null } {
  const trimmed = fullName?.trim()
  if (!trimmed) return { firstName: null, lastName: null }
  const [first, ...rest] = trimmed.split(/\s+/)
  return { firstName: first, lastName: rest.join(' ') || null }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { to, subject, html, text, from, tags, attachments, audienceMode, subscriptionFilter } = body

    if (!subject || !html) {
      return NextResponse.json({ error: 'Sujet et contenu HTML sont requis.' }, { status: 400 })
    }

    // Envois en masse (segment ou tous les inscrits) -> API Marketing Resend
    // (Broadcasts), pour ne jamais consommer le quota transactionnel partagé avec
    // les emails critiques (bienvenue, facture, confirmation d'abonnement...).
    if (audienceMode === 'all' || audienceMode === 'subscription') {
      let contacts: Contact[] = []
      let segmentName = ''

      // RGPD: Only send to users who have newsletter_opt_in = true for bulk sends
      if (audienceMode === 'all') {
        const { data: profiles, error } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .not('email', 'is', null)
          .eq('newsletter_opt_in', true)

        if (error) throw new Error('Erreur lors de la récupération des emails')
        contacts = (profiles || []).map((p) => ({ email: p.email as string, ...splitName(p.full_name) }))
        segmentName = 'Newsletter - Tous les inscrits'
      } else if (subscriptionFilter === 'newsletter_pre_launch') {
        const { data: rows, error } = await supabaseAdmin
          .from('mail_contacts')
          .select('email, first_name, last_name')
          .eq('status', 'newsletter_pre_launch')
          .not('email', 'is', null)

        if (error) throw new Error('Erreur lors de la récupération des contacts newsletter')
        contacts = (rows || []).map((c) => ({ email: c.email as string, firstName: c.first_name, lastName: c.last_name }))
        segmentName = 'Newsletter pré-lancement'
      } else {
        const { data: profiles, error } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('role', subscriptionFilter)
          .not('email', 'is', null)
          .eq('newsletter_opt_in', true)

        if (error) throw new Error('Erreur lors de la récupération des emails')
        contacts = (profiles || []).map((p) => ({ email: p.email as string, ...splitName(p.full_name) }))
        segmentName = `Newsletter - Rôle ${subscriptionFilter}`
      }

      if (!contacts.length) {
        return NextResponse.json({ error: 'Aucun destinataire trouvé (vérifiez que des utilisateurs ont accepté la newsletter).' }, { status: 400 })
      }

      const segmentId = await getOrCreateSegment(segmentName)
      const { synced, errors: syncErrors } = await syncContactsToSegment(contacts, segmentId)

      const broadcast = await createAndSendBroadcast({
        segmentId,
        from: from || process.env.RESEND_FROM || '',
        subject,
        html: html + getBroadcastFooterHtml(),
        text,
        name: `${segmentName} — ${new Date().toISOString().slice(0, 10)}`
      })

      return NextResponse.json({
        success: true,
        mode: 'broadcast',
        broadcastId: broadcast.id,
        totalContacts: contacts.length,
        synced,
        syncErrors: syncErrors.length > 0 ? syncErrors : undefined
      })
    }

    // Mode manuel : liste explicite de destinataires (volume faible, ad-hoc) —
    // reste sur l'API transactionnelle, avec pied de page/désinscription géré
    // automatiquement par sendTransactionalEmail.
    const recipients = (Array.isArray(to) ? to : String(to || '')
      .split(',')
      .map((email: string) => email.trim())
      .filter(Boolean)) as string[]

    if (!recipients.length) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
    }

    let sent = 0
    const errors: string[] = []

    for (const recipientEmail of recipients) {
      try {
        await sendTransactionalEmail({
          to: recipientEmail,
          subject,
          html,
          text,
          from,
          tags: tags || ['newsletter'],
          attachments
        })
        sent++
      } catch (err: any) {
        errors.push(`${recipientEmail}: ${err.message}`)
      }
      // Small delay to avoid rate limits
      if (recipients.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'transactional',
      sent,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Mailing send error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
