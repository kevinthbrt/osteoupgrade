import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/emails/inbound
 * Webhook to receive inbound emails from Resend
 *
 * Configure this webhook in Resend Dashboard:
 * https://resend.com/inbound
 *
 * Webhook URL: https://your-domain.com/api/emails/inbound
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('📧 Received inbound email webhook from Resend:', {
      from: body.from,
      to: body.to,
      subject: body.subject,
      messageId: body.message_id
    })

    // Extract email data from Resend webhook payload
    const {
      from,
      to,
      subject,
      html,
      text,
      message_id,
      email_id,
      headers,
      attachments
    } = body

    // Validate required fields
    if (!from || !to || !subject) {
      console.error('❌ Missing required fields in webhook payload')
      return NextResponse.json(
        { error: 'Missing required fields: from, to, or subject' },
        { status: 400 }
      )
    }

    // Parse "from" field (can be "Name <email@domain.com>" or just "email@domain.com")
    const fromMatch = from.match(/(.*?)?<?([^>]+@[^>]+)>?/)
    const fromName = fromMatch?.[1]?.trim() || null
    const fromEmail = fromMatch?.[2]?.trim() || from

    // Parse "to" field
    const toMatch = to.match(/(.*?)?<?([^>]+@[^>]+)>?/)
    const toEmail = toMatch?.[2]?.trim() || to

    // Auto-categorize based on sender or content
    let category = 'general'
    const lowerSubject = subject.toLowerCase()
    const lowerFrom = fromEmail.toLowerCase()

    if (lowerSubject.includes('parrain') || lowerSubject.includes('référal') || lowerSubject.includes('commission')) {
      category = 'parrainage'
    } else if (lowerSubject.includes('support') || lowerSubject.includes('aide') || lowerSubject.includes('problème')) {
      category = 'support'
    } else if (lowerFrom.includes('spam') || lowerSubject.includes('viagra') || lowerSubject.includes('casino')) {
      category = 'spam'
    }

    // Process attachments to extract relevant info
    const processedAttachments = (attachments || []).map((att: any) => ({
      filename: att.filename,
      contentType: att.content_type,
      size: att.size,
      contentId: att.content_id,
      // Note: Resend doesn't send the actual file content in webhooks
      // You need to fetch it separately using their API if needed
    }))

    // Insert email into database
    const { data: insertedEmail, error: insertError } = await supabaseAdmin
      .from('received_emails')
      .insert({
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmail,
        subject: subject,
        html_content: html || null,
        text_content: text || null,
        resend_message_id: message_id || null,
        resend_email_id: email_id || null,
        headers: headers || {},
        attachments: processedAttachments,
        category: category,
        is_read: false,
        is_archived: false,
        received_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting email into database:', insertError)
      return NextResponse.json(
        { error: 'Failed to store email', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ Email stored successfully:', {
      id: insertedEmail.id,
      from: fromEmail,
      subject: subject,
      category: category
    })

    // TODO: Send notification to admin if important category
    if (category === 'parrainage' || category === 'support') {
      // Could trigger a push notification or browser notification here
      console.log('📬 Important email received in category:', category)
    }

    return NextResponse.json({
      success: true,
      emailId: insertedEmail.id,
      category: category
    })
  } catch (error: any) {
    console.error('❌ Error processing inbound email webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/emails/inbound
 * Returns information about the webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    webhook: 'Resend Inbound Email Webhook',
    status: 'active',
    instructions: 'Configure this webhook URL in your Resend dashboard at https://resend.com/inbound',
    url: `${process.env.NEXT_PUBLIC_URL || 'https://your-domain.com'}/api/emails/inbound`
  })
}
