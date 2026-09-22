// Newsletter en blocs : modèle de données et rendu HTML.
//
// L'administration ne manipule plus de HTML. Elle empile des blocs, et c'est ce
// fichier qui reconstruit l'email à partir du gabarit maison (bandeau dégradé
// violet, corps blanc à 40px, encarts lavande, bouton dégradé, pied de page
// gris). Conséquence voulue : `blocks` fait foi en base, un correctif apporté
// ici s'applique aussi aux brouillons déjà écrits.
//
// Le fichier est volontairement sans DOM ni React : il tourne dans le
// navigateur pour l'aperçu et sur le serveur au moment de l'envoi, et c'est le
// rendu serveur qui part réellement. Rien de ce que produit le navigateur n'est
// envoyé tel quel.

export type BlockType =
  | 'titre'
  | 'texte'
  | 'image'
  | 'bouton'
  | 'encart'
  | 'citation'
  | 'separateur'
  | 'espace'

export type NewsletterBlock =
  | { id: string; type: 'titre'; text: string; align?: 'left' | 'center' }
  | { id: string; type: 'texte'; html: string }
  | {
      id: string
      type: 'image'
      url: string
      alt?: string
      href?: string
      width?: 'full' | 'large' | 'medium' | 'small'
      caption?: string
    }
  | { id: string; type: 'bouton'; label: string; href: string; align?: 'left' | 'center' }
  | { id: string; type: 'encart'; title?: string; html: string; emoji?: string }
  | { id: string; type: 'citation'; html: string; author?: string }
  | { id: string; type: 'separateur' }
  | { id: string; type: 'espace'; size?: 'small' | 'medium' | 'large' }

export interface NewsletterHeader {
  emoji: string
  title: string
  subtitle: string
}

export interface NewsletterDoc {
  subject: string
  preheader: string
  header: NewsletterHeader
  blocks: NewsletterBlock[]
}

export type AudienceKind = 'all' | 'plan' | 'prelaunch' | 'test'
export type DeliveryMode = 'marketing' | 'direct'

// ── Valeurs par défaut ──────────────────────────────────────────────────────

export const DEFAULT_HEADER: NewsletterHeader = {
  emoji: '📬',
  title: 'La newsletter du mois',
  subtitle: 'OsteoUpgrade × MyOsteoflow'
}

export function emptyDoc(): NewsletterDoc {
  return {
    subject: '',
    preheader: '',
    header: { ...DEFAULT_HEADER },
    blocks: [
      { id: newBlockId(), type: 'titre', text: 'Au programme ce mois-ci' },
      {
        id: newBlockId(),
        type: 'texte',
        html: 'Bonjour {{{contact.first_name|cher confrère}}},<br><br>Écrivez ici votre introduction.'
      }
    ]
  }
}

export function newBlockId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** Bloc neuf, prérempli, tel qu'il apparaît quand on le dépose sur la page. */
export function createBlock(type: BlockType): NewsletterBlock {
  const id = newBlockId()
  switch (type) {
    case 'titre':
      return { id, type, text: 'Votre titre' }
    case 'texte':
      return { id, type, html: 'Votre texte…' }
    case 'image':
      return { id, type, url: '', alt: '', width: 'full' }
    case 'bouton':
      return { id, type, label: 'Découvrir', href: 'https://www.osteo-upgrade.fr', align: 'center' }
    case 'encart':
      return { id, type, emoji: '💡', title: 'Le conseil du mois', html: 'Votre encart…' }
    case 'citation':
      return { id, type, html: 'Votre citation…', author: '' }
    case 'separateur':
      return { id, type }
    case 'espace':
      return { id, type, size: 'medium' }
  }
}

