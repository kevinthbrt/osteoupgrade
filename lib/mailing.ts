interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  tags?: string[]
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

async function sendWithResend(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const from = resolveFromAddress(payload.from)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: normalizeRecipients(payload.to),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags
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
