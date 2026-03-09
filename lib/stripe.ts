import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }
  return secretKey
}

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeSecretKey(), {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// Lazy proxy so importing route modules does not fail during build-time analysis.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})

// Prix des abonnements (configures dans Stripe Dashboard)
// Nouvelle structure: Silver sans engagement, Gold annuel uniquement
export const STRIPE_PLANS = {
  premium_silver_monthly: {
    name: 'Premium Silver',
    planType: 'premium_silver',
    priceId: process.env.STRIPE_PRICE_SILVER_MONTHLY || '',
    amount: 2900,
    displayPrice: '29EUR',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    commitment: 0,
    isAnnual: false,
  },
  premium_silver_annual: {
    name: 'Premium Silver',
    planType: 'premium_silver',
    priceId: process.env.STRIPE_PRICE_SILVER_ANNUAL || '',
    amount: 24000,
    displayPrice: '240EUR',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    commitment: 0,
    isAnnual: true,
  },
  premium_gold_annual: {
    name: 'Premium Gold',
    planType: 'premium_gold',
    priceId:
      process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true'
        ? process.env.STRIPE_PRICE_GOLD_ANNUAL_PROMO || process.env.STRIPE_PRICE_GOLD_ANNUAL || ''
        : process.env.STRIPE_PRICE_GOLD_ANNUAL || '',
    amount: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true' ? 39900 : 49900,
    displayPrice: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true' ? '399EUR' : '499EUR',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    commitment: 0,
    isAnnual: true,
    isPromoActive: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true',
  },
}

export const getGoldPrice = () => {
  return STRIPE_PLANS.premium_gold_annual.amount
}

export const getGoldDisplayPrice = () => {
  return STRIPE_PLANS.premium_gold_annual.displayPrice
}
