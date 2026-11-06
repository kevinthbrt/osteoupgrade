import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Webhook } from 'svix'
import { randomUUID } from 'crypto'
import { notifyAdmin } from '@/lib/admin-notify'
import { htmlToText } from '@/lib/inbox-render'
import {
  classifyEmail,
  findProfileByEmail,
  findThread,
  getInboxSettings,
  normalizeHeaders,
  normalizeThreadHead,
  parseMessageIds,
  recordRuleHit,
} from '@/lib/inbox'
import { aiAvailable, triageWithAi } from '@/lib/inbox-ai'

// Le tri par l'IA s'ajoute au temps de traitement du webhook.
export const maxDuration = 60

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

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

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
        // Handle format: "Name <email@domain.com>"
        const bracketMatch = value.match(/^(.+?)\s*<([^>]+)>$/)
        if (bracketMatch) {
          return {
            name: bracketMatch[1].trim() || null,
            email: bracketMatch[2].trim(),
          }
        }

        // Handle format: "<email@domain.com>" (no name)
        const emailOnlyBracket = value.match(/^<([^>]+)>$/)
        if (emailOnlyBracket) {
          return {
            name: null,
            email: emailOnlyBracket[1].trim(),
          }
        }

        // Handle format: "email@domain.com" (plain email)
        // Simple email validation
        if (value.includes('@')) {
          return {
            name: null,
            email: value.trim(),
          }
        }

        // Fallback: treat as email
        return {
          name: null,
          email: value.trim(),
        }
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

    // Try multiple possible field names for HTML content
    const html =
      emailPayload?.html ??
      emailPayload?.html_body ??
      emailPayload?.htmlBody ??
      emailPayload?.html_content ??
      emailPayload?.body?.html ??
      emailPayload?.body?.html_body ??
      null

    // Try multiple possible field names for text content
    const text =
      emailPayload?.text ??
      emailPayload?.text_body ??
      emailPayload?.textBody ??
      emailPayload?.text_content ??
      emailPayload?.plain_text ??
      emailPayload?.body?.text ??
      emailPayload?.body?.text_body ??
      emailPayload?.body?.plain ??
      // Fallback: if body is a string, use it as text
      (typeof emailPayload?.body === 'string' ? emailPayload.body : null)

    const message_id = emailPayload?.message_id ?? emailPayload?.messageId
    const email_id = emailPayload?.email_id ?? emailPayload?.emailId
    const headers = emailPayload?.headers ?? {}
    const attachments = emailPayload?.attachments ?? []

    // Enhanced logging to debug content issues
    console.log('📧 Email content extraction:', {
      hasHtml: !!html,
      hasText: !!text,
      htmlLength: html?.length || 0,
      textLength: text?.length || 0,
      availableFields: Object.keys(emailPayload || {}),
      bodyType: typeof emailPayload?.body,
      bodyKeys: emailPayload?.body ? Object.keys(emailPayload.body) : []
    })

    // Le webhook ne transporte ni les en-têtes ni, souvent, le contenu : on
    // relit le message complet via l'API Resend. Les en-têtes servent à
    // rattacher une réponse à sa conversation (In-Reply-To, References) et à
    // reconnaître les réponses automatiques (Auto-Submitted).
    let finalHtml = html
    let finalText = text
    let rawHeaders: unknown = headers

    const resendApiKey = process.env.RESEND_API_KEY
    if (email_id && resendApiKey) {
      try {
        const response = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const emailData = await response.json()
          finalHtml = finalHtml || emailData.html || null
          finalText = finalText || emailData.text || null
          if (emailData.headers && Object.keys(normalizeHeaders(emailData.headers)).length) {
            rawHeaders = emailData.headers
          }
        } else {
          console.error('❌ Failed to fetch email from Resend API:', response.status, response.statusText)
        }
      } catch (error: any) {
        console.error('❌ Error fetching email from Resend API:', error.message)
      }
    }

    if (!finalHtml && !finalText) {
      console.warn('⚠️  No email content found after webhook and API check.')
    }

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
    const normalizedHeaders = normalizeHeaders(rawHeaders)
    const plainText = finalText || (finalHtml ? htmlToText(finalHtml) : '')

    // Idempotence : Resend peut rejouer un webhook.
    if (message_id) {
      const { data: deja } = await supabaseAdmin
        .from('received_emails')
        .select('id')
        .eq('resend_message_id', message_id)
        .limit(1)
      if (deja?.[0]) {
        return NextResponse.json({ success: true, emailId: deja[0].id, duplicate: true })
      }
    }

    const profile = await findProfileByEmail(fromEmail)
    const inReplyTo = parseMessageIds(normalizedHeaders['in-reply-to'])[0] || null
    const references = parseMessageIds(normalizedHeaders['references'])

    // Conversation existante ?
    const thread = await findThread({
      fromEmail,
      subject,
      messageIds: [...(inReplyTo ? [inReplyTo] : []), ...references],
    })

    // Classement
    const settings = await getInboxSettings()
    const classification = await classifyEmail({
      fromEmail,
      fromName,
      subject,
      text: plainText,
      headers: normalizedHeaders,
      isKnownCustomer: Boolean(profile),
    })

    let category = classification.category
    let status = classification.status
    let categorySource: string = classification.source
    let categoryReason = classification.reason
    let aiSummary: string | null = null

    // Une réponse dans un fil garde la catégorie du fil (surtout si elle a été
    // choisie à la main), sauf si le nouveau message est clairement autre chose.
    if (thread && category !== 'spam' && category !== 'notification' && classification.source !== 'rule') {
      if (thread.category !== 'general' || thread.category_source === 'manual') {
        category = thread.category
        categorySource = thread.category_source === 'manual' ? 'manual' : categorySource
        categoryReason = 'Suite d’une conversation'
      }
      status = 'todo'
    }

    // L'IA tranche quand le tri déterministe hésite, et résume ce qui mérite
    // d'être lu.
    if (settings.ai_enabled && aiAvailable() && category !== 'spam' && category !== 'notification') {
      const triage = await triageWithAi({
        fromEmail,
        fromName,
        subject,
        text: plainText,
        isKnownCustomer: Boolean(profile),
        heuristicHint: `${classification.category} (${classification.reason})`,
      })
      if (triage) {
        aiSummary = triage.summary || null
        if (!classification.confident && !thread && classification.source !== 'rule') {
          category = profile && (triage.category === 'spam' || triage.category === 'prospection') ? category : triage.category
          categorySource = 'ai'
          categoryReason = 'Classé par l’IA'
          status = category === 'spam' || category === 'notification' || category === 'prospection' || !triage.needs_reply ? 'done' : 'todo'
        }
      }
    }

    if (classification.ruleId) await recordRuleHit(classification.ruleId)

    // Process attachments to extract relevant info
    const processedAttachments = (attachments || []).map((att: any) => ({
      id: att.id, // Resend attachment ID - needed to fetch the file
      filename: att.filename,
      contentType: att.content_type,
      size: att.size,
      contentId: att.content_id,
    }))

    const now = new Date().toISOString()
    const threadId = thread?.thread_id || randomUUID()

    // Le nouveau message devient la tête de la conversation.
    if (thread) {
      await supabaseAdmin
        .from('received_emails')
        .update({ is_latest: false })
        .eq('thread_id', threadId)
        .eq('is_latest', true)
    }

    const { data: insertedEmail, error: insertError } = await supabaseAdmin
      .from('received_emails')
      .insert({
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmail,
        subject: subject,
        html_content: finalHtml || null,
        text_content: finalText || null,
        resend_message_id: message_id || null,
        resend_email_id: email_id || null,
        headers: normalizedHeaders,
        attachments: processedAttachments,
        category,
        category_source: categorySource,
        category_reason: categoryReason,
        ai_summary: aiSummary,
        status,
        status_changed_at: now,
        thread_id: threadId,
        is_latest: true,
        profile_id: profile?.id || null,
        in_reply_to: inReplyTo,
        references_ids: references,
        is_read: false,
        is_archived: false,
        received_at: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting email into database:', insertError)
      // Remet l'ancienne tête de fil en place.
      if (thread) await normalizeThreadHead(threadId)
      return NextResponse.json(
        { error: 'Failed to store email', details: insertError.message },
        { status: 500 }
      )
    }

    // Une seule tête par conversation, même si une autre réception du même
    // fil s'est intercalée entre la mise à jour et l'insertion.
    if (thread) await normalizeThreadHead(threadId)

    console.log('✅ Email stored successfully:', { id: insertedEmail.id, from: fromEmail, category, status })

    // Cloche admin : seulement ce qui attend une réponse, dans les catégories
    // choisies, ou venant d'un client. Le reste (spam, notifications,
    // prospection) rendrait la cloche inutilisable.
    if (status === 'todo' && (settings.notify_categories.includes(category) || profile)) {
      await notifyAdmin(
        'inbox',
        `${thread ? 'Nouvelle réponse' : 'Nouvel email'} de ${fromName || fromEmail}`,
        aiSummary || subject
      )
    }

    return NextResponse.json({
      success: true,
      emailId: insertedEmail.id,
      category,
      status,
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
