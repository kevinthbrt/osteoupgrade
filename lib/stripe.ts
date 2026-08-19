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
}

/**
 * Catalogue des offres, aligné sur les Price Stripe (cf. docs/PRICING_3_OFFRES.md).
 *
 * Trois offres, chacune déclinée en tarif standard mensuel et en tarif
 * Fondateur annuel (-50 % à vie, réservé aux comptes marqués comme tels et
 * revérifié dans /api/stripe/checkout — jamais un simple code transmissible).
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

/** Offres proposées à la souscription (les tarifs Fondateur sont exclus). */
export const PUBLIC_PLAN_TYPES = ['premium_monthly', 'osteoflow_monthly', 'osteoupgrade_monthly'] as const

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
