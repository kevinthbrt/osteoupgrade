import Stripe from 'stripe'
import { isPlan, type Plan } from '@/lib/entitlements'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true
})

export type StripePlan = {
  /** Libellé commercial affiché à l'utilisateur. */
  name: string
  /** Offre accordée (écrite dans profiles.plan par le webhook). */
  plan: Plan
  priceId: string
  amount: number
  displayPrice: string
  displayInterval: string
  currency: string
  interval: 'month' | 'year'
  isAnnual: boolean
  /** Réservé aux comptes profiles.is_founding_member (revérifié côté serveur). */
  isFounding: boolean
  /**
   * Réservé aux stagiaires d'une école partenaire (table
   * partner_program_members, revérifié côté serveur).
   */
  isPartner?: boolean
}

/**
 * Catalogue des offres, aligné sur les Price Stripe (cf. docs/PRICING_3_OFFRES.md
 * et docs/PRICING_ANNUEL_PARTENAIRE.md).
 *
 * Trois offres, chacune déclinée en quatre tarifs :
 *   - standard mensuel ;
 *   - standard annuel (deux mois offerts) ;
 *   - partenaire annuel (-30 % sur l'annuel, réservé aux stagiaires d'une
 *     école partenaire, revérifié dans /api/stripe/checkout) ;
 *   - Fondateur annuel (-50 % à vie, réservé aux comptes marqués comme tels et
 *     revérifié dans /api/stripe/checkout, jamais un simple code transmissible).
 *
 * Les clés de cet objet sont les `planType` transmis par le front et stockés
 * dans les metadata Stripe. L'offre réellement accordée est portée par le
 * champ `plan` — et, côté webhook, relue depuis les metadata du Price pour ne
 * pas dépendre de la configuration d'environnement (voir planFromSubscription).
 */
export const STRIPE_PLANS: Record<string, StripePlan> = {
  // ── Bundle : OsteoUpgrade + MyOsteoFlow ──────────────────────────────────
  // Clé historique `premium_monthly` conservée : elle est déjà stockée dans
  // les metadata des abonnements en cours et référencée par le front.
  premium_monthly: {
    name: 'Premium',
    plan: 'bundle',
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    amount: 4999,
    displayPrice: '49,99€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false,
    isFounding: false
  },
  premium_annual: {
    name: 'Premium annuel',
    plan: 'bundle',
    priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || '',
    amount: 49999,
    displayPrice: '499,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false
  },
  partner_premium_annual: {
    name: 'Premium tarif école',
    plan: 'bundle',
    priceId: process.env.STRIPE_PRICE_PARTNER_PREMIUM_ANNUAL || '',
    amount: 34999,
    displayPrice: '349,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false,
    isPartner: true
  },
  founding_annual: {
    name: 'Premium Fondateur',
    plan: 'bundle',
    priceId: process.env.STRIPE_PRICE_FOUNDING_ANNUAL || '',
    amount: 29994,
    displayPrice: '299,94€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: true
  },

  // ── MyOsteoFlow seul ─────────────────────────────────────────────────────
  osteoflow_monthly: {
    name: 'MyOsteoFlow',
    plan: 'osteoflow',
    priceId: process.env.STRIPE_PRICE_OSTEOFLOW_MONTHLY || '',
    amount: 2999,
    displayPrice: '29,99€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false,
    isFounding: false
  },
  osteoflow_annual: {
    name: 'MyOsteoFlow annuel',
    plan: 'osteoflow',
    priceId: process.env.STRIPE_PRICE_OSTEOFLOW_ANNUAL || '',
    amount: 29999,
    displayPrice: '299,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false
  },
  partner_osteoflow_annual: {
    name: 'MyOsteoFlow tarif école',
    plan: 'osteoflow',
    priceId: process.env.STRIPE_PRICE_PARTNER_OSTEOFLOW_ANNUAL || '',
    amount: 20999,
    displayPrice: '209,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false,
    isPartner: true
  },
  founding_osteoflow_annual: {
    name: 'MyOsteoFlow Fondateur',
    plan: 'osteoflow',
    priceId: process.env.STRIPE_PRICE_FOUNDING_OSTEOFLOW_ANNUAL || '',
    amount: 17994,
    displayPrice: '179,94€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: true
  },

  // ── OsteoUpgrade seul ────────────────────────────────────────────────────
  osteoupgrade_monthly: {
    name: 'OsteoUpgrade',
    plan: 'osteoupgrade',
    priceId: process.env.STRIPE_PRICE_OSTEOUPGRADE_MONTHLY || '',
    amount: 2999,
    displayPrice: '29,99€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false,
    isFounding: false
  },
  osteoupgrade_annual: {
    name: 'OsteoUpgrade annuel',
    plan: 'osteoupgrade',
    priceId: process.env.STRIPE_PRICE_OSTEOUPGRADE_ANNUAL || '',
    amount: 29999,
    displayPrice: '299,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false
  },
  partner_osteoupgrade_annual: {
    name: 'OsteoUpgrade tarif école',
    plan: 'osteoupgrade',
    priceId: process.env.STRIPE_PRICE_PARTNER_OSTEOUPGRADE_ANNUAL || '',
    amount: 20999,
    displayPrice: '209,99€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: false,
    isPartner: true
  },
  founding_osteoupgrade_annual: {
    name: 'OsteoUpgrade Fondateur',
    plan: 'osteoupgrade',
    priceId: process.env.STRIPE_PRICE_FOUNDING_OSTEOUPGRADE_ANNUAL || '',
    amount: 17994,
    displayPrice: '179,94€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true,
    isFounding: true
  }
}

