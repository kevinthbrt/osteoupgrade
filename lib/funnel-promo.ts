import { stripe, PUBLIC_PLAN_TYPES, STRIPE_PLANS } from '@/lib/stripe'

/**
 * Remise personnelle d'un funnel.
 *
 * Chaque inscrit reçoit SON code, à usage unique, qui expire à une date qui
 * lui est propre. C'est la seule façon d'annoncer « il vous reste sept jours »
 * dans une séquence permanente sans mentir : un code de campagne unique porte
 * une date de fin absolue, identique pour tout le monde, alors que les
 * inscriptions arrivent en continu.
 *
 * Le coupon (la remise elle-même) est partagé ; les codes (les jetons d'accès
 * à cette remise) sont individuels. C'est le découpage prévu par Stripe.
 */

/** Pourcentage de remise, appliqué aux trois premières mensualités. */
export const PROMO_PERCENT = 30
export const PROMO_MONTHS = 3
/** Durée de validité du code, à compter de l'inscription. */
export const PROMO_VALID_DAYS = 7

/**
 * Identifiant fixe du coupon, choisi plutôt que laissé à Stripe.
 *
 * Il rend `ensureFunnelCoupon` idempotent sans variable d'environnement à
 * renseigner à la main : la première inscription crée le coupon, les suivantes
 * le retrouvent. Changer le pourcentage impose donc de changer cet
 * identifiant, ce qui est voulu : les abonnements déjà remisés continuent de
 * courir sur l'ancien coupon, qui ne doit pas être modifié sous eux.
 */
const COUPON_ID = `funnel-remise-${PROMO_PERCENT}-${PROMO_MONTHS}m`

/**
 * Récupère le coupon de remise, en le créant à la première utilisation.
 *
 * Restreint aux trois offres mensuelles publiques. Les tarifs Fondateur en
 * sont exclus : ils sont déjà à moitié prix à vie, et une remise empilée
 * dessus reviendrait à offrir l'abonnement.
 */
async function ensureFunnelCoupon(): Promise<string> {
  try {
    const existant = await stripe.coupons.retrieve(COUPON_ID)
    if (existant && !existant.deleted) return existant.id
  } catch (err: any) {
    // `resource_missing` est le cas normal du premier appel. Toute autre
    // erreur (clé invalide, Stripe indisponible) doit remonter telle quelle.
    if (err?.code !== 'resource_missing') throw err
  }

  const prixEligibles = PUBLIC_PLAN_TYPES
    .map((clef) => STRIPE_PLANS[clef]?.priceId)
    .filter((id): id is string => Boolean(id))

  const params: any = {
    id: COUPON_ID,
    percent_off: PROMO_PERCENT,
    duration: 'repeating',
    duration_in_months: PROMO_MONTHS,
    name: `Funnel -${PROMO_PERCENT}% pendant ${PROMO_MONTHS} mois`,
    metadata: { purpose: 'funnel_discount' },
  }
  if (prixEligibles.length > 0) {
    params.applies_to = { prices: prixEligibles }
  }

  const coupon = await stripe.coupons.create(params)
  return coupon.id
}

/**
 * Alphabet sans les caractères qu'on confond en les recopiant d'un email :
 * ni O/0, ni I/1, ni S/5.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'

function suffixeAleatoire(longueur: number): string {
  const octets = new Uint8Array(longueur)
  crypto.getRandomValues(octets)
  // Le modulo biaise légèrement la distribution vers le début de l'alphabet.
  // Sans conséquence ici : ce code n'est pas un secret, il est à usage unique
  // et borné dans le temps ; il n'a qu'à être impossible à deviner de tête.
  return Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join('')
}

export type FunnelPromo = {
  /** Code lisible, celui qui part dans l'email. */
  code: string
  /** Identifiant Stripe (`promo_...`), celui qui s'applique au paiement. */
  id: string
  expiresAt: Date
}

/**
 * Crée un code promotionnel personnel, à usage unique, expirant à J+7.
 *
 * `prefixe` sert à reconnaître la campagne d'origine dans le tableau de bord
 * Stripe. Le code reste lisible à voix haute, parce qu'il sera recopié à la
 * main par une partie des abonnés.
 */
export async function createLeadPromo(prefixe: string): Promise<FunnelPromo> {
  const couponId = await ensureFunnelCoupon()

  const expiresAt = new Date(Date.now() + PROMO_VALID_DAYS * 24 * 60 * 60 * 1000)
  const base = prefixe
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 10)

  // Une collision de code fait échouer la création côté Stripe (le code est
  // unique par compte). Avec six caractères sur trente, c'est improbable mais
  // pas impossible sur la durée : on retente plutôt que de perdre la remise.
  let derniereErreur: unknown = null
  for (let essai = 0; essai < 3; essai++) {
    const code = `${base}${suffixeAleatoire(6)}`
    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { type: 'coupon', coupon: couponId },
        code,
        max_redemptions: 1,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        metadata: { purpose: 'funnel_discount' },
      } as any)
      return { code: promo.code, id: promo.id, expiresAt }
    } catch (err: any) {
      derniereErreur = err
      const dejaPris =
        typeof err?.message === 'string' && err.message.toLowerCase().includes('already')
      if (!dejaPris) throw err
    }
  }

  throw derniereErreur
}

/** « 1er octobre » plutôt qu'une date ISO : le code part dans un email. */
export function formatPromoDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(date)
}
