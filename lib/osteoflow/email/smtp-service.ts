/**
 * Email service for Osteoflow web version.
 *
 * Instead of using nodemailer directly (which requires Node.js),
 * this sends email requests to the API proxy at /api/osteoflow/emails/send.
 * The browser provides the SMTP credentials (stored locally) with each request.
 */

export interface EmailSettings {
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_password: string
  from_name?: string
  from_email: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: string
    contentType?: string
    encoding?: 'base64' | 'utf8' | 'ascii'
  }>
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email via the server proxy.
 * Credentials are passed per-request and NOT stored server-side.
 */
export async function sendEmail(
  settings: EmailSettings,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const response = await fetch('/api/osteoflow/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtpSettings: settings,
        email: options,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Test SMTP connection via the server proxy.
 */
export async function testSmtpConnection(settings: EmailSettings): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/osteoflow/emails/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'smtp', settings }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

/**
 * Test IMAP connection via the server proxy.
 */
export async function testImapConnection(settings: {
  imap_host: string
  imap_port: number
  imap_secure: boolean
  imap_user: string
  imap_password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/osteoflow/emails/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'imap', settings }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

/**
 * Convert plain text to HTML (preserving line breaks)
 */
export function textToHtml(text: string): string {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const paragraphs = escapedText.split(/\n\n+/)
  return paragraphs
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * Create HTML email with professional styling
 */
export function createHtmlEmail(
  content: string,
  practitioner?: {
    first_name?: string
    last_name?: string
    practice_name?: string
    address?: string
    city?: string
    postal_code?: string
    phone?: string
    email?: string
  },
  options?: {
    includeFooter?: boolean
  }
): string {
  const htmlContent = textToHtml(content)
  const includeFooter = options?.includeFooter ?? true

  let footer = ''
  if (practitioner && includeFooter) {
    const name = [practitioner.first_name, practitioner.last_name].filter(Boolean).join(' ')
    const addressParts = [
      practitioner.address,
      [practitioner.postal_code, practitioner.city].filter(Boolean).join(' '),
    ].filter(Boolean)

    footer = `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p style="margin: 0 0 4px 0; font-weight: 500; color: #374151;">${name}</p>
        ${practitioner.practice_name ? `<p style="margin: 0 0 4px 0;">${practitioner.practice_name}</p>` : ''}
        ${addressParts.length > 0 ? `<p style="margin: 0 0 4px 0;">${addressParts.join('<br>')}</p>` : ''}
        ${practitioner.phone ? `<p style="margin: 0 0 4px 0;">Tel: ${practitioner.phone}</p>` : ''}
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${htmlContent}
            ${footer}
          </div>
          <p style="text-align: center; margin-top: 16px; color: #9ca3af; font-size: 12px;">
            Envoy&eacute; via Osteoflow
          </p>
        </div>
      </body>
    </html>
  `
}

/**
 * Check inbox via the server proxy.
 * Returns new emails for local storage.
 */
export async function checkInbox(
  imapSettings: {
    imap_host: string
    imap_port: number
    imap_secure: boolean
    imap_user: string
    imap_password: string
  },
  lastSyncUid: number
): Promise<{
  success: boolean
  emails?: Array<{
    uid: number
    from: string
    to: string
    subject: string
    date: string
    text: string
    html: string
    messageId: string
  }>
  maxUid?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/osteoflow/emails/check-inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imapSettings, lastSyncUid }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check inbox',
    }
  }
}
