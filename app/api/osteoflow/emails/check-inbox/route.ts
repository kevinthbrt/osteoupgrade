import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST /api/osteoflow/emails/check-inbox
 *
 * IMAP proxy for Osteoflow web.
 * Receives IMAP credentials from browser, fetches new emails,
 * returns them to the client for local storage.
 * Does NOT store credentials or emails server-side.
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['premium_gold', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Premium Gold required' }, { status: 403 })
    }

    const body = await request.json()
    const { imapSettings, lastSyncUid } = body

    if (!imapSettings) {
      return NextResponse.json({ error: 'Missing IMAP settings' }, { status: 400 })
    }

    const { ImapFlow } = await import('imapflow')
    const client = new ImapFlow({
      host: imapSettings.imap_host,
      port: imapSettings.imap_port,
      secure: imapSettings.imap_secure,
      auth: {
        user: imapSettings.imap_user,
        pass: imapSettings.imap_password,
      },
      logger: false,
    })

    await client.connect()

    const lock = await client.getMailboxLock('INBOX')
    const emails: Array<{
      uid: number
      from: string
      to: string
      subject: string
      date: string
      text: string
      html: string
      messageId: string
    }> = []

    try {
      // Fetch messages newer than lastSyncUid
      const searchCriteria = lastSyncUid && lastSyncUid > 0
        ? `${lastSyncUid + 1}:*`
        : '1:*'

      for await (const message of client.fetch(searchCriteria, {
        uid: true,
        envelope: true,
        source: false,
        bodyStructure: true,
      })) {
        if (message.uid <= (lastSyncUid || 0)) continue

        const envelope = message.envelope
        emails.push({
          uid: message.uid,
          from: envelope.from?.[0]?.address || '',
          to: envelope.to?.[0]?.address || '',
          subject: envelope.subject || '',
          date: envelope.date?.toISOString() || new Date().toISOString(),
          text: '',
          html: '',
          messageId: envelope.messageId || '',
        })

        // Limit to 50 emails per sync
        if (emails.length >= 50) break
      }
    } finally {
      lock.release()
    }

    await client.logout()

    return NextResponse.json({
      success: true,
      emails,
      maxUid: emails.length > 0 ? Math.max(...emails.map(e => e.uid)) : lastSyncUid || 0,
    })
  } catch (error) {
    console.error('[Osteoflow IMAP proxy] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check inbox',
      },
      { status: 500 }
    )
  }
}
