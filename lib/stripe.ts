import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
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
    priceId: process.env.STRIPE_PRICE_GOLD_ANNUAL || '',
    amount: 49900, // 499€/an (prix normal)
    promoAmount: 39900, // 399€/an (prix promotionnel)
    displayPrice: '499€',
    promoDisplayPrice: '399€',
    displayInterval: 'an',
    currency: 'eur',
    interval: 'year',
    commitment: 0, // Sans engagement
    isAnnual: true,
    // Toggle pour activer/désactiver la promotion
    // À changer dans les variables d'environnement: STRIPE_GOLD_PROMO_ACTIVE=true
    isPromoActive: process.env.STRIPE_GOLD_PROMO_ACTIVE === 'true'
  }
}

// Helper pour obtenir le prix actuel de Gold (avec ou sans promo)
export const getGoldPrice = () => {
  const goldPlan = STRIPE_PLANS.premium_gold_annual
  return goldPlan.isPromoActive ? goldPlan.promoAmount : goldPlan.amount
}

export const getGoldDisplayPrice = () => {
  const goldPlan = STRIPE_PLANS.premium_gold_annual
  return goldPlan.isPromoActive ? goldPlan.promoDisplayPrice : goldPlan.displayPrice
}