/** Ce que la palette affiche. `icon` est résolu côté composant. */
export const BLOCK_CATALOG: {
  type: BlockType
  label: string
  icon: string
  help: string
}[] = [
  { type: 'titre', label: 'Titre', icon: 'heading', help: 'Un titre de section, en violet.' },
  { type: 'texte', label: 'Texte', icon: 'text', help: 'Un paragraphe. Gras, italique, liens et listes.' },
  { type: 'image', label: 'Image', icon: 'image', help: 'Une illustration, avec légende si besoin.' },
  { type: 'bouton', label: 'Bouton', icon: 'button', help: 'Un bouton violet qui mène vers un lien.' },
  { type: 'encart', label: 'Encart', icon: 'panel', help: 'Un bloc lavande pour mettre en avant une idée.' },
  { type: 'citation', label: 'Citation', icon: 'quote', help: 'Un témoignage ou une citation.' },
  { type: 'separateur', label: 'Séparateur', icon: 'divider', help: 'Un trait fin entre deux parties.' },
  { type: 'espace', label: 'Espace', icon: 'space', help: 'Un peu d’air entre deux blocs.' }
]

// ── Balises de personnalisation Resend ──────────────────────────────────────
//
// Syntaxe à trois accolades, résolue par Resend au moment de l'envoi d'une
// campagne. Elles ne valent QUE pour le mode « campagne marketing » : un envoi
// direct part par l'API transactionnelle, qui ne connaît pas ces balises, donc
// `applyMergeTags` les remplace nous-mêmes avant de poster le message.

export const MERGE_TAGS: { tag: string; label: string; help: string }[] = [
  {
    tag: '{{{contact.first_name|cher confrère}}}',
    label: 'Prénom',
    help: 'Le prénom du destinataire, ou « cher confrère » si on ne le connaît pas.'
  },
  {
    tag: '{{{contact.last_name}}}',
    label: 'Nom',
    help: 'Le nom de famille du destinataire, vide si on ne le connaît pas.'
  },
  {
    tag: '{{{contact.email}}}',
    label: 'Email',
    help: 'L’adresse email du destinataire.'
  }
]

/**
 * Remplace les balises Resend par les vraies valeurs. Utilisé pour l'aperçu et
 * pour l'envoi direct (transactionnel), où Resend ne fait pas la substitution.
 */
export function applyMergeTags(
  html: string,
  contact: { email: string; firstName?: string | null; lastName?: string | null }
): string {
  return html.replace(/\{\{\{\s*(contact\.[a-z_]+|RESEND_UNSUBSCRIBE_URL)\s*(?:\|([^}]*))?\}\}\}/gi, (_m, name: string, fallback?: string) => {
    const key = name.toLowerCase()
    const value =
      key === 'contact.first_name'
        ? contact.firstName
        : key === 'contact.last_name'
        ? contact.lastName
        : key === 'contact.email'
        ? contact.email
        : ''
    const resolved = (value || '').trim()
    return resolved || (fallback ?? '').trim()
  })
}

// ── Assainissement ──────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Le texte enrichi est écrit dans un champ éditable du navigateur, donc il
 * arrive en HTML. On ne garde que les balises en ligne du gabarit, et sur un
 * lien seulement son `href`. Les balises Resend (`{{{…}}}`) traversent
 * l'échappement : elles ne contiennent ni `<` ni `&`.
 */
const INLINE_ALLOWED = new Set(['strong', 'b', 'em', 'i', 'u', 'br', 'a', 'ul', 'ol', 'li'])

export function sanitizeInlineHtml(raw: string): string {
  if (!raw) return ''

  // On retire d'abord ce qui ne doit jamais survivre, contenu compris.
  let html = String(raw)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  html = html.replace(/<\s*(\/?)\s*([a-z0-9]+)((?:"[^"]*"|'[^']*'|[^>])*)>/gi, (_match, slash: string, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase()
    if (!INLINE_ALLOWED.has(tag)) return ''
    if (slash) return `</${tag}>`
    if (tag === 'br') return '<br>'
    if (tag === 'a') {
      const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs)
      const url = (href?.[2] ?? href?.[3] ?? href?.[4] ?? '').trim()
      if (!isSafeUrl(url)) return '<a>'
      return `<a href="${escapeHtml(url)}">`
    }
    return `<${tag}>`
  })

  // Les balises restantes sont fermées correctement par le navigateur à
  // l'édition ; le rendu email n'en dépend pas.
  return html
}

