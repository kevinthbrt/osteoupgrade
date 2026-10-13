import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { verifyAdmin } from '@/lib/api-guards'

/**
 * Crée dans Stripe les six prix annuels (cf. docs/PRICING_ANNUEL_PARTENAIRE.md) :
 * trois tarifs annuels standard (deux mois offerts) et trois tarifs annuels
 * partenaires (-30 % pour les stagiaires des écoles partenaires).
 *
 * Chaque prix est rattaché au produit de l'offre mensuelle correspondante,
 * pour que le portail client permette de passer de l'un à l'autre, et porte
 * `metadata.plan` : c'est ce que lit le webhook pour accorder les droits
 * (voir planFromSubscription).
 *
 * Idempotent : chaque prix est retrouvé par sa `lookup_key`. Un prix Stripe
 * n'est pas modifiable en montant : s'il existe avec un autre montant, la
 * route le signale au lieu de l'écraser.
 *
 * Connecté en administrateur, depuis la console du navigateur :
 *
 *   await fetch('/api/admin/stripe-annual-prices-setup', { method: 'POST' })
 *     .then(r => r.json()).then(console.log)
 *
 * Puis reporter les six variables renvoyées dans Vercel, redéployer, et
 * relancer /api/admin/stripe-portal-setup pour mettre le portail à jour.
 */

export const dynamic = 'force-dynamic'

const A_CREER: { clef: string; mensuel: string; variable: string }[] = [
  { clef: 'premium_annual', mensuel: 'premium_monthly', variable: 'STRIPE_PRICE_PREMIUM_ANNUAL' },
  { clef: 'osteoflow_annual', mensuel: 'osteoflow_monthly', variable: 'STRIPE_PRICE_OSTEOFLOW_ANNUAL' },
  { clef: 'osteoupgrade_annual', mensuel: 'osteoupgrade_monthly', variable: 'STRIPE_PRICE_OSTEOUPGRADE_ANNUAL' },
  { clef: 'partner_premium_annual', mensuel: 'premium_monthly', variable: 'STRIPE_PRICE_PARTNER_PREMIUM_ANNUAL' },
  { clef: 'partner_osteoflow_annual', mensuel: 'osteoflow_monthly', variable: 'STRIPE_PRICE_PARTNER_OSTEOFLOW_ANNUAL' },
  { clef: 'partner_osteoupgrade_annual', mensuel: 'osteoupgrade_monthly', variable: 'STRIPE_PRICE_PARTNER_OSTEOUPGRADE_ANNUAL' },
]

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const variables: Record<string, string> = {}
    const details: Record<string, unknown>[] = []

    for (const { clef, mensuel, variable } of A_CREER) {
      const offre = STRIPE_PLANS[clef]
      const prixMensuel = STRIPE_PLANS[mensuel]?.priceId
      if (!prixMensuel) throw new Error(`Price ID mensuel manquant pour ${mensuel}`)

      const mensuelStripe = await stripe.prices.retrieve(prixMensuel)
      const produit = typeof mensuelStripe.product === 'string' ? mensuelStripe.product : mensuelStripe.product.id
      const lookupKey = `osteoupgrade_${clef}`

      const existants = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
      let prix = existants.data[0]
      let statut = 'existant'

      if (prix && prix.unit_amount !== offre.amount) {
        details.push({ offre: clef, statut: 'MONTANT DIFFÉRENT', priceId: prix.id, trouve: prix.unit_amount, attendu: offre.amount })
        continue
      }

      if (!prix) {
        prix = await stripe.prices.create({
          product: produit,
          currency: offre.currency,
          unit_amount: offre.amount,
          recurring: { interval: 'year' },
          lookup_key: lookupKey,
          nickname: `${offre.name} · ${offre.displayPrice}/an`,
          metadata: { plan: offre.plan, plan_type: clef },
        })
        statut = 'créé'
      }

      variables[variable] = prix.id
      details.push({ offre: clef, statut, priceId: prix.id, produit, montant: prix.unit_amount })
    }

    return NextResponse.json({
      variables,
      details,
      rappel:
        "Renseignez ces variables dans Vercel, redéployez, puis lancez POST /api/admin/stripe-portal-setup pour ajouter les tarifs annuels au portail client.",
    })
  } catch (error: any) {
    console.error('[stripe-annual-prices-setup]', error?.message)
    return NextResponse.json({ error: error?.message || 'Erreur Stripe' }, { status: 500 })
  }
}
