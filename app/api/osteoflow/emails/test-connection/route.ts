import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

/**
 * POST /api/osteoflow/emails/test-connection
 *
 * Tests SMTP and/or IMAP connections using user-provided credentials.
 * Does NOT store any credentials.
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
    const { type, settings } = body

    if (type === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      })

      try {
        await transporter.verify()
        transporter.close()
        return NextResponse.json({ success: true })
      } catch (error) {
        transporter.close()
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'SMTP connection failed',
        })
      }
    }

    if (type === 'imap') {
      // Dynamic import for imapflow (only when needed)
      const { ImapFlow } = await import('imapflow')
      const client = new ImapFlow({
        host: settings.imap_host,
        port: settings.imap_port,
        secure: settings.imap_secure,
        auth: {
          user: settings.imap_user,
          pass: settings.imap_password,
        },
        logger: false,
      })

      try {
        await client.connect()
        await client.logout()
        return NextResponse.json({ success: true })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'IMAP connection failed',
        })
      }
    }

    return NextResponse.json({ error: 'Invalid type. Use "smtp" or "imap".' }, { status: 400 })
  } catch (error) {
    console.error('[Osteoflow test-connection] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 500 }
    )
  }
}
