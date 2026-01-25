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
    if (audienceMode === 'all') {
      // Fetch all users' emails
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .not('email', 'is', null)

      if (error) throw new Error('Erreur lors de la récupération des emails')
      recipients = profiles.map(p => p.email).filter(Boolean)
    } else if (audienceMode === 'subscription') {
      // Fetch users by subscription type
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('role', subscriptionFilter)
        .not('email', 'is', null)

      if (error) throw new Error('Erreur lors de la récupération des emails')
      recipients = profiles.map(p => p.email).filter(Boolean)
    } else {
      // Manual mode
      recipients = (Array.isArray(to) ? to : String(to || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)) as string[]
    }

    if (!recipients.length) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
    }

    if (!subject || !html) {
      return NextResponse.json({ error: 'Sujet et contenu HTML sont requis.' }, { status: 400 })
    }

    const result = await sendTransactionalEmail({
      to: recipients,
      subject,
      html,
      text,
      from,
      tags,
      attachments
    })

    return NextResponse.json({ success: true, result, sent: recipients.length })
  } catch (error: any) {
    console.error('Mailing send error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
