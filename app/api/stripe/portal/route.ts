import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le profil utilisateur avec les infos d'engagement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_start_date, commitment_end_date, role, plan, is_founding_member')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Pas de client Stripe associé' }, { status: 400 })
    }

    // Calculer si l'utilisateur est encore dans sa période d'engagement
    const now = new Date()
    const commitmentEndDate = profile.commitment_end_date ? new Date(profile.commitment_end_date) : null
    const isInCommitment = commitmentEndDate && now < commitmentEndDate

    console.log('🔍 Portal configuration check:', {
      userId: user.id,
      commitmentEndDate: commitmentEndDate?.toISOString(),
      now: now.toISOString(),
      isInCommitment,
      role: profile.role,
      plan: profile.plan,
      grille: profile.is_founding_member ? 'fondateur' : 'standard'
    })

    // Choix de la configuration du portail.
    //
    // Deux grilles distinctes autorisent le changement d'offre : les tarifs
    // Fondateur (-50 % à vie) vivent sur les mêmes produits Stripe que les
    // tarifs publics. Proposer la grille standard à un membre fondateur lui
    // ferait perdre sa remise à vie en changeant d'offre, sans avertissement.
    //
    // Repli sur les configurations historiques si les nouvelles ne sont pas
    // encore renseignées : le portail garde alors exactement le comportement
    // actuel, sans changement d'offre.
    const configPlans = profile.is_founding_member
      ? process.env.STRIPE_PORTAL_CONFIG_PLANS_FOUNDING
      : process.env.STRIPE_PORTAL_CONFIG_PLANS

    const portalConfig = isInCommitment
      ? process.env.STRIPE_PORTAL_CONFIG_ENGAGEMENT  // Configuration avec annulation bloquée
      : configPlans || process.env.STRIPE_PORTAL_CONFIG_LIBRE

    // Créer la session du portail client
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL}/settings/subscription`,
      ...(portalConfig && { configuration: portalConfig })
    })

    console.log('✅ Portal session created:', {
      userId: user.id,
      configUsed: isInCommitment ? 'engagement' : 'libre',
      sessionId: session.id
    })

    return NextResponse.json({
      url: session.url,
      isInCommitment,
      commitmentEndDate: commitmentEndDate?.toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error creating portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du portail' },
      { status: 500 }
    )
  }
}
