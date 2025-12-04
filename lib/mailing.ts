interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  tags?: string[]
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_SENDER = process.env.BREVO_SENDER || 'OsteoUpgrade <no-reply@osteoupgrade.app>'

type Sender = { email: string; name?: string }

function normalizeRecipients(recipients: string | string[]): string[] {
  return Array.isArray(recipients) ? recipients : [recipients]
}

function parseSender(sender: string): Sender {
  const match = sender.match(/^(.*)<(.+)>$/)
  if (match) {
    return { email: match[2].trim(), name: match[1].trim() || undefined }
  }
  return { email: sender }
}

async function sendWithResend(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: payload.from || BREVO_SENDER,
      to: normalizeRecipients(payload.to),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function sendWithBrevo(payload: EmailPayload) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured')
  }

  const sender = parseSender(payload.from || BREVO_SENDER)

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender,
      to: normalizeRecipients(payload.to).map((email) => ({ email })),
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
      tags: payload.tags
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brevo error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  const errors: Error[] = []

  if (RESEND_API_KEY) {
    try {
      return await sendWithResend(payload)
    } catch (error: any) {
      errors.push(error)
      console.warn('Resend unavailable, trying Brevo:', error.message)
    }
  }

  if (BREVO_API_KEY) {
    try {
      return await sendWithBrevo(payload)
    } catch (error: any) {
      errors.push(error)
    }
  }

  if (!RESEND_API_KEY && !BREVO_API_KEY) {
    throw new Error('No email provider configured. Set RESEND_API_KEY or BREVO_API_KEY.')
  }

  throw new Error(errors.map((e) => e.message).join(' | '))
}
