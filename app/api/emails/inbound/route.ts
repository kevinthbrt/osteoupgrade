import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Webhook } from 'svix'

/**
 * POST /api/emails/inbound
 * Webhook to receive inbound emails from Resend
 *
 * Configure this webhook in Resend Dashboard:
 * https://resend.com/inbound
 *
 * Webhook URL: https://your-domain.com/api/emails/inbound
 * Signing Secret: Get from Resend Dashboard and add to RESEND_WEBHOOK_SECRET env var
 */
export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const payload = await request.text()

    // Get Svix headers for signature verification
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    // Verify webhook signature if RESEND_WEBHOOK_SECRET is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    if (webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('❌ Missing Svix headers for webhook verification')
        return NextResponse.json(
          { error: 'Missing Svix headers' },
          { status: 400 }
        )
      }

      const wh = new Webhook(webhookSecret)

      try {
        // Verify the webhook signature
        wh.verify(payload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
        console.log('✅ Webhook signature verified')
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message)
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('⚠️  RESEND_WEBHOOK_SECRET not configured - skipping signature verification')
    }

    // Parse the verified payload
    const body = JSON.parse(payload)

    const emailPayload = body?.data?.email ?? body?.data ?? body

    console.log('📧 Received inbound email webhook from Resend:', {
      from: emailPayload?.from ?? emailPayload?.sender,
      to: emailPayload?.to ?? emailPayload?.recipients,
      subject: emailPayload?.subject,
      messageId: emailPayload?.message_id ?? emailPayload?.messageId
    })

    // Extract email data from Resend webhook payload

    const resolveAddress = (
      value: unknown
    ): { name: string | null; email: string | null } => {
      if (!value) {
        return { name: null, email: null }
      }

      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.includes('<') && trimmed.includes('>')) {
          const match = trimmed.match(/^\s*([^<]*)<\s*([^>]+)\s*>\s*$/)
          return {
            name: match?.[1]?.trim() || null,
            email: match?.[2]?.trim() || null,
          }
        }

        const emailMatch = trimmed.match(/([^\s<>]+@[^\s<>]+)/)
        if (emailMatch) {
          const email = emailMatch[1].trim()
          const name = trimmed.replace(emailMatch[1], '').trim()
          return {
            name: name || null,
            email,
          }
        }

        return { name: null, email: trimmed || null }
      }

      if (Array.isArray(value)) {
        const [first] = value
        return resolveAddress(first)
      }

      if (typeof value === 'object') {
        const record = value as { email?: string; name?: string; address?: string }
        const email = record.email || record.address || null
        return { name: record.name || null, email }
      }

      return { name: null, email: null }
    }

    const fromResolved = resolveAddress(
      emailPayload?.from ?? emailPayload?.sender ?? emailPayload?.headers?.from
    )
    const toResolved = resolveAddress(
      emailPayload?.to ?? emailPayload?.recipients ?? emailPayload?.headers?.to
    )

    const subject =
      emailPayload?.subject ??
      emailPayload?.headers?.subject ??
      emailPayload?.headers?.Subject
    const getContentValue = (value: unknown): string | null => {
      if (typeof value === 'string') {
        return value
      }

      if (value && typeof value === 'object' && 'value' in value) {
        const record = value as { value?: string }
        return typeof record.value === 'string' ? record.value : null
      }

      return null
    }

    const html =
      getContentValue(emailPayload?.html) ??
      getContentValue(emailPayload?.body?.html) ??
      getContentValue(emailPayload?.content?.html) ??
      getContentValue(emailPayload?.payload?.html)
    const text =
      getContentValue(emailPayload?.text) ??
      getContentValue(emailPayload?.body?.text) ??
      getContentValue(emailPayload?.content?.text) ??
      getContentValue(emailPayload?.payload?.text)
    const message_id = emailPayload?.message_id ?? emailPayload?.messageId
    const email_id = emailPayload?.email_id ?? emailPayload?.emailId
    const headers = emailPayload?.headers ?? {}
    const attachments = emailPayload?.attachments ?? []

    // Validate required fields
    if (!fromResolved.email || !toResolved.email || !subject) {
      console.error('❌ Missing required fields in webhook payload')
      return NextResponse.json(
        {
          error: 'Missing required fields: from, to, or subject',
          availableKeys: Object.keys(emailPayload || {}),
        },
        { status: 400 }
      )
    }

    const fromName = fromResolved.name
    const fromEmail = fromResolved.email || ''
    const toEmail = toResolved.email || ''

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
