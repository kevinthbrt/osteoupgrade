/**
 * Modèle des pages funnel.
 *
 * Le contenu d'une page est un tableau de blocs typés, stocké en JSONB. Ce
 * choix permet d'ajouter un type de bloc sans migration, mais il déplace la
 * validation ici : la base accepte n'importe quel JSON, donc c'est ce module
 * qui garantit qu'un bloc enregistré est affichable. Toute écriture passe par
 * `parseFunnelContent` — jamais d'insertion directe du corps de la requête.
 *
 * Les textes sont rendus comme du texte (jamais `dangerouslySetInnerHTML`) :
 * l'éditeur est réservé aux admins, mais un rendu HTML libre transformerait
 * chaque page publique en surface d'injection pour un compte admin compromis.
 */

import { z } from 'zod'

// ── Blocs ──────────────────────────────────────────────────────────────────

/** Cible d'un bouton d'appel à l'action. */
const ctaTargetSchema = z.enum([
  'checkout', // souscription à l'offre du funnel
  'optin',    // fait défiler jusqu'au formulaire d'inscription
  'url',      // lien libre
])
export type CtaTarget = z.infer<typeof ctaTargetSchema>

const shortText = z.string().trim().min(1).max(300)
const longText = z.string().trim().min(1).max(5000)
const optionalShort = z.string().trim().max(300).optional().or(z.literal(''))

/**
 * URL d'un CTA « lien libre ». Refusée à l'enregistrement si elle n'est pas en
 * http(s) — la même règle est réappliquée au clic (`safeLinkUrl`), car un
 * enregistrement antérieur à cette validation peut déjà être en base.
 */
const ctaUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((url) => url === '' || /^https?:\/\//i.test(url), {
    message: 'Le lien doit commencer par http:// ou https://',
  })
  .optional()
  .or(z.literal(''))

/**
 * URL d'image. Restreinte à `https` : les images sont envoyées sur Vercel Blob
 * (`/api/funnels/image-upload`), mais le champ accepte aussi une URL collée, et
 * un `javascript:`/`data:` n'a rien à faire dans un `src` de page publique.
 */
const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((url) => url === '' || /^https:\/\//i.test(url), {
    message: 'L’image doit être servie en https://',
  })
  .optional()
  .or(z.literal(''))

const baseBlock = { id: z.string().trim().min(1).max(64) }

const heroSchema = z.object({
  ...baseBlock,
  type: z.literal('hero'),
  eyebrow: optionalShort,
  title: shortText,
  subtitle: z.string().trim().max(1000).optional().or(z.literal('')),
  ctaLabel: optionalShort,
  ctaTarget: ctaTargetSchema.default('checkout'),
  ctaUrl: ctaUrlSchema,
  imageUrl: imageUrlSchema,
})

const videoSchema = z.object({
  ...baseBlock,
  type: z.literal('video'),
  title: optionalShort,
  /** URL d'iframe (Vimeo/YouTube). Validée à l'affichage, cf. `safeEmbedUrl`. */
  embedUrl: z.string().trim().url().max(500),
  caption: optionalShort,
})

const benefitsSchema = z.object({
  ...baseBlock,
  type: z.literal('benefits'),
  title: optionalShort,
  items: z
    .array(
      z.object({
        title: shortText,
        text: z.string().trim().max(1000).optional().or(z.literal('')),
      })
    )
    .max(12),
})

const testimonialsSchema = z.object({
  ...baseBlock,
  type: z.literal('testimonials'),
  title: optionalShort,
  items: z
    .array(
      z.object({
        quote: longText,
        author: shortText,
        role: optionalShort,
      })
    )
    .max(20),
})

const curriculumSchema = z.object({
  ...baseBlock,
  type: z.literal('curriculum'),
  title: optionalShort,
  subtitle: optionalShort,
  modules: z
    .array(
      z.object({
        title: shortText,
        description: z.string().trim().max(1000).optional().or(z.literal('')),
        lessons: z.array(shortText).max(50).default([]),
      })
    )
    .max(20),
})

const pricingSchema = z.object({
  ...baseBlock,
  type: z.literal('pricing'),
  title: optionalShort,
  subtitle: optionalShort,
  /**
   * Prix affichés, en centimes. Volontairement libres et non déduits de
   * `STRIPE_PLANS` : une page funnel annonce parfois un prix barré ou une
   * mensualité qui ne correspond à aucun Price Stripe. Le montant réellement
   * facturé reste celui du `plan_type` du funnel, vérifié côté serveur.
   */
  originalAmount: z.number().int().min(0).max(10_000_00).optional(),
  amount: z.number().int().min(0).max(10_000_00).optional(),
  priceNote: optionalShort,
  features: z.array(shortText).max(20).default([]),
  ctaLabel: optionalShort,
})

