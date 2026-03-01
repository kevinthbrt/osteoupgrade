import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true
})

// Prix des abonnements (configurés dans Stripe Dashboard)
// Nouvelle structure: Silver sans engagement, Gold annuel uniquement
export const STRIPE_PLANS = {
  premium_silver_monthly: {
    name: 'Premium Silver',
    planType: 'premium_silver',
    priceId: process.env.STRIPE_PRICE_SILVER_MONTHLY || '',
    amount: 2900, // 29€/mois
    displayPrice: '29€',
    displayInterval: 'mois',
    currency: 'eur',
    interval: 'month',
    commitment: 0, // Sans engagement
    isAnnual: false
  },
  premium_silver_annual: {
    name: 'Premium Silver',
    planType: 'premium_silver',
    priceId: process.env.STRIPE_PRICE_SILVER_ANNUAL || '',
    amount: 24000, // 240€/an
    displayPrice: '240€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    commitment: 0, // Sans engagement
    isAnnual: true
  },
  premium_gold_annual: {
    name: 'Premium Gold',
    planType: 'premium_gold',
    // Utiliser le prix promo si activé, sinon le prix normal
    // IMPORTANT: Vous devez créer DEUX prix dans Stripe Dashboard:
    // 1. STRIPE_PRICE_GOLD_ANNUAL = 499€/an (prix normal)
    // 2. STRIPE_PRICE_GOLD_ANNUAL_PROMO = 399€/an (prix promo)
    priceId:
      process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true'
        ? process.env.STRIPE_PRICE_GOLD_ANNUAL_PROMO || process.env.STRIPE_PRICE_GOLD_ANNUAL || ''
        : process.env.STRIPE_PRICE_GOLD_ANNUAL || '',
    // Montant réel basé sur la promo
    amount: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true' ? 39900 : 49900,
    displayPrice: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true' ? '399€' : '499€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    commitment: 0, // Sans engagement
    isAnnual: true,
    isPromoActive: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true'
  }
}

// Helper pour obtenir le prix actuel de Gold
export const getGoldPrice = () => {
  return STRIPE_PLANS.premium_gold_annual.amount
}

export const getGoldDisplayPrice = () => {
  return STRIPE_PLANS.premium_gold_annual.displayPrice
}
