import { getEmailFooterHtml, getUnsubscribeHeaders } from './email-footer'

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  tags?: string[]
  attachments?: {
    filename: string
    content: string
    type?: string
    cid?: string
    content_id?: string
    disposition?: 'inline' | 'attachment'
  }[]
  /** Set to true to skip appending the unsubscribe footer (e.g. for transactional-only emails) */
  skipUnsubscribeFooter?: boolean
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM?.trim()

function normalizeRecipients(recipients: string | string[]): string[] {
  return Array.isArray(recipients) ? recipients : [recipients]
}

function resolveFromAddress(customFrom?: string) {
  const from = customFrom?.trim() || RESEND_FROM
  if (!from) {
    throw new Error('RESEND_FROM est manquant. Configurez un expéditeur vérifié (ex: "OsteoUpgrade <no-reply@osteo-upgrade.fr>")')
  }
  return from
}

/**
 * Inject the unsubscribe footer before </body> or at the end of the HTML.
 */
function injectUnsubscribeFooter(html: string, recipientEmail: string): string {
  const footer = getEmailFooterHtml(recipientEmail)
  // Try to insert before closing </body> tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`)
  }
  // Otherwise append at the end
  return html + footer
}

async function sendWithResend(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const from = resolveFromAddress(payload.from)
  const recipients = normalizeRecipients(payload.to)

  // Convertir les tags en format Resend avec des noms uniques
  const tags = payload.tags?.map((tagValue) => {
    if (tagValue.includes('-')) {
      const parts = tagValue.split('-')
      return { name: `${parts[0]}_id`, value: parts.slice(1).join('-') }
    }
    return { name: 'type', value: tagValue }
  })

  // For marketing/newsletter emails, inject unsubscribe footer and headers
  let finalHtml = payload.html
  let headers: Record<string, string> = {}

  if (!payload.skipUnsubscribeFooter && recipients.length > 0) {
    // Use the first recipient for single sends; for bulk, each email should ideally be sent individually
    const primaryRecipient = recipients[0]
    finalHtml = injectUnsubscribeFooter(payload.html, primaryRecipient)
    headers = getUnsubscribeHeaders(primaryRecipient)
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: payload.subject,
      html: finalHtml,
      text: payload.text,
      tags,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      attachments: payload.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        type: file.type,
        cid: file.cid || file.content_id,
        content_id: file.content_id || file.cid,
        disposition: file.disposition
      }))
    })
  })

  if (!response.ok) {
    let message = `Resend error: ${response.status}`
    try {
      const errorBody = await response.json()
      const detail = errorBody?.message || errorBody?.error || errorBody?.description
      if (detail) {
        message += ` - ${detail}`
      }
    } catch (_) {
      const text = await response.text()
      if (text) {
        message += ` - ${text}`
      }
    }

    if (response.status === 422 && message.toLowerCase().includes('from')) {
      message += ' | Vérifiez que votre domaine est validé dans Resend et que RESEND_FROM correspond à ce domaine.'
    }

    throw new Error(message)
  }

  return response.json()
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error('No email provider configured. Set RESEND_API_KEY first.')
  }

  return sendWithResend(payload)
}