const guaranteeSchema = z.object({
  ...baseBlock,
  type: z.literal('guarantee'),
  title: optionalShort,
  text: longText,
})

const faqSchema = z.object({
  ...baseBlock,
  type: z.literal('faq'),
  title: optionalShort,
  items: z
    .array(z.object({ question: shortText, answer: longText }))
    .max(30),
})

const ctaSchema = z.object({
  ...baseBlock,
  type: z.literal('cta'),
  title: optionalShort,
  text: z.string().trim().max(1000).optional().or(z.literal('')),
  ctaLabel: shortText,
  ctaTarget: ctaTargetSchema.default('checkout'),
  ctaUrl: ctaUrlSchema,
})

const optinSchema = z.object({
  ...baseBlock,
  type: z.literal('optin'),
  title: shortText,
  text: z.string().trim().max(1000).optional().or(z.literal('')),
  buttonLabel: optionalShort,
  askName: z.boolean().default(true),
  /** Mention de consentement affichée sous le formulaire (RGPD). */
  consentText: z.string().trim().max(500).optional().or(z.literal('')),
  successMessage: z.string().trim().max(500).optional().or(z.literal('')),
})

const imageSchema = z.object({
  ...baseBlock,
  type: z.literal('image'),
  imageUrl: z
    .string()
    .trim()
    .min(1, 'Choisissez une image, ou collez son URL')
    .max(1000)
    .refine((url) => /^https:\/\//i.test(url), {
      message: 'L’image doit être servie en https://',
    }),
  /** Texte alternatif : lu par les lecteurs d'écran, affiché si l'image tombe. */
  alt: z.string().trim().max(300).optional().or(z.literal('')),
  caption: optionalShort,
  /** Pleine largeur, ou centrée dans la colonne de lecture. */
  full: z.boolean().default(false),
})

const textSchema = z.object({
  ...baseBlock,
  type: z.literal('text'),
  title: optionalShort,
  /** Texte brut ; les sauts de ligne sont conservés à l'affichage. */
  body: longText,
})

export const funnelBlockSchema = z.discriminatedUnion('type', [
  heroSchema,
  videoSchema,
  benefitsSchema,
  testimonialsSchema,
  curriculumSchema,
  imageSchema,
  pricingSchema,
  guaranteeSchema,
  faqSchema,
  ctaSchema,
  optinSchema,
  textSchema,
])

export type FunnelBlock = z.infer<typeof funnelBlockSchema>
export type FunnelBlockType = FunnelBlock['type']

export const FUNNEL_BLOCK_TYPES: FunnelBlockType[] = [
  'hero',
  'video',
  'benefits',
  'testimonials',
  'curriculum',
  'image',
  'pricing',
  'guarantee',
  'faq',
  'cta',
  'optin',
  'text',
]

export const BLOCK_LABELS: Record<FunnelBlockType, string> = {
  hero: 'Accroche',
  video: 'Vidéo',
  benefits: 'Bénéfices',
  testimonials: 'Témoignages',
  curriculum: 'Programme',
  image: 'Photo',
  pricing: 'Tarifs',
  guarantee: 'Garantie',
  faq: 'FAQ',
  cta: 'Appel à l’action',
  optin: 'Formulaire (capture email)',
  text: 'Texte libre',
}

/** 60 blocs : au-delà, ce n'est plus une page de vente mais un site. */
export const funnelContentSchema = z.array(funnelBlockSchema).max(60)

export function parseFunnelContent(value: unknown): FunnelBlock[] {
  return funnelContentSchema.parse(value)
}

/** Lecture tolérante, pour l'affichage : un bloc invalide est ignoré, pas fatal. */
export function readFunnelContent(value: unknown): FunnelBlock[] {
  if (!Array.isArray(value)) return []
  const blocks: FunnelBlock[] = []
  for (const raw of value) {
    const parsed = funnelBlockSchema.safeParse(raw)
    if (parsed.success) blocks.push(parsed.data)
    else console.warn('Bloc de funnel ignoré (forme invalide):', parsed.error.issues[0]?.message)
  }
  return blocks
}

// ── Funnel ─────────────────────────────────────────────────────────────────

export const FUNNEL_STATUSES = ['draft', 'published', 'archived'] as const
export type FunnelStatus = (typeof FUNNEL_STATUSES)[number]

export const DEADLINE_MODES = ['none', 'fixed', 'relative'] as const
export type DeadlineMode = (typeof DEADLINE_MODES)[number]

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets')