/** Seuls http(s) et mailto partent dans un email : ni `javascript:` ni `data:`. */
export function isSafeUrl(url: string): boolean {
  const trimmed = (url || '').trim()
  if (!trimmed) return false
  if (trimmed.startsWith('{{{')) return true // balise Resend résolue à l'envoi
  return /^(https?:\/\/|mailto:)/i.test(trimmed)
}

// ── Rendu ───────────────────────────────────────────────────────────────────

const TEXT_STYLE = 'margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;'

/**
 * Deux retours à la ligne consécutifs font un nouveau paragraphe : c'est ce que
 * fait naturellement quelqu'un qui écrit, et c'est plus lisible en email qu'un
 * `<br><br>` qui ne crée aucune respiration typographique.
 */
function renderParagraphs(inlineHtml: string, style = TEXT_STYLE): string {
  const clean = sanitizeInlineHtml(inlineHtml).trim()
  if (!clean) return ''
  return clean
    .split(/(?:<br\s*\/?>\s*){2,}/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (isList(part) ? renderList(part, style) : `<p style="${style}">${part}</p>`))
    .join('\n')
}

function isList(part: string): boolean {
  return /^<(ul|ol)>[\s\S]*<\/(ul|ol)>$/i.test(part)
}

/** Une liste reste une liste : l'envelopper dans un `<p>` produirait du HTML invalide. */
function renderList(part: string, style: string): string {
  const itemStyle = style.replace(/margin:[^;]*;/, 'margin:0 0 6px;')
  return part
    .replace(/^<(ul|ol)>/i, `<ul style="${style}padding-left:22px;">`)
    .replace(/<\/(ul|ol)>$/i, '</ul>')
    .replace(/<li>/gi, `<li style="${itemStyle}">`)
}

const IMAGE_WIDTHS: Record<string, number> = { full: 520, large: 420, medium: 320, small: 200 }
const SPACE_HEIGHTS: Record<string, number> = { small: 8, medium: 20, large: 40 }

