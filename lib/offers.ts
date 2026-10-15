/**
 * Catalogue d'affichage des offres.
 *
 * Volontairement séparé de `lib/stripe.ts` : ce dernier instancie le SDK Stripe
 * et exige `STRIPE_SECRET_KEY`, il ne peut donc jamais être importé par un
 * composant client. Ce module-ci ne contient que des données d'affichage et
 * reste utilisable partout, landing publique comprise.
 *
 * Les montants sont la source unique des prix affichés : plus aucun
 * « 49,99€ » en dur dans les pages.
 */

import type { Plan } from '@/lib/entitlements'

export type OfferId = Exclude<Plan, 'free'>

export type Offer = {
  id: OfferId
  /** Clé du catalogue Stripe (`STRIPE_PLANS`) pour le tarif standard mensuel. */
  planType: string
  /** Clé du catalogue Stripe pour le tarif standard annuel. */
  annualPlanType: string
  /** Clé du catalogue Stripe pour le tarif partenaire annuel (écoles). */
  partnerPlanType: string
  /** Clé du catalogue Stripe pour le tarif Fondateur annuel. */
  foundingPlanType: string
  name: string
  tagline: string
  monthlyAmount: number
  /** Tarif annuel standard : deux mois offerts par rapport au mensuel. */
  annualAmount: number
  /** Tarif annuel partenaire : -30 % sur le tarif annuel standard. */
  partnerAnnualAmount: number
  foundingAnnualAmount: number
  features: string[]
  /** Mise en avant sur la grille tarifaire. */
  highlighted: boolean
}

/** Formate un montant en centimes : 4999 → « 49,99 € ». */
export function formatAmount(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`
}

export const OFFERS: Offer[] = [
  {
    id: 'osteoflow',
    planType: 'osteoflow_monthly',
    annualPlanType: 'osteoflow_annual',
    partnerPlanType: 'partner_osteoflow_annual',
    foundingPlanType: 'founding_osteoflow_annual',
    name: 'MyOsteoFlow',
    tagline: 'Le logiciel de cabinet, pour gérer votre pratique au quotidien.',
    monthlyAmount: 2999,
    annualAmount: 29999,
    partnerAnnualAmount: 20999,
    foundingAnnualAmount: 17994,
    features: [
      'Dossiers patients et consultations',
      'Prise de note par dictée vocale IA',
      'Aide au raisonnement clinique (hypothèses)',
      'Facturation et comptabilité',
      'Fiches d’exercices patients + export PDF',
      'Objectifs et statistiques de cabinet',
    ],
    highlighted: false,
  },
  {
    id: 'bundle',
    planType: 'premium_monthly',
    annualPlanType: 'premium_annual',
    partnerPlanType: 'partner_premium_annual',
    foundingPlanType: 'founding_annual',
    name: 'Premium',
    tagline: 'Les deux outils réunis. Gérer votre cabinet et faire progresser votre pratique.',
    monthlyAmount: 4999,
    annualAmount: 49999,
    partnerAnnualAmount: 34999,
    foundingAnnualAmount: 29994,
    features: [
      'Tout MyOsteoFlow',
      'Tout OsteoUpgrade',
      'Un seul abonnement, une seule facture',
      'Parrainage : 1 mois offert (parrain & filleul)',
    ],
    highlighted: true,
  },
  {
    id: 'osteoupgrade',
    planType: 'osteoupgrade_monthly',
    annualPlanType: 'osteoupgrade_annual',
    partnerPlanType: 'partner_osteoupgrade_annual',
    foundingPlanType: 'founding_osteoupgrade_annual',
    name: 'OsteoUpgrade',
    tagline: 'La plateforme de formation, pour faire progresser votre pratique.',
    monthlyAmount: 2999,
    annualAmount: 29999,
    partnerAnnualAmount: 20999,
    foundingAnnualAmount: 17994,
    features: [
      'E-learning complet et quiz',
      'Bibliothèque de tests orthopédiques + suggestions par IA',
      'Module pratique en vidéo',
      'OsteoFlash : flashcards',
      'Revue de littérature mensuelle',
      'Topographie clinique',
    ],
    highlighted: false,
  },
]

export function offerOf(plan: Plan): Offer | null {
  return OFFERS.find((o) => o.id === plan) ?? null
}

/** Économie réalisée sur le bundle par rapport aux deux offres séparées. */
export const BUNDLE_SAVING = (() => {
  const separate = 2999 * 2
  const bundle = 4999
  return {
    separateAmount: separate,
    bundleAmount: bundle,
    savedAmount: separate - bundle,
    savedPercent: Math.round(((separate - bundle) / separate) * 100),
  }
})()

/** Remise de l'offre partenaire sur le tarif annuel standard. */
export const PARTNER_ANNUAL_DISCOUNT_PERCENT = 30

/**
 * Économie de l'annuel par rapport à douze mensualités : « deux mois offerts ».
 * Calculée plutôt qu'écrite, pour rester juste si un tarif change.
 */
export function annualSavingOf(offer: Offer) {
  const twelveMonths = offer.monthlyAmount * 12
  return {
    twelveMonthsAmount: twelveMonths,
    savedAmount: twelveMonths - offer.annualAmount,
    freeMonths: Math.round((twelveMonths - offer.annualAmount) / offer.monthlyAmount),
    monthlyEquivalent: Math.round(offer.annualAmount / 12),
  }
}

export type BillingInterval = 'month' | 'year'

/** Clé de tarif et montant d'une offre pour un rythme de facturation donné. */
export function pricingFor(offer: Offer, interval: BillingInterval, partner = false) {
  if (interval === 'month') {
    return { planType: offer.planType, amount: offer.monthlyAmount, suffix: '/mois' }
  }
  return partner
    ? { planType: offer.partnerPlanType, amount: offer.partnerAnnualAmount, suffix: '/an' }
    : { planType: offer.annualPlanType, amount: offer.annualAmount, suffix: '/an' }
}

/**
 * Tarif réellement facturé à un abonné, d'après son profil.
 *
 * Un abonné annuel hors Fondateur portant un nom de partenaire est un
 * stagiaire d'école : les codes partenaires ne s'appliquent pas aux tarifs
 * annuels (cf. /api/stripe/checkout), seul le tarif école pose ce nom.
 */
export function billedPriceFor(
  offer: Offer,
  profile: {
    billing_interval?: string | null
    is_founding_member?: boolean | null
    partner_discount_name?: string | null
  } | null | undefined
): { amount: number; suffix: '/mois' | '/an'; monthlyEquivalent: number } {
  if (profile?.is_founding_member) {
    return { amount: offer.foundingAnnualAmount, suffix: '/an', monthlyEquivalent: Math.round(offer.foundingAnnualAmount / 12) }
  }
  if (profile?.billing_interval === 'year') {
    const amount = profile.partner_discount_name ? offer.partnerAnnualAmount : offer.annualAmount
    return { amount, suffix: '/an', monthlyEquivalent: Math.round(amount / 12) }
  }
  return { amount: offer.monthlyAmount, suffix: '/mois', monthlyEquivalent: offer.monthlyAmount }
}

/** Offres complémentaires proposées à un abonné (upsell vers le bundle). */
export function upgradeTargetsFor(plan: Plan): Offer[] {
  if (plan === 'osteoflow' || plan === 'osteoupgrade') {
    return OFFERS.filter((o) => o.id === 'bundle')
  }
  return []
}
