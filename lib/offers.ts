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
  /** Clé du catalogue Stripe pour le tarif Fondateur annuel. */
  foundingPlanType: string
  name: string
  tagline: string
  monthlyAmount: number
  /** Tarif annuel standard : deux mois offerts par rapport au mensuel. */
  annualAmount: number
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
    foundingPlanType: 'founding_osteoflow_annual',
    name: 'MyOsteoFlow',
    tagline: 'Le logiciel de cabinet, pour gérer votre pratique au quotidien.',
    monthlyAmount: 2999,
    annualAmount: 29999,
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
    foundingPlanType: 'founding_annual',
    name: 'Premium',
    tagline: 'Les deux outils réunis. Gérer votre cabinet et faire progresser votre pratique.',
    monthlyAmount: 4999,
    annualAmount: 49999,
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
    foundingPlanType: 'founding_osteoupgrade_annual',
    name: 'OsteoUpgrade',
    tagline: 'La plateforme de formation, pour faire progresser votre pratique.',
    monthlyAmount: 2999,
    annualAmount: 29999,
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
export function pricingFor(offer: Offer, interval: BillingInterval) {
  return interval === 'month'
    ? { planType: offer.planType, amount: offer.monthlyAmount, suffix: '/mois' }
    : { planType: offer.annualPlanType, amount: offer.annualAmount, suffix: '/an' }
}

/**
 * Tarif catalogue facturé à un abonné, d'après son profil (mensuel, annuel ou
 * Fondateur). Une remise par code promo n'y figure pas, comme partout ailleurs
 * sur le site : Stripe l'applique sur la facture.
 */
export function billedPriceFor(
  offer: Offer,
  profile: {
    billing_interval?: string | null
    is_founding_member?: boolean | null
  } | null | undefined
): { amount: number; suffix: '/mois' | '/an'; monthlyEquivalent: number } {
  if (profile?.is_founding_member) {
    return { amount: offer.foundingAnnualAmount, suffix: '/an', monthlyEquivalent: Math.round(offer.foundingAnnualAmount / 12) }
  }
  if (profile?.billing_interval === 'year') {
    return { amount: offer.annualAmount, suffix: '/an', monthlyEquivalent: Math.round(offer.annualAmount / 12) }
  }
  return { amount: offer.monthlyAmount, suffix: '/mois', monthlyEquivalent: offer.monthlyAmount }
}

/** Montant rond sans décimales (« 20 € »), sinon au format habituel. */
function montantCourt(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100} €` : formatAmount(cents)
}

/**
 * Variables de l'email d'incitation au bundle (J+21), au tarif de l'abonné.
 *
 * L'email citait en dur les tarifs mensuels publics : faux pour un abonné
 * annuel ou un membre fondateur, à qui Premium coûte
 * aussi autre chose. On compare donc son offre et Premium sur la même grille.
 * `null` pour le bundle lui-même, qui n'a rien à ajouter.
 */
export function upsellVariablesFor(planType: string): Record<string, string> | null {
  const offre = OFFERS.find((o) =>
    [o.planType, o.annualPlanType, o.foundingPlanType].includes(planType)
  )
  const bundle = OFFERS.find((o) => o.id === 'bundle')
  if (!offre || !bundle || offre.id === 'bundle') return null

  const grille =
    planType === offre.foundingPlanType ? 'foundingAnnualAmount'
        : planType === offre.annualPlanType ? 'annualAmount'
          : 'monthlyAmount'
  const suffixe = grille === 'monthlyAmount' ? '/mois' : '/an'
  const periode = grille === 'monthlyAmount' ? 'par mois' : 'par an'

  return {
    upsell_prix_actuel: `${formatAmount(offre[grille])}${suffixe}`,
    upsell_prix_premium: `${formatAmount(bundle[grille])}${suffixe}`,
    upsell_ecart: `${montantCourt(bundle[grille] - offre[grille])} de plus ${periode}`,
    upsell_prix_seul: `${formatAmount(offre[grille])}${suffixe}`,
  }
}

/**
 * Supplément pour passer d'une offre seule à Premium, au tarif de l'abonné :
 * « 20 € de plus par mois » en mensuel, « 200 € de plus par an » en annuel,
 * « 120 € » pour un fondateur.
 * `null` si l'abonné n'a pas d'offre seule.
 */
export function upgradeSupplementFor(
  plan: Plan,
  profile: Parameters<typeof billedPriceFor>[1]
): string | null {
  const actuelle = plan === 'osteoflow' || plan === 'osteoupgrade' ? offerOf(plan) : null
  const bundle = offerOf('bundle')
  if (!actuelle || !bundle) return null
  const avant = billedPriceFor(actuelle, profile)
  const apres = billedPriceFor(bundle, profile)
  return `${montantCourt(apres.amount - avant.amount)} de plus ${avant.suffix === '/an' ? 'par an' : 'par mois'}`
}

/** Offres complémentaires proposées à un abonné (upsell vers le bundle). */
export function upgradeTargetsFor(plan: Plan): Offer[] {
  if (plan === 'osteoflow' || plan === 'osteoupgrade') {
    return OFFERS.filter((o) => o.id === 'bundle')
  }
  return []
}
