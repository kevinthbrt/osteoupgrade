import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { sendTransactionalEmail } from '@/lib/mailing'
import { supabaseAdmin } from '@/lib/supabase-server'

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

    let recipients: string[] = []

    // Handle different audience modes
    // RGPD: Only send to users who have newsletter_opt_in = true for bulk sends
    if (audienceMode === 'all') {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .not('email', 'is', null)
        .eq('newsletter_opt_in', true)

      if (error) throw new Error('Erreur lors de la récupération des emails')
      recipients = profiles.map(p => p.email).filter(Boolean)
    } else if (audienceMode === 'subscription') {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('role', subscriptionFilter)
        .not('email', 'is', null)
        .eq('newsletter_opt_in', true)

      if (error) throw new Error('Erreur lors de la récupération des emails')
      recipients = profiles.map(p => p.email).filter(Boolean)
    } else {
      // Manual mode - admin explicitly chose recipients
      recipients = (Array.isArray(to) ? to : String(to || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)) as string[]
    }

    if (!recipients.length) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé (vérifiez que des utilisateurs ont accepté la newsletter).' }, { status: 400 })
    }

    if (!subject || !html) {
      return NextResponse.json({ error: 'Sujet et contenu HTML sont requis.' }, { status: 400 })
    }

    // Send individually so each recipient gets their own unsubscribe link
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
      sent,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Mailing send error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
