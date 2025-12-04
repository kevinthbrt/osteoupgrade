interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  tags?: string[]
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM || 'OsteoUpgrade <no-reply@osteoupgrade.app>'

function normalizeRecipients(recipients: string | string[]): string[] {
  return Array.isArray(recipients) ? recipients : [recipients]
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
      from: payload.from || RESEND_FROM,
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

export async function sendTransactionalEmail(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error('No email provider configured. Set RESEND_API_KEY first.')
  }

  return sendWithResend(payload)
}