/** Offres mensuelles publiques (base des restrictions de coupon par produit). */
export const MONTHLY_PLAN_TYPES = ['premium_monthly', 'osteoflow_monthly', 'osteoupgrade_monthly'] as const

/**
 * Offres ouvertes à tous à la souscription : les mensuelles et les annuelles
 * standard. Les tarifs Fondateur et partenaire en sont exclus.
 */
export const PUBLIC_PLAN_TYPES = [
  ...MONTHLY_PLAN_TYPES,
  'premium_annual',
  'osteoflow_annual',
  'osteoupgrade_annual',
] as const

/**
 * Produits Stripe des trois offres mensuelles publiques.
 *
 * Un coupon se restreint par produit (`applies_to.products`), pas par prix :
 * Stripe refuse `applies_to.prices` comme paramètre inconnu, et la création du
 * coupon échoue alors entièrement.
 *
 * Limite à connaître : si un tarif Fondateur est rattaché au même produit
 * qu'une offre mensuelle, la restriction ne l'écarte pas. L'exclusion des
 * tarifs Fondateur repose alors sur le serveur, qui ne pose jamais de remise
 * sur une session Fondateur (voir /api/stripe/checkout).
 */
export async function monthlyProductIds(): Promise<string[]> {
  const prix = MONTHLY_PLAN_TYPES
    .map((clef) => STRIPE_PLANS[clef]?.priceId)
    .filter((id): id is string => Boolean(id))

  const produits = await Promise.all(
    prix.map(async (id) => {
      const price = await stripe.prices.retrieve(id)
      return typeof price.product === 'string' ? price.product : price.product.id
    })
  )

  return Array.from(new Set(produits))
}

/**
 * Offre correspondant à un abonnement Stripe.
 *
 * L'ordre de résolution est délibéré :
 *   1. `price.metadata.plan`, posé sur les six Price du catalogue. C'est la
 *      source la plus fiable : elle vit dans Stripe, donc elle reste juste même
 *      si une variable d'environnement est absente ou mal configurée.
 *   2. Le priceId, comparé au catalogue ci-dessus.
 *   3. Les metadata de l'abonnement, pour les abonnements souscrits avant
 *      l'introduction des offres multiples.
 *   4. `bundle` en dernier recours : jusqu'ici une seule offre existait, tout
 *      abonnement actif non identifiable est donc un bundle. Ne jamais
 *      renvoyer `free` ici, ce qui couperait l'accès d'un abonné payant.
 */
