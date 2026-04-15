import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true
})

// Prix des abonnements (configurés dans Stripe Dashboard)
export const STRIPE_PLANS = {
  premium_monthly: {
    name: 'Premium',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    amount: 2900, // 29€/mois
    displayPrice: '29€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false
  },
  premium_annual: {
    name: 'Premium',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || '',
    amount: 24000, // 240€/an
    displayPrice: '240€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true
  }
}
