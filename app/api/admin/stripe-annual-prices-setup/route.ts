import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { verifyAdmin } from '@/lib/api-guards'

/**
 * Crée dans Stripe les trois prix annuels (deux mois offerts), chacun sur un
 * produit dédié « … (annuel) », distinct du produit de l'offre mensuelle
 * (cf. docs/PRICING_ANNUEL.md).
 *
 * Pourquoi un produit à part : Stripe ne sait restreindre un code promo que
 * par produit. Tant que mensuel et annuel partageaient un produit, un code ne
 * pouvait pas viser l'un sans l'autre. Le portail client, lui, permet de
 * passer d'un produit à l'autre : le passage mensuel ↔ annuel reste possible.
 *
 * Chaque prix porte `metadata.plan`, que lit le webhook pour accorder les
 * droits (voir planFromSubscription).
 *
 * Idempotent : le produit est retrouvé par sa metadata `annuel_de`, le prix
 * par sa `lookup_key`. Un prix Stripe n'est pas modifiable en montant : s'il
 * existe avec un autre montant, la route le signale au lieu de l'écraser.
 *
 * Range aussi les prix de la première version, devenus inutiles : les prix
 * annuels créés sur le produit mensuel et les prix « tarif école ». Ils sont
 * archivés (un prix Stripe ne se supprime pas), ce qui n'affecte aucun
 * abonnement existant ; aucun n'en utilisait au moment du changement.
 *
 * Connecté en administrateur, depuis la console du navigateur :
 *
 *   await fetch('/api/admin/stripe-annual-prices-setup', { method: 'POST' })
 *     .then(r => r.json()).then(console.log)
 *
 * Puis reporter les trois variables renvoyées dans Vercel, redéployer, et
 * relancer /api/admin/stripe-portal-setup pour mettre le portail à jour.
 */

export const dynamic = 'force-dynamic'

const A_CREER: { clef: string; mensuel: string; variable: string }[] = [
  { clef: 'premium_annual', mensuel: 'premium_monthly', variable: 'STRIPE_PRICE_PREMIUM_ANNUAL' },
  { clef: 'osteoflow_annual', mensuel: 'osteoflow_monthly', variable: 'STRIPE_PRICE_OSTEOFLOW_ANNUAL' },
  { clef: 'osteoupgrade_annual', mensuel: 'osteoupgrade_monthly', variable: 'STRIPE_PRICE_OSTEOUPGRADE_ANNUAL' },
]

/** Lookup keys de la première version, à archiver. */
const ANCIENNES_CLES = [
  'osteoupgrade_premium_annual',
  'osteoupgrade_osteoflow_annual',
  'osteoupgrade_osteoupgrade_annual',
  'osteoupgrade_partner_premium_annual',
  'osteoupgrade_partner_osteoflow_annual',
  'osteoupgrade_partner_osteoupgrade_annual',
]

async function produitAnnuel(clef: string, nomMensuel: string, plan: string): Promise<string> {
  for await (const produit of stripe.products.list({ limit: 100 })) {
    if (produit.metadata?.annuel_de === clef) {
      if (!produit.active) await stripe.products.update(produit.id, { active: true })
      return produit.id
    }
  }
  const cree = await stripe.products.create({
    name: `${nomMensuel} (annuel)`,
    metadata: { annuel_de: clef, plan },
  })
  return cree.id
}

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

      const mensuelStripe = await stripe.prices.retrieve(prixMensuel, { expand: ['product'] })
      const nomMensuel = typeof mensuelStripe.product === 'object' && 'name' in mensuelStripe.product
        ? mensuelStripe.product.name
        : offre.name
      const produit = await produitAnnuel(clef, nomMensuel, offre.plan)
      const lookupKey = `osteoupgrade_${clef}_v2`

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

    // Prix de la première version : archivés, jamais supprimés.
    const archives: string[] = []
    const anciens = await stripe.prices.list({ lookup_keys: ANCIENNES_CLES, limit: 10 })
    for (const ancien of anciens.data) {
      if (ancien.active) {
        await stripe.prices.update(ancien.id, { active: false })
        archives.push(`${ancien.lookup_key} (${ancien.id})`)
      }
    }

    return NextResponse.json({
      variables,
      details,
      archives,
      rappel:
        "Remplacez ces trois variables dans Vercel, supprimez les variables STRIPE_PRICE_PARTNER_* et STRIPE_PORTAL_CONFIG_PLANS_PARTNER, redéployez, puis lancez POST /api/admin/stripe-portal-setup.",
    })
  } catch (error: any) {
    console.error('[stripe-annual-prices-setup]', error?.message)
    return NextResponse.json({ error: error?.message || 'Erreur Stripe' }, { status: 500 })
  }
}
