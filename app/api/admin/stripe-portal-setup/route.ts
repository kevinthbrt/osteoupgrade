import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { verifyAdmin } from '@/lib/api-guards'

/**
 * Crée (ou met à jour) les trois configurations du portail client Stripe qui
 * autorisent le changement d'offre (cf. docs/PRICING_3_OFFRES.md et
 * docs/PRICING_ANNUEL_PARTENAIRE.md).
 *
 * Pourquoi une route d'administration plutôt qu'un script : la création d'une
 * configuration de portail n'est pas exposée par le dashboard Stripe, qui ne
 * sait éditer que la configuration par défaut. Il faut donc passer par l'API,
 * et l'application dispose déjà de la clé secrète dans son environnement —
 * inutile de la manipuler à la main dans un terminal.
 *
 * Pourquoi DEUX configurations : les tarifs Fondateur (-50 % à vie) vivent sur
 * les mêmes produits Stripe que les tarifs publics. Une grille unique ferait
 * basculer un membre fondateur qui change d'offre sur le tarif public — il
 * perdrait sa remise à vie sans en être averti. Même raisonnement pour la
 * grille partenaire, ajoutée avec les tarifs écoles.
 *
 * Idempotent : les configurations sont retrouvées par leur metadata `grille`.
 *
 * À relancer si un tarif change ou si une offre est ajoutée — sinon le portail
 * continuerait de proposer les anciens prix. Aucun bouton dans l'interface :
 * c'est une opération de maintenance rare. Pour la déclencher, être connecté
 * en administrateur puis, depuis la console du navigateur :
 *
 *   await fetch('/api/admin/stripe-portal-setup', { method: 'POST' })
 *     .then(r => r.json()).then(console.log)
 *
 * La réponse contient les trois identifiants à reporter dans
 * STRIPE_PORTAL_CONFIG_PLANS, STRIPE_PORTAL_CONFIG_PLANS_FOUNDING et
 * STRIPE_PORTAL_CONFIG_PLANS_PARTNER, suivis
 * d'un redéploiement — les variables d'environnement ne sont lues qu'au build.
 */

export const dynamic = 'force-dynamic'

const RETOUR = `${process.env.NEXT_PUBLIC_URL || 'https://www.osteo-upgrade.fr'}/settings/subscription`

type Grille = 'standard' | 'fondateur' | 'partenaire'

/**
 * Prix que chaque population a le droit de choisir.
 *
 *   - standard : mensuel et annuel (deux mois offerts), pour passer de l'un à
 *     l'autre depuis le portail ;
 *   - partenaire : mensuel et annuel partenaire (-30 %). Le tarif annuel
 *     standard n'y figure pas : un stagiaire passant à l'annuel doit tomber
 *     sur son tarif école, pas sur le tarif public ;
 *   - fondateur : uniquement les tarifs Fondateur.
 */
function grilleDePrix(grille: Grille) {
  const clefs =
    grille === 'fondateur'
      ? ['founding_annual', 'founding_osteoflow_annual', 'founding_osteoupgrade_annual']
      : grille === 'partenaire'
        ? [
            'premium_monthly', 'partner_premium_annual',
            'osteoflow_monthly', 'partner_osteoflow_annual',
            'osteoupgrade_monthly', 'partner_osteoupgrade_annual',
          ]
        : [
            'premium_monthly', 'premium_annual',
            'osteoflow_monthly', 'osteoflow_annual',
            'osteoupgrade_monthly', 'osteoupgrade_annual',
          ]

  return clefs.map((clef) => {
    const plan = STRIPE_PLANS[clef]
    if (!plan?.priceId) throw new Error(`Price ID manquant pour ${clef} — variable d'environnement absente`)
    return plan
  })
}

async function produitDuPrix(priceId: string): Promise<string> {
  const price = await stripe.prices.retrieve(priceId)
  return typeof price.product === 'string' ? price.product : (price.product as any).id
}

async function construireParametres(grille: Grille) {
  const plans = grilleDePrix(grille)

  // Le portail attend une entrée par produit, avec tous ses prix autorisés :
  // mensuel et annuel d'une même offre partagent le même produit.
  const parProduit = new Map<string, string[]>()
  for (const p of plans) {
    const produit = await produitDuPrix(p.priceId)
    parProduit.set(produit, [...(parProduit.get(produit) ?? []), p.priceId])
  }
  const produits = Array.from(parProduit, ([product, prices]) => ({ product, prices }))

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
        products: produits,
        // Prorata facturé immédiatement : c'est ce que les CGU (art. 5.4)
        // annoncent, et ce qui rend l'upgrade effectif tout de suite.
        proration_behavior: 'always_invoice',
        // Un changement d'offre pendant l'essai laisse courir les jours
        // restants. Le comportement par défaut de Stripe (`end_trial`) mettait
        // fin à l'essai et déclenchait le prélèvement sur-le-champ : le
        // 20/08/2026, un abonné a perdu ses 7 jours gratuits pour avoir changé
        // d'offre trois minutes après avoir souscrit, sans le moindre
        // avertissement — le portail est chez Stripe, nos écrans n'y sont pas.
        // `trial_used_at` empêche déjà tout second essai : il n'y a rien à
        // protéger ici.
        trial_update_behavior: 'continue_trial',
      },
    },
    metadata: { app: 'osteoupgrade', grille },
  } as any
}

async function creerOuMettreAJour(grille: Grille) {
  const existantes = await stripe.billingPortal.configurations.list({ limit: 100 })
  const existante = existantes.data.find((c) => c.metadata?.grille === grille)
  const parametres = await construireParametres(grille)

  const config = existante
    ? await stripe.billingPortal.configurations.update(existante.id, parametres)
    : await stripe.billingPortal.configurations.create(parametres)

  return { id: config.id, cree: !existante }
}

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const standard = await creerOuMettreAJour('standard')
    const fondateur = await creerOuMettreAJour('fondateur')
    const partenaire = await creerOuMettreAJour('partenaire')

    return NextResponse.json({
      standard,
      fondateur,
      partenaire,
      variables: {
        STRIPE_PORTAL_CONFIG_PLANS: standard.id,
        STRIPE_PORTAL_CONFIG_PLANS_FOUNDING: fondateur.id,
        STRIPE_PORTAL_CONFIG_PLANS_PARTNER: partenaire.id,
      },
      rappel:
        "Renseignez ces trois variables dans Vercel puis redéployez : les variables d'environnement ne sont lues qu'au build.",
    })
  } catch (error: any) {
    console.error('[stripe-portal-setup]', error?.message)
    return NextResponse.json({ error: error?.message || 'Erreur Stripe' }, { status: 500 })
  }
}
