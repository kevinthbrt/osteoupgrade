/**
 * Crée les deux configurations du portail client Stripe qui autorisent le
 * changement d'offre (cf. docs/PRICING_3_OFFRES.md, phase 3).
 *
 * Pourquoi deux configurations : les tarifs Fondateur (-50 % à vie) vivent sur
 * les mêmes produits que les tarifs standard. Une configuration unique listant
 * les prix mensuels ferait basculer un membre fondateur qui change d'offre sur
 * le tarif public — il perdrait sa remise à vie sans en être averti. Chaque
 * population ne se voit donc proposer que les prix de sa propre grille.
 *
 * Le script est idempotent par nom : relancé, il met à jour la configuration
 * existante au lieu d'en créer une seconde.
 *
 * Usage :
 *   npx tsx scripts/setup-portal-configs.ts
 *
 * Variables requises : STRIPE_SECRET_KEY, et les six STRIPE_PRICE_* .
 * Affiche en sortie les deux identifiants à reporter dans
 * STRIPE_PORTAL_CONFIG_PLANS et STRIPE_PORTAL_CONFIG_PLANS_FOUNDING.
 */

import Stripe from 'stripe'

const cle = process.env.STRIPE_SECRET_KEY
if (!cle) throw new Error('STRIPE_SECRET_KEY manquante')

const stripe = new Stripe(cle, { apiVersion: '2025-11-17.clover', typescript: true })

const RETOUR = `${process.env.NEXT_PUBLIC_URL || 'https://www.osteo-upgrade.fr'}/settings/subscription`

const NOM_STANDARD = 'Offres — tarifs standard'
const NOM_FONDATEUR = 'Offres — tarifs fondateur'

function prixRequis(nom: string): string {
  const valeur = process.env[nom]
  if (!valeur) throw new Error(`${nom} manquante`)
  return valeur
}

/** Un produit et le seul prix que cette population a le droit de choisir. */
function grille(founding: boolean) {
  return founding
    ? [
        { product: 'prod_UlMtB7x2PwhWnb', prices: [prixRequis('STRIPE_PRICE_FOUNDING_ANNUAL')] },
        { product: 'prod_V6IypGYLNuW3tR', prices: [prixRequis('STRIPE_PRICE_FOUNDING_OSTEOFLOW_ANNUAL')] },
        { product: 'prod_V6IyzEUUNnj934', prices: [prixRequis('STRIPE_PRICE_FOUNDING_OSTEOUPGRADE_ANNUAL')] },
      ]
    : [
        { product: 'prod_UlMtB7x2PwhWnb', prices: [prixRequis('STRIPE_PRICE_PREMIUM_MONTHLY')] },
        { product: 'prod_V6IypGYLNuW3tR', prices: [prixRequis('STRIPE_PRICE_OSTEOFLOW_MONTHLY')] },
        { product: 'prod_V6IyzEUUNnj934', prices: [prixRequis('STRIPE_PRICE_OSTEOUPGRADE_MONTHLY')] },
      ]
}

function parametres(founding: boolean): Stripe.BillingPortal.ConfigurationCreateParams {
  return {
    business_profile: {
      privacy_policy_url: 'https://www.osteo-upgrade.fr/politique-confidentialite',
      terms_of_service_url: 'https://www.osteo-upgrade.fr/cgu',
    },
    default_return_url: RETOUR,
    features: {
      customer_update: { enabled: true, allowed_updates: ['name', 'email', 'address', 'phone'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
        cancellation_reason: {
          enabled: true,
          options: ['too_expensive', 'switched_service', 'unused', 'other'],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        products: grille(founding),
        // Le prorata est facturé immédiatement : c'est ce que les CGU (5.4)
        // annoncent, et ce qui rend l'upgrade effectif tout de suite.
        proration_behavior: 'always_invoice',
        // Un changement d'offre pendant l'essai laisse courir les jours
        // restants (cf. api/admin/stripe-portal-setup pour le détail).
        trial_update_behavior: 'continue_trial',
        // `billing_cycle_anchor` n'est pas exposé par les types Stripe installés,
        // mais sa valeur par défaut est déjà 'unchanged' : la date de
        // renouvellement ne bouge pas lors d'un changement d'offre.
      },
    },
    metadata: { app: 'osteoupgrade', grille: founding ? 'fondateur' : 'standard' },
  }
}

async function creerOuMettreAJour(nom: string, founding: boolean) {
  const existantes = await stripe.billingPortal.configurations.list({ limit: 100 })
  const existante = existantes.data.find((c) => c.metadata?.grille === (founding ? 'fondateur' : 'standard'))

  const config = existante
    ? await stripe.billingPortal.configurations.update(existante.id, parametres(founding) as any)
    : await stripe.billingPortal.configurations.create(parametres(founding))

  console.log(`${existante ? 'Mise à jour' : 'Création'} — ${nom} : ${config.id}`)
  return config.id
}

async function main() {
  const standard = await creerOuMettreAJour(NOM_STANDARD, false)
  const fondateur = await creerOuMettreAJour(NOM_FONDATEUR, true)

  console.log('\nÀ reporter dans les variables d\'environnement :\n')
  console.log(`STRIPE_PORTAL_CONFIG_PLANS=${standard}`)
  console.log(`STRIPE_PORTAL_CONFIG_PLANS_FOUNDING=${fondateur}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
