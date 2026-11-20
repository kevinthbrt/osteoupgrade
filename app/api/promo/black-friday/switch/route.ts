import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { offerOf } from '@/lib/offers'
import { planOf } from '@/lib/entitlements'
import { canSwitchToBlackFridayAnnual } from '@/lib/black-friday'
import { ensureBlackFridayCoupon } from '@/lib/black-friday-server'

export const dynamic = 'force-dynamic'

/**
 * Bascule d'un adhérent mensuel vers l'annuel de la même offre, à -30 % la
 * première année (Black Friday 2026, voir docs/BLACK_FRIDAY_2026.md).
 *
 * Plutôt que de modifier l'abonnement nous-mêmes, on ouvre le portail Stripe
 * directement sur l'écran de confirmation (`subscription_update_confirm`),
 * prix annuel et coupon déjà posés. L'adhérent y voit le montant exact avant
 * de valider, l'authentification forte de sa banque est gérée par Stripe, et
 * rien ne change tant qu'il n'a pas confirmé. Le prorata du mois en cours est
 * déduit (configuration du portail : `always_invoice`).
 *
 * Le webhook `customer.subscription.updated` met ensuite à jour
 * `billing_interval` et trace la remise.
 */
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, role, billing_interval, is_founding_member, is_complimentary, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    // Éligibilité revérifiée ici : le bouton n'est qu'un affichage.
    if (
      !profile ||
      !profile.stripe_subscription_id ||
      !canSwitchToBlackFridayAnnual({ ...profile, plan: planOf(profile) })
    ) {
      return NextResponse.json(
        { error: "L'offre Black Friday n'est pas disponible pour ce compte." },
        { status: 403 }
      )
    }

    const offre = offerOf(planOf(profile))
    const prixAnnuel = offre ? STRIPE_PLANS[offre.annualPlanType]?.priceId : null
    if (!offre || !prixAnnuel) {
      return NextResponse.json({ error: 'Tarif annuel non configuré.' }, { status: 500 })
    }

    // L'écran de confirmation exige une configuration du portail qui autorise
    // ce prix : c'est la grille standard (mensuels + annuels).
    const configuration = process.env.STRIPE_PORTAL_CONFIG_PLANS
    if (!configuration) {
      return NextResponse.json({ error: 'Portail Stripe non configuré.' }, { status: 500 })
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const item = subscription.items.data[0]
    if (!item || subscription.items.data.length !== 1) {
      return NextResponse.json({ error: 'Abonnement inattendu, contactez-nous.' }, { status: 409 })
    }
    if (item.price.recurring?.interval === 'year') {
      return NextResponse.json({ error: 'Votre abonnement est déjà annuel.' }, { status: 409 })
    }

    const coupon = await ensureBlackFridayCoupon()
    const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id || (subscription.customer as string),
      configuration,
      return_url: `${base}/settings/subscription`,
      flow_data: {
        type: 'subscription_update_confirm',
        subscription_update_confirm: {
          subscription: subscription.id,
          items: [{ id: item.id, price: prixAnnuel, quantity: 1 }],
          discounts: [{ coupon }],
        },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: `${base}/settings/subscription?black_friday=ok` },
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('🖤 Black Friday switch error:', error?.message)
    return NextResponse.json(
      { error: "La bascule vers l'annuel n'a pas pu être préparée. Réessayez ou contactez-nous." },
      { status: 500 }
    )
  }
}
