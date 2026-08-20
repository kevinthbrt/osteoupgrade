/**
 * Catalogue d'affichage des offres.
 *
 * Volontairement séparé de `lib/stripe.ts` : ce dernier instancie le SDK Stripe
 * et exige `STRIPE_SECRET_KEY`, il ne peut donc jamais être importé par un
 * composant client. Ce module-ci ne contient que des données d'affichage et
 * reste utilisable partout — landing publique comprise.
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
  /** Clé du catalogue Stripe pour le tarif Fondateur annuel. */
  foundingPlanType: string
  name: string
  tagline: string
  monthlyAmount: number
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
    foundingPlanType: 'founding_osteoflow_annual',
    name: 'MyOsteoFlow',
    tagline: 'Le logiciel de cabinet, pour gérer votre pratique au quotidien.',
    monthlyAmount: 2999,
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
    foundingPlanType: 'founding_annual',
    name: 'Premium',
    tagline: 'Les deux outils réunis. Gérer votre cabinet et faire progresser votre pratique.',
    monthlyAmount: 4999,
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
    foundingPlanType: 'founding_osteoupgrade_annual',
    name: 'OsteoUpgrade',
    tagline: 'La plateforme de formation, pour faire progresser votre pratique.',
    monthlyAmount: 2999,
    foundingAnnualAmount: 17994,
    features: [
      'E-learning complet et quiz',
      'Bibliothèque de tests orthopédiques + suggestions par IA',
      'Module pratique en vidéo',
      'OsteoFlash — flashcards',
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

/** Offres complémentaires proposées à un abonné (upsell vers le bundle). */
export function upgradeTargetsFor(plan: Plan): Offer[] {
  if (plan === 'osteoflow' || plan === 'osteoupgrade') {
    return OFFERS.filter((o) => o.id === 'bundle')
  }
  return []
}
