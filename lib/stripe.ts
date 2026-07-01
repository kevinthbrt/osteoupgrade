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
  // Offre réservée aux membres fondateurs (is_founding_member = true) : -50% à vie
  // sur le tarif annuel équivalent (49,99€ x 12 x 50% = 299,94€/an), payable annuellement
  // uniquement. Le prix doit correspondre au Price Stripe (STRIPE_PRICE_PREMIUM_ANNUAL_FOUNDER).
  premium_annual_founder: {
    name: 'Premium Fondateur',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL_FOUNDER || '',
    amount: 29994, // 299,94€/an (-50% à vie)
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
