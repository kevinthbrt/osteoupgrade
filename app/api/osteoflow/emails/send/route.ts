import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

/**
 * POST /api/osteoflow/emails/send
 *
 * SMTP proxy for Osteoflow web.
 * Receives email credentials + email data from the browser client,
 * sends the email via nodemailer, and does NOT store credentials.
 *
 * This replaces the Electron desktop's local SMTP sending.
 */
export async function POST(request: Request) {
  try {
    // Verify the user is authenticated and has Premium Gold
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
    const { smtpSettings, email } = body

    if (!smtpSettings || !email) {
      return NextResponse.json({ error: 'Missing smtpSettings or email data' }, { status: 400 })
    }

    // Create transporter with user-provided credentials (NOT stored)
    const transporter = nodemailer.createTransport({
      host: smtpSettings.smtp_host,
      port: smtpSettings.smtp_port,
      secure: smtpSettings.smtp_secure,
      auth: {
        user: smtpSettings.smtp_user,
        pass: smtpSettings.smtp_password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    })

    const fromAddress = smtpSettings.from_name
      ? `"${smtpSettings.from_name}" <${smtpSettings.from_email}>`
      : smtpSettings.from_email

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo || smtpSettings.from_email,
      attachments: email.attachments,
    })

    transporter.close()

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error('[Osteoflow SMTP proxy] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    )
  }
}
