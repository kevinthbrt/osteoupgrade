/**
 * Boîte mail admin : vocabulaire et rendu des réponses.
 *
 * Sans dépendance serveur, comme `lib/customer-tracking.ts` dont il reprend le
 * gabarit maison : la page admin s'en sert pour l'aperçu en direct, la route
 * d'envoi pour produire exactement le même HTML.
 */

import { emailShell, escapeHtml, paragraphes } from './customer-tracking'

// ── Vocabulaire ────────────────────────────────────────────────────────────

export const INBOX_CATEGORIES = [
  'support',
  'facturation',
  'parrainage',
  'prospection',
  'notification',
  'general',
  'spam',
] as const
export type InboxCategory = (typeof INBOX_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<InboxCategory, string> = {
  support: 'Support',
  facturation: 'Facturation',
  parrainage: 'Parrainage',
  prospection: 'Prospection',
  notification: 'Notifications',
  general: 'Général',
  spam: 'Spam',
}

export const INBOX_STATUSES = ['todo', 'waiting', 'done'] as const
export type InboxStatus = (typeof INBOX_STATUSES)[number]

export const STATUS_LABELS: Record<InboxStatus, string> = {
  todo: 'À traiter',
  waiting: 'En attente du client',
  done: 'Traité',
}

export type InboxLayout = 'simple' | 'brand'

export function isCategory(value: unknown): value is InboxCategory {
  return typeof value === 'string' && (INBOX_CATEGORIES as readonly string[]).includes(value)
}

export function isStatus(value: unknown): value is InboxStatus {
  return typeof value === 'string' && (INBOX_STATUSES as readonly string[]).includes(value)
}

// ── Variables de fusion ────────────────────────────────────────────────────

export interface MergeValues {
  prenom?: string | null
  nom?: string | null
  email?: string | null
  offre?: string | null
}

/**
 * Remplace `{{prenom}}`, `{{nom}}`, `{{email}}`, `{{offre}}`. Sans prénom
 * connu, « Bonjour {{prenom}}, » devient « Bonjour, » plutôt que
 * « Bonjour , ».
 */
export function mergeVariables(texte: string, valeurs: MergeValues): string {
  return texte
    .replace(/[  ]*\{\{\s*prenom\s*\}\}/gi, (m) => (valeurs.prenom ? m.replace(/\{\{\s*prenom\s*\}\}/i, valeurs.prenom) : ''))
    .replace(/\{\{\s*nom\s*\}\}/gi, valeurs.nom || '')
    .replace(/\{\{\s*email\s*\}\}/gi, valeurs.email || '')
    .replace(/\{\{\s*offre\s*\}\}/gi, valeurs.offre || '')
}

/** Prénom probable : celui du compte, sinon celui du nom d'affichage. */
export function guessFirstName(fullName?: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0]
  if (!first || first.includes('@')) return null
  return first.charAt(0).toUpperCase() + first.slice(1)
}

// ── Objet et citation ──────────────────────────────────────────────────────

/** « Re: TR: Fwd: objet » devient « objet ». Sert aussi à regrouper les fils. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^\s*((re|tr|fw|fwd|réf|ref)\s*(\[\d+\])?\s*:\s*)+/i, '')
    .trim()
}

export function replySubject(subject: string): string {
  return `Re: ${normalizeSubject(subject) || '(sans objet)'}`
}

export interface QuotedMessage {
  fromName?: string | null
  fromEmail: string
  receivedAt: string
  text: string
}

function quoteHeader(q: QuotedMessage): string {
  const date = new Date(q.receivedAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
  const qui = q.fromName ? `${q.fromName} <${q.fromEmail}>` : q.fromEmail
  return `Le ${date}, ${qui} a écrit :`
}

/** Texte brut d'un message reçu, à partir de son HTML si besoin. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Rendu ──────────────────────────────────────────────────────────────────

export interface RenderInput {
  body: string
  signature: string
  layout: InboxLayout
  subject: string
  emoji?: string | null
  bannerTitle?: string | null
  quote?: QuotedMessage | null
}

const FONT = "Inter, -apple-system, 'Segoe UI', Arial, sans-serif"

function signatureHtml(signature: string): string {
  if (!signature.trim()) return ''
  return `<p style="margin: 24px 0 0; color: #374151;">${escapeHtml(signature.trim()).replace(/\n/g, '<br>')}</p>`
}

function quoteHtml(quote: QuotedMessage): string {
  // Le message d'origine est cité en texte brut : son HTML vient de
  // l'extérieur et n'a rien à faire dans un email que nous signons.
  const texte = quote.text.length > 4000 ? `${quote.text.slice(0, 4000)}…` : quote.text
  return `<div style="margin: 32px 0 0; font-size: 13px; color: #6b7280;">
  <p style="margin: 0 0 8px;">${escapeHtml(quoteHeader(quote))}</p>
  <blockquote style="margin: 0; padding: 4px 0 4px 14px; border-left: 3px solid #ddd6fe; color: #6b7280;">${escapeHtml(texte).replace(/\n/g, '<br>')}</blockquote>
</div>`
}

/**
 * Gabarit « sobre » : un email qui ressemble à un message écrit à la main,
 * avec la police et les couleurs maison. C'est le défaut pour répondre à
 * quelqu'un : un bandeau marketing en réponse à une question de support
 * sonne faux, et finit plus souvent dans l'onglet Promotions.
 */
function renderSimple(input: RenderInput): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: ${FONT};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="color: #374151; font-size: 15px; line-height: 1.65; font-family: ${FONT};">
              ${paragraphes(input.body)}
              ${signatureHtml(input.signature)}
              <p style="margin: 20px 0 0; font-size: 13px; font-weight: 600; color: #7c3aed;">OsteoUpgrade <span style="color: #c4b5fd;">×</span> MyOsteoflow</p>
              ${input.quote ? quoteHtml(input.quote) : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Gabarit illustré : bandeau violet maison, pour les messages plus « vitrine ». */
function renderBrand(input: RenderInput): string {
  return emailShell({
    emoji: input.emoji || '✉️',
    title: escapeHtml(input.bannerTitle?.trim() || normalizeSubject(input.subject) || 'OsteoUpgrade'),
    bodyHtml:
      paragraphes(input.body) +
      signatureHtml(input.signature) +
      (input.quote ? quoteHtml(input.quote) : ''),
  })
}

export function renderReplyHtml(input: RenderInput): string {
  return input.layout === 'brand' ? renderBrand(input) : renderSimple(input)
}

export function renderReplyText(input: RenderInput): string {
  let texte = input.body.trim()
  if (input.signature.trim()) texte += `\n\n${input.signature.trim()}`
  if (input.quote) {
    const cite = input.quote.text
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n')
    texte += `\n\n${quoteHeader(input.quote)}\n${cite}`
  }
  return texte
}
