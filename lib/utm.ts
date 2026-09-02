/**
 * Attribution des campagnes (UTM).
 *
 * Le besoin : savoir quelle campagne a produit un abonnement. Les paramètres
 * UTM n'existent que sur la première URL visitée — ils disparaissent dès que
 * le visiteur navigue, et à plus forte raison entre la page funnel,
 * l'inscription et le paiement Stripe, qui sont trois pages différentes et,
 * pour Stripe, un autre domaine.
 *
 * On les recopie donc dans un cookie premier-partie à l'arrivée, et on le
 * relit au moment de créer la session Stripe. Le cookie ne contient que les
 * paramètres de campagne : ni identifiant personnel, ni adresse IP.
 *
 * Premier contact conservé : si un visiteur arrive par une campagne email
 * puis revient plus tard en direct, l'attribution reste à la campagne. Écraser
 * reviendrait à attribuer toutes les conversions au canal « direct », qui est
 * précisément celui qui n'a rien coûté.
 */

export const UTM_COOKIE = 'ou_attrib'

/** 90 jours : au-delà, rattacher une vente à une campagne n'a plus de sens. */
export const UTM_COOKIE_MAX_AGE = 90 * 24 * 60 * 60

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const

export type UtmKey = (typeof UTM_KEYS)[number]
export type Utm = Partial<Record<UtmKey, string>>

export type Attribution = {
  utm: Utm
  /** Chemin de la page d'arrivée (sans query string). */
  landing?: string
  /** Référent externe, tronqué. */
  referrer?: string
  /** ISO 8601 du premier contact. */
  first_seen?: string
}

/** Une valeur d'UTM trop longue est une erreur de tracking, pas une campagne. */
const MAX_VALUE_LENGTH = 200

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_VALUE_LENGTH)
}

/** Extrait les paramètres de campagne d'une query string. */
export function parseUtm(search: string | URLSearchParams): Utm {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  const utm: Utm = {}
  for (const key of UTM_KEYS) {
    const value = clean(params.get(key))
    if (value) utm[key] = value
  }
  return utm
}

export function hasUtm(utm: Utm): boolean {
  return UTM_KEYS.some((key) => Boolean(utm[key]))
}

/**
 * Relit le cookie d'attribution. Tolère un contenu invalide : un cookie
 * corrompu ne doit jamais empêcher un paiement, il fait juste perdre
 * l'attribution de cette vente.
 */
export function parseAttributionCookie(raw: string | null | undefined): Attribution | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (!parsed || typeof parsed !== 'object') return null

    const utm: Utm = {}
    for (const key of UTM_KEYS) {
      const value = clean(parsed.utm?.[key])
      if (value) utm[key] = value
    }

    return {
      utm,
      landing: clean(parsed.landing),
      referrer: clean(parsed.referrer),
      first_seen: clean(parsed.first_seen),
    }
  } catch {
    return null
  }
}

export function serializeAttribution(attribution: Attribution): string {
  return encodeURIComponent(JSON.stringify(attribution))
}

/**
 * Aplatit l'attribution pour les metadata Stripe, qui n'acceptent que des
 * chaînes (50 clés max, 500 caractères par valeur). Les clés vides sont
 * omises : une metadata vide occupe un emplacement sans rien apprendre.
 */
export function attributionToStripeMetadata(
  attribution: Attribution | null
): Record<string, string> {
  if (!attribution) return {}
  const metadata: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = attribution.utm[key]
    if (value) metadata[key] = value.slice(0, 500)
  }
  if (attribution.landing) metadata.attrib_landing = attribution.landing.slice(0, 500)
  if (attribution.first_seen) metadata.attrib_first_seen = attribution.first_seen
  return metadata
}