export const funnelInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(200),
    status: z.enum(FUNNEL_STATUSES).default('draft'),
    meta_title: z.string().trim().max(200).optional().nullable(),
    meta_description: z.string().trim().max(400).optional().nullable(),
    content: funnelContentSchema.default([]),
    plan_type: z.string().trim().max(100).optional().nullable(),
    deadline_mode: z.enum(DEADLINE_MODES).default('none'),
    deadline_at: z.string().datetime({ offset: true }).optional().nullable(),
    deadline_days: z.number().int().min(1).max(365).optional().nullable(),
  })
  // Même contrainte que `funnels_deadline_coherent` en base. Dupliquée ici
  // pour renvoyer un message utilisable dans l'éditeur plutôt qu'une erreur
  // Postgres brute.
  .refine((f) => f.deadline_mode !== 'fixed' || Boolean(f.deadline_at), {
    message: 'Une échéance fixe demande une date',
    path: ['deadline_at'],
  })
  .refine((f) => f.deadline_mode !== 'relative' || Boolean(f.deadline_days), {
    message: 'Une échéance relative demande un nombre de jours',
    path: ['deadline_days'],
  })

export type FunnelInput = z.infer<typeof funnelInputSchema>

/**
 * Message d'erreur situé, pour l'éditeur.
 *
 * Zod renvoie « String must contain at least 1 character(s) » sans dire où :
 * sur une page de trente blocs, c'est inexploitable. On reconstruit le chemin
 * en clair — « Bloc 3 (Tarifs) → items → 2 → question ».
 */
export function describeValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Données invalides'

  const path = [...issue.path]
  let prefix = ''

  if (path[0] === 'content' && typeof path[1] === 'number') {
    prefix = `Bloc ${path[1] + 1}`
    path.splice(0, 2)
  }

  const rest = path.filter((segment) => segment !== '').join(' → ')
  const location = [prefix, rest].filter(Boolean).join(' → ')

  return location ? `${location} : ${issue.message}` : issue.message
}

export type Funnel = {
  id: string
  slug: string
  name: string
  status: FunnelStatus
  meta_title: string | null
  meta_description: string | null
  content: unknown
  plan_type: string | null
  deadline_mode: DeadlineMode
  deadline_at: string | null
  deadline_days: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Échéance affichée à un visiteur donné.
 *
 * En mode `relative`, chaque lead a la sienne (J+N après son opt-in) : c'est
 * ce qui distingue un funnel permanent d'une campagne à date unique. Un
 * visiteur qui n'a pas encore laissé son email n'a pas d'échéance — afficher
 * un décompte avant l'inscription reviendrait à décompter dans le vide.
 */
export function resolveDeadline(
  funnel: Pick<Funnel, 'deadline_mode' | 'deadline_at' | 'deadline_days'>,
  leadDeadlineAt?: string | null
): Date | null {
  if (funnel.deadline_mode === 'fixed') {
    return funnel.deadline_at ? new Date(funnel.deadline_at) : null
  }
  if (funnel.deadline_mode === 'relative') {
    return leadDeadlineAt ? new Date(leadDeadlineAt) : null
  }
  return null
}

/** Échéance à figer pour un lead au moment de son opt-in. */
export function leadDeadlineFor(
  funnel: Pick<Funnel, 'deadline_mode' | 'deadline_at' | 'deadline_days'>,
  now: Date = new Date()
): Date | null {
  if (funnel.deadline_mode === 'relative' && funnel.deadline_days) {
    return new Date(now.getTime() + funnel.deadline_days * 24 * 60 * 60 * 1000)
  }
  if (funnel.deadline_mode === 'fixed' && funnel.deadline_at) {
    return new Date(funnel.deadline_at)
  }
  return null
}

/**
 * Événement d'automatisation propre à un funnel.
 *
 * `mail_automations.trigger_event` est du texte libre (cf. les séquences
 * séminaire en 20260109) : un funnel peut donc avoir sa propre séquence, créée
 * dans /admin/automations sans toucher au code.
 */
export function funnelTriggerEvent(slug: string): `funnel:${string}` {
  return `funnel:${slug}`
}

/**
 * N'autorise qu'un lien réellement navigable pour un CTA « lien libre ».
 *
 * La cible est assignée à `window.location.href` : sans ce filtre, une URL
 * `javascript:` enregistrée en base s'exécuterait dans l'origine de
 * l'application au premier clic d'un visiteur. L'éditeur est réservé aux
 * admins, mais un compte admin compromis ne doit pas pouvoir transformer une
 * page publique en vecteur d'exécution.
 */
export function safeLinkUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * N'autorise à l'affichage que les hébergeurs vidéo réellement utilisés.
 *
 * Une URL d'iframe arbitraire enregistrée en base serait chargée telle quelle
 * dans la page publique : on restreint aux domaines connus plutôt que de faire
 * confiance au contenu stocké.
 */
const ALLOWED_EMBED_HOSTS = [
  'player.vimeo.com',
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]

export function safeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    if (!ALLOWED_EMBED_HOSTS.includes(parsed.hostname)) return null
    return parsed.toString()
  } catch {
    return null
  }
}