function renderBlock(block: NewsletterBlock): string {
  switch (block.type) {
    case 'titre': {
      const align = block.align === 'center' ? 'center' : 'left'
      return `<h2 style="margin:28px 0 12px;color:#7c3aed;font-size:22px;font-weight:700;line-height:1.35;text-align:${align};">${escapeHtml(block.text)}</h2>`
    }

    case 'texte':
      return renderParagraphs(block.html)

    case 'image': {
      if (!isSafeUrl(block.url)) return ''
      const width = IMAGE_WIDTHS[block.width || 'full'] ?? IMAGE_WIDTHS.full
      const img = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;border-radius:8px;margin:0 auto;" />`
      const linked = block.href && isSafeUrl(block.href) ? `<a href="${escapeHtml(block.href)}" style="text-decoration:none;">${img}</a>` : img
      const caption = block.caption
        ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;text-align:center;">${escapeHtml(block.caption)}</p>`
        : ''
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;"><tr><td align="center">${linked}${caption}</td></tr></table>`
    }

    case 'bouton': {
      if (!block.label || !isSafeUrl(block.href)) return ''
      const align = block.align === 'left' ? 'left' : 'center'
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td align="${align}">` +
        `<a href="${escapeHtml(block.href)}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);background-color:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${escapeHtml(block.label)}</a>` +
        `</td></tr></table>`
    }

    case 'encart': {
      const heading = block.title
        ? `<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#5b21b6;">${block.emoji ? `${escapeHtml(block.emoji)} ` : ''}${escapeHtml(block.title)}</p>`
        : ''
      const body = renderParagraphs(block.html, 'margin:0 0 12px;font-size:15px;line-height:1.7;color:#4c1d95;')
      if (!heading && !body) return ''
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;"><tr>` +
        `<td style="background-color:#f5f3ff;border-radius:8px;padding:20px 24px;">${heading}${stripLastMargin(body)}</td>` +
        `</tr></table>`
    }

    case 'citation': {
      const body = renderParagraphs(block.html, 'margin:0 0 10px;font-size:16px;line-height:1.7;color:#4b5563;font-style:italic;')
      if (!body) return ''
      const author = block.author
        ? `<p style="margin:0;font-size:13px;color:#9ca3af;">${escapeHtml(block.author)}</p>`
        : ''
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;"><tr>` +
        `<td style="border-left:3px solid #c4b5fd;padding:4px 0 4px 20px;">${stripLastMargin(body)}${author}</td>` +
        `</tr></table>`
    }

    case 'separateur':
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr></table>`

    case 'espace': {
      const height = SPACE_HEIGHTS[block.size || 'medium'] ?? SPACE_HEIGHTS.medium
      return `<div style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</div>`
    }
  }
}

/** Le dernier paragraphe d'un encart ne doit pas pousser le fond lavande. */
function stripLastMargin(html: string): string {
  const index = html.lastIndexOf('<p style="margin:0 0 ')
  if (index === -1) return html
  const before = html.slice(0, index)
  const after = html.slice(index).replace(/^<p style="margin:0 0 \d+px;/, '<p style="margin:0;')
  return before + after
}

export interface RenderOptions {
  /** Pied de désinscription à insérer avant le pied de page. */
  footerHtml?: string
  /** Aperçu : les balises Resend sont remplacées par un exemple. */
  previewContact?: { email: string; firstName?: string | null; lastName?: string | null }
}

export function renderNewsletterHtml(doc: NewsletterDoc, options: RenderOptions = {}): string {
  const header = { ...DEFAULT_HEADER, ...(doc.header || {}) }
  const body = (doc.blocks || []).map(renderBlock).filter(Boolean).join('\n')
  const year = new Date().getFullYear()

  const preheader = doc.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(doc.preheader)}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.subject || header.title)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background-color:#f3f4f6;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);background-color:#7c3aed;padding:38px 40px 28px;border-radius:12px 12px 0 0;text-align:center;">
            ${header.emoji ? `<div style="font-size:42px;margin-bottom:6px;">${escapeHtml(header.emoji)}</div>` : ''}
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${escapeHtml(header.title)}</h1>
            ${header.subtitle ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${escapeHtml(header.subtitle)}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
${body}
            <p style="margin:26px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">À très vite,<br><strong style="color:#1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:20px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${year} OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
          </td>
        </tr>
      </table>
      ${options.footerHtml || ''}
    </td></tr>
  </table>
</body>
</html>`

  return options.previewContact ? applyMergeTags(html, options.previewContact) : html
}

/** Version texte, pour les clients qui n'affichent pas le HTML. */
export function renderNewsletterText(doc: NewsletterDoc): string {
  const lines: string[] = []
  const header = { ...DEFAULT_HEADER, ...(doc.header || {}) }
  lines.push(header.title)
  if (header.subtitle) lines.push(header.subtitle)
  lines.push('')

  for (const block of doc.blocks || []) {
    switch (block.type) {
      case 'titre':
        lines.push('', block.text.toUpperCase(), '')
        break
      case 'texte':
      case 'citation':
        lines.push(htmlToText(block.html), '')
        break
      case 'encart':
        if (block.title) lines.push(block.title)
        lines.push(htmlToText(block.html), '')
        break
      case 'bouton':
        lines.push(`${block.label} : ${block.href}`, '')
        break
      case 'image':
        if (block.caption) lines.push(block.caption, '')
        break
      case 'separateur':
        lines.push('---', '')
        break
      case 'espace':
        lines.push('')
        break
    }
  }

  lines.push('À très vite,', "L'équipe OsteoUpgrade × MyOsteoflow")
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function htmlToText(html: string): string {
  return sanitizeInlineHtml(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Ce qui empêche un envoi, dit en français et sans jargon. La page s'en sert
 * pour désactiver le bouton et expliquer pourquoi.
 */
export function describeBlockers(doc: NewsletterDoc): string[] {
  const problems: string[] = []
  if (!doc.subject.trim()) problems.push('L’objet de l’email est vide.')
  if (!doc.header?.title?.trim()) problems.push('Le titre du bandeau est vide.')

  const hasContent = (doc.blocks || []).some((block) => {
    if (block.type === 'titre') return Boolean(block.text.trim())
    if (block.type === 'texte' || block.type === 'citation') return Boolean(htmlToText(block.html))
    if (block.type === 'encart') return Boolean(block.title?.trim() || htmlToText(block.html))
    if (block.type === 'image') return isSafeUrl(block.url)
    if (block.type === 'bouton') return Boolean(block.label.trim() && isSafeUrl(block.href))
    return false
  })
  if (!hasContent) problems.push('La newsletter ne contient encore aucun contenu.')

  for (const block of doc.blocks || []) {
    if (block.type === 'bouton' && block.label.trim() && !isSafeUrl(block.href)) {
      problems.push(`Le bouton « ${block.label} » n’a pas de lien valide (il doit commencer par https://).`)
    }
    if (block.type === 'image' && !isSafeUrl(block.url)) {
      problems.push(
        block.url
          ? 'Un bloc image pointe vers une adresse qui ne peut pas être affichée dans un email.'
          : 'Un bloc image est encore vide : choisissez un fichier ou retirez le bloc.'
      )
    }
  }

  return problems
}

/** Normalise ce qui vient de la base ou du navigateur avant tout rendu. */
export function coerceDoc(input: any): NewsletterDoc {
  const header = input?.header && typeof input.header === 'object' ? input.header : {}
  const blocks = Array.isArray(input?.blocks) ? input.blocks : []
  return {
    subject: typeof input?.subject === 'string' ? input.subject : '',
    preheader: typeof input?.preheader === 'string' ? input.preheader : '',
    header: {
      emoji: typeof header.emoji === 'string' ? header.emoji : DEFAULT_HEADER.emoji,
      title: typeof header.title === 'string' ? header.title : DEFAULT_HEADER.title,
      subtitle: typeof header.subtitle === 'string' ? header.subtitle : DEFAULT_HEADER.subtitle
    },
    blocks: blocks
      .filter((block: any) => block && typeof block.id === 'string' && typeof block.type === 'string')
      .map(coerceBlock)
      .filter(Boolean) as NewsletterBlock[]
  }
}

/**
 * Un bloc venu de la base peut avoir été écrit par une version antérieure du
 * module, ou tronqué. Les champs texte sont donc garantis ici, une bonne fois,
 * plutôt que testés à chaque usage.
 */
function coerceBlock(block: any): NewsletterBlock | null {
  const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
  const id = block.id as string

  switch (block.type) {
    case 'titre':
      return { id, type: 'titre', text: str(block.text), align: block.align === 'center' ? 'center' : 'left' }
    case 'texte':
      return { id, type: 'texte', html: str(block.html) }
    case 'image':
      return {
        id,
        type: 'image',
        url: str(block.url),
        alt: str(block.alt),
        href: str(block.href),
        caption: str(block.caption),
        width: ['full', 'large', 'medium', 'small'].includes(block.width) ? block.width : 'full'
      }
    case 'bouton':
      return {
        id,
        type: 'bouton',
        label: str(block.label),
        href: str(block.href),
        align: block.align === 'left' ? 'left' : 'center'
      }
    case 'encart':
      return { id, type: 'encart', emoji: str(block.emoji), title: str(block.title), html: str(block.html) }
    case 'citation':
      return { id, type: 'citation', html: str(block.html), author: str(block.author) }
    case 'separateur':
      return { id, type: 'separateur' }
    case 'espace':
      return { id, type: 'espace', size: ['small', 'medium', 'large'].includes(block.size) ? block.size : 'medium' }
    default:
      return null
  }
}
