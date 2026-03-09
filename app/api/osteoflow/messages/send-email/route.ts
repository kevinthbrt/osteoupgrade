import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { Resend } = await import('resend')
    const { createClient, createServiceClient } = await import('@/lib/osteoflow/db/server')
    const { sendEmail, createHtmlEmail } = await import('@/lib/osteoflow/email/smtp-service')
    const getResend = () => new Resend(process.env.RESEND_API_KEY)

    const { conversationId, patientEmail, patientName, content } = await request.json()
    if (!conversationId || !patientEmail || !content) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: practitioner } = await db.from('practitioners').select('*').eq('user_id', user.id).single()
    if (!practitioner) return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 })

    const subject = `Message de ${practitioner.practice_name || `${practitioner.first_name} ${practitioner.last_name}`}`
    let emailMessageId: string | undefined

    const serviceClient = await createServiceClient()
    const { data: emailSettings } = await serviceClient.from('email_settings').select('*').eq('practitioner_id', practitioner.id).eq('is_verified', true).single()

    if (emailSettings) {
      const emailContent = `Bonjour ${patientName},\n\n${content}`
      const htmlEmail = createHtmlEmail(emailContent, practitioner)
      const result = await sendEmail(
        { smtp_host: emailSettings.smtp_host, smtp_port: emailSettings.smtp_port, smtp_secure: emailSettings.smtp_secure, smtp_user: emailSettings.smtp_user, smtp_password: emailSettings.smtp_password, from_name: emailSettings.from_name, from_email: emailSettings.from_email },
        { to: patientEmail, subject, html: htmlEmail }
      )
      if (!result.success) return NextResponse.json({ error: `Erreur SMTP: ${result.error}` }, { status: 500 })
      emailMessageId = result.messageId
    } else if (process.env.RESEND_API_KEY) {
      const { data: emailData, error: emailError } = await getResend().emails.send({
        from: `${practitioner.first_name} ${practitioner.last_name} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: patientEmail, subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#14b8a6;">${practitioner.practice_name || `Cabinet ${practitioner.last_name}`}</h2><p>Bonjour ${patientName},</p><div style="background:#f9fafb;padding:20px;border-radius:8px;white-space:pre-wrap;">${content}</div></div>`,
      })
      if (emailError) throw emailError
      emailMessageId = emailData?.id
    } else {
      return NextResponse.json({ error: 'Aucun service email configuré.' }, { status: 400 })
    }

    await db.from('messages').insert({ conversation_id: conversationId, content, direction: 'outgoing', channel: 'email', status: 'sent', sent_at: new Date().toISOString(), email_subject: subject, email_message_id: emailMessageId, to_email: patientEmail, from_email: emailSettings?.from_email || practitioner.email })

    return NextResponse.json({ success: true, messageId: emailMessageId })
  } catch (error) {
    console.error('Error in send-email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
