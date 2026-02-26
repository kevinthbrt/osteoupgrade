const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.osteo-upgrade.fr'

/**
 * Generate an unsubscribe token from an email address.
 */
export function generateUnsubscribeToken(email: string): string {
  return Buffer.from(email).toString('base64')
}

/**
 * Generate the unsubscribe URL for a given email.
 */
export function getUnsubscribeUrl(email: string): string {
  return `${BASE_URL}/api/mailing/unsubscribe?token=${generateUnsubscribeToken(email)}`
}

/**
 * Generate a compliant email footer with unsubscribe link.
 * Must be appended to every marketing/newsletter email.
 */
export function getEmailFooterHtml(email: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(email)

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
      <tr>
        <td style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
            Vous recevez cet email car vous êtes inscrit(e) sur OsteoUpgrade.
          </p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Se désinscrire de la newsletter</a>
            &nbsp;|&nbsp;
            <a href="${BASE_URL}/politique-confidentialite" style="color: #6b7280; text-decoration: underline;">Politique de confidentialité</a>
          </p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #d1d5db;">
            OsteoUpgrade - Plateforme d'aide au diagnostic ostéopathique
          </p>
        </td>
      </tr>
    </table>`
}

/**
 * Get the List-Unsubscribe header value for an email.
 * Helps email clients show a native unsubscribe button.
 */
export function getUnsubscribeHeaders(email: string): Record<string, string> {
  const url = getUnsubscribeUrl(email)
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  }
}
