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
  premium_silver: {
    name: 'Premium Silver',
    priceId: process.env.STRIPE_PRICE_SILVER || '',
    amount: 29900, // 299€/an
    currency: 'eur',
    interval: 'year'
  },
  premium_gold: {
    name: 'Premium Gold',
    priceId: process.env.STRIPE_PRICE_GOLD || '',
    amount: 49900, // 499€/an
    currency: 'eur',
    interval: 'year'
  }
}
