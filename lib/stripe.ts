import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true
})

// Prix des abonnements (configurés dans Stripe Dashboard)
// Les prix sont maintenant mensuels avec un engagement de 12 mois via Subscription Schedules
export const STRIPE_PLANS = {
  premium_silver: {
    name: 'Premium Silver',
    priceId: process.env.STRIPE_PRICE_SILVER || '',
    monthlyAmount: 2992, // 29.92€/mois (arrondi à 30€)
    yearlyAmount: 35900, // 359€/an total (12 x 29.92€)
    displayPrice: '30€/mois',
    currency: 'eur',
    interval: 'month',
    commitment: 12 // Engagement de 12 mois
  },
  premium_gold: {
    name: 'Premium Gold',
    priceId: process.env.STRIPE_PRICE_GOLD || '',
    monthlyAmount: 4167, // 41.67€/mois (arrondi à 42€)
    yearlyAmount: 50000, // 500€/an total (12 x 41.67€)
    displayPrice: '42€/mois',
    currency: 'eur',
    interval: 'month',
    commitment: 12 // Engagement de 12 mois
  }
}