export function planFromSubscription(subscription: any): Plan {
  const price = subscription?.items?.data?.[0]?.price

  const fromPriceMetadata = price?.metadata?.plan
  if (isPlan(fromPriceMetadata)) return fromPriceMetadata

  const priceId = typeof price === 'string' ? price : price?.id
  if (priceId) {
    const match = Object.values(STRIPE_PLANS).find((p) => p.priceId && p.priceId === priceId)
    if (match) return match.plan
  }

  const fromSubscriptionMetadata = subscription?.metadata?.plan
  if (isPlan(fromSubscriptionMetadata)) return fromSubscriptionMetadata

  const legacyPlanType = subscription?.metadata?.planType
  if (legacyPlanType && STRIPE_PLANS[legacyPlanType]) return STRIPE_PLANS[legacyPlanType].plan

  return 'bundle'
}

/**
 * Rythme de facturation d'un abonnement Stripe, écrit dans
 * `profiles.billing_interval`. `null` si le prix n'est pas lisible.
 */
export function billingIntervalFromSubscription(subscription: any): 'month' | 'year' | null {
  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval
  return interval === 'month' || interval === 'year' ? interval : null
}

/**
 * Clé du catalogue (`STRIPE_PLANS`) correspondant à un abonnement Stripe.
 *
 * `subscription.metadata.planType` est figé au checkout : il ne suit pas un
 * changement d'offre depuis le portail client. S'y fier pour le nom et le
 * tarif d'un email annoncerait l'ancienne offre — et son ancien prix — à
 * quelqu'un qui vient précisément d'en changer. On repart donc du prix
 * réellement porté par l'abonnement, et on ne retombe sur les metadata que
 * pour les abonnements antérieurs au catalogue actuel.
 */
export function planTypeFromSubscription(subscription: any, fallback = 'premium_monthly'): string {
  const price = subscription?.items?.data?.[0]?.price
  const priceId = typeof price === 'string' ? price : price?.id

  if (priceId) {
    const parPrix = Object.entries(STRIPE_PLANS).find(([, p]) => p.priceId && p.priceId === priceId)
    if (parPrix) return parPrix[0]
  }

  // Repli : l'offre est connue par les metadata du Price, mais la variable
  // d'environnement du priceId n'est pas renseignée. Plusieurs tarifs annuels
  // coexistent pour une même offre (standard, partenaire, Fondateur) : le
  // montant les départage, l'intervalle seul ne suffit plus.
  const planDuPrix = price?.metadata?.plan
  if (isPlan(planDuPrix)) {
    const annuel = price?.recurring?.interval === 'year'
    const candidats = Object.entries(STRIPE_PLANS).filter(
      ([, p]) => p.plan === planDuPrix && p.isAnnual === annuel
    )
    const parMontant = candidats.find(([, p]) => p.amount === price?.unit_amount)
    if (parMontant) return parMontant[0]
    if (candidats.length > 0) return candidats[0][0]
  }

  const legacy = subscription?.metadata?.planType
  if (legacy && STRIPE_PLANS[legacy]) return legacy

  return fallback
}

// Métadonnée utilisée pour distinguer les codes promo "partenaire" (ex: -10%
// pendant 1 an pour les diplômés d'un organisme de formation partenaire type
// IFCOPS) des codes Gold génériques gérés dans /admin/promo.
export const PARTNER_PROMO_PURPOSE = 'partner_discount'

/**
 * Montant offert lors d'un parrainage validé : la valeur d'un mois de l'offre
 * réellement souscrite par le filleul, crédité sur le solde Stripe du parrain
 * ET du filleul. Un parrainage sur MyOsteoFlow seul offre donc 29,99€, pas le
 * prix du bundle.
 */
export function referralFreeMonthAmount(plan: Plan): number {
  switch (plan) {
    case 'osteoflow':
      return STRIPE_PLANS.osteoflow_monthly.amount
    case 'osteoupgrade':
      return STRIPE_PLANS.osteoupgrade_monthly.amount
    default:
      return STRIPE_PLANS.premium_monthly.amount
  }
}

// Durée de l'essai gratuit offert aux comptes free lors de leur premier
// abonnement (carte requise dès l'inscription, conversion automatique en
// abonnement payant à l'issue de l'essai sauf annulation). Un seul essai par
// compte, quelle que soit l'offre choisie (voir profiles.trial_used_at).
export const FREE_TRIAL_DAYS = 7
