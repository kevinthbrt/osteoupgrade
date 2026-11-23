import { stripe, ANNUAL_PLAN_TYPES, productIdsFor } from '@/lib/stripe'
import { BLACK_FRIDAY_END, BLACK_FRIDAY_PERCENT } from '@/lib/black-friday'

/**
 * Partie serveur de l'offre Black Friday 2026 (voir `lib/black-friday.ts` et
 * docs/BLACK_FRIDAY_2026.md). Importe le SDK Stripe : jamais côté client.
 */

/** Identifiant fixe : le coupon se retrouve sans recherche ni variable d'environnement. */
export const BLACK_FRIDAY_COUPON_ID = 'BLACK_FRIDAY_2026_30_ANNUEL'

export const BLACK_FRIDAY_PURPOSE = 'black_friday_2026'

/**
 * Coupon de l'offre : -30 %, restreint aux trois produits annuels, pendant
 * douze mois.
 *
 * Douze mois sur un abonnement annuel couvrent la seule première facture :
 * Stripe arrête la remise au renouvellement, sans rien à programmer (même
 * mécanique que le tarif étudiant). La restriction aux produits annuels
 * empêche la remise de toucher un prix mensuel, y compris les lignes de
 * prorata du mois en cours lors d'une bascule mensuel → annuel.
 *
 * `redeem_by` ferme le coupon à la fin de l'offre côté Stripe : même une
 * session de paiement ouverte avant minuit et validée après est refusée par
 * Stripe, pas seulement par notre serveur.
 */
export async function ensureBlackFridayCoupon(): Promise<string> {
  try {
    const existant = await stripe.coupons.retrieve(BLACK_FRIDAY_COUPON_ID)
    if (existant.valid) return existant.id
    throw new Error("Le coupon Black Friday n'est plus valide")
  } catch (err: any) {
    if (err?.code !== 'resource_missing') throw err
  }

  const produits = await productIdsFor(ANNUAL_PLAN_TYPES)
  if (produits.length === 0) throw new Error('Prix annuels non configurés')

  const coupon = await stripe.coupons.create({
    id: BLACK_FRIDAY_COUPON_ID,
    name: `Black Friday -${BLACK_FRIDAY_PERCENT} % (1re année)`,
    percent_off: BLACK_FRIDAY_PERCENT,
    duration: 'repeating',
    duration_in_months: 12,
    applies_to: { products: produits },
    redeem_by: Math.floor(BLACK_FRIDAY_END.getTime() / 1000),
    metadata: { purpose: BLACK_FRIDAY_PURPOSE },
  })
  return coupon.id
}

/** L'abonnement Stripe porte-t-il la remise Black Friday ? */
export function hasBlackFridayDiscount(subscription: any): boolean {
  const discounts = subscription?.discounts
  if (!Array.isArray(discounts)) return false
  return discounts.some((d: any) => {
    if (!d || typeof d !== 'object') return false
    // API 2025-11-17.clover : le coupon d'un Discount est dans source.coupon.
    const coupon = d.source?.coupon
    const id = typeof coupon === 'string' ? coupon : coupon?.id
    return id === BLACK_FRIDAY_COUPON_ID || coupon?.metadata?.purpose === BLACK_FRIDAY_PURPOSE
  })
}
