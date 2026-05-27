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
    amount: 3500, // 35€/mois
    displayPrice: '35€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    isAnnual: false
  },
  premium_annual: {
    name: 'Premium',
    planType: 'premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || '',
    amount: 29900, // 299€/an
    displayPrice: '299€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    isAnnual: true
  }
}
