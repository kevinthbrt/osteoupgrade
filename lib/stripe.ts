import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true
})

// Prix de l'abonnement (configuré dans Stripe Dashboard)
// Offre unique : 49,99€/mois, sans engagement, prélevé automatiquement chaque mois
// jusqu'à annulation. Le prix doit correspondre au Price Stripe (STRIPE_PRICE_PREMIUM_MONTHLY).
export const STRIPE_PLANS = {
  premium_monthly: {
    name: 'Premium',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    amount: 4999, // 49,99€/mois
    displayPrice: '49,99€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false
  },
  // Offre "Membre Fondateur" (-50% à vie, facturation annuelle) réservée aux
  // comptes profiles.is_founding_member = true, revérifié côté serveur dans
  // /api/stripe/checkout — jamais un simple code que quelqu'un pourrait
  // transmettre, l'accès à ce plan dépend uniquement du compte connecté.
  founding_annual: {
    name: 'Premium Fondateur',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_FOUNDING_ANNUAL || '',
    amount: 29994, // 299,94€/an (-50% vs 49,99€/mois)
    displayPrice: '299,94€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true
  }
}

// Montant offert lors d'un parrainage validé (la valeur d'un mois d'abonnement),
// crédité sur le solde Stripe du parrain ET du filleul → leur mois suivant est offert.
export const REFERRAL_FREE_MONTH_AMOUNT = STRIPE_PLANS.premium_monthly.amount

// Durée de l'essai gratuit offert aux comptes free lors de leur premier
// abonnement (carte requise dès l'inscription, conversion automatique en
// abonnement payant à l'issue de l'essai sauf annulation). Un seul essai par
// compte (voir profiles.trial_used_at).
export const FREE_TRIAL_DAYS = 7
