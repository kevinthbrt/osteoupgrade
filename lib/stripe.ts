import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true
})

// Prix des abonnements (à configurer dans Stripe Dashboard)
export const STRIPE_PLANS = {
  premium_silver: {
    name: 'Premium Silver',
    priceId: process.env.STRIPE_PRICE_SILVER || '', // À configurer
    amount: 2900, // 29€
    currency: 'eur',
    interval: 'month'
  },
  premium_gold: {
    name: 'Premium Gold',
    priceId: process.env.STRIPE_PRICE_GOLD || '', // À configurer
    amount: 4900, // 49€
    currency: 'eur',
    interval: 'month'
  }
}
