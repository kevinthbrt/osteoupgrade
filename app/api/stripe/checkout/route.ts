import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, STRIPE_PLANS, FREE_TRIAL_DAYS } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { planType, referralCode } = await request.json()

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const email = user.email

    console.log('📦 Stripe checkout request:', { planType, userId, email, referralCode })

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { planType: !!planType, userId: !!userId, email: !!email } },
        { status: 400 }
      )
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]

    console.log('📋 Plan selected:', plan)

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan type: ${planType}` },
        { status: 400 }
      )
    }

    if (!plan.priceId) {
      console.error('❌ Missing Price ID for plan:', planType)
      return NextResponse.json(
        {
          error: `Price ID not configured for ${planType}`,
          details: `Please set the corresponding STRIPE_PRICE environment variable`
        },
        { status: 400 }
      )
    }

    // L'offre Fondateur est réservée aux comptes marqués comme tels — revérifié
    // ici pour qu'elle ne soit jamais accessible en appelant l'API directement.
    if (planType === 'founding_annual') {
      const { data: founderProfile } = await supabase
        .from('profiles')
        .select('is_founding_member')
        .eq('id', userId)
        .single()

      if (!founderProfile?.is_founding_member) {
        return NextResponse.json(
          { error: 'Cette offre est réservée aux membres fondateurs.' },
          { status: 403 }
        )
      }
    }

    // Valider le code de parrainage (applicable à l'offre unique)
    let referrerUserId = null
    const shouldProcessReferral = Boolean(referralCode)

    if (shouldProcessReferral) {
      const { supabaseAdmin } = await import('@/lib/supabase-server')

      // 🚫 VÉRIFIER QUE L'UTILISATEUR N'A JAMAIS ÉTÉ PARRAINÉ (1 fois AU TOTAL, pas par année)
      const { data: existingReferrals, error: existingError } = await supabaseAdmin
        .from('referral_transactions')
        .select('id, created_at')
        .eq('referred_user_id', userId)
        .limit(1)

      if (existingReferrals && existingReferrals.length > 0) {
        console.warn('⚠️ User already referred before:', userId)
        return NextResponse.json(
          {
            error: 'Vous avez déjà été parrainé',
            details: 'Un utilisateur ne peut être parrainé qu\'une seule fois au total.'
          },
          { status: 400 }
        )
      }

      // Valider le code de parrainage
      const { data: referralData, error: referralError } = await supabaseAdmin
        .from('referral_codes')
        .select('user_id, is_active')
        .eq('referral_code', referralCode.toUpperCase())
        .single()

      if (referralError || !referralData) {
        console.warn('⚠️ Invalid referral code:', referralCode)
        // Don't fail the checkout, just ignore the invalid code
      } else if (!referralData.is_active) {
        console.warn('⚠️ Inactive referral code:', referralCode)
      } else if (referralData.user_id === userId) {
        console.warn('⚠️ User trying to use their own referral code:', userId)
        return NextResponse.json(
          {
            error: 'Vous ne pouvez pas utiliser votre propre code de parrainage',
            details: 'Le code de parrainage doit être celui d\'un autre membre Premium.'
          },
          { status: 400 }
        )
      } else {
        // Vérifier que le parrain est toujours un membre Premium/Admin actif
        const { data: referrerProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', referralData.user_id)
          .single()

        if (!referrerProfile || !['premium', 'admin'].includes(referrerProfile.role)) {
          console.warn('⚠️ Referrer is no longer Premium, ignoring referral code:', referralCode)
          // Ne pas bloquer le checkout : on ignore simplement le parrainage
        } else {
          referrerUserId = referralData.user_id
          console.log('✅ Valid referral code:', referralCode, 'Referrer:', referrerUserId)
        }
      }
    }

    // 🎁 Essai gratuit de 7 jours : réservé au premier abonnement d'un compte
    // free n'ayant JAMAIS été abonné auparavant (ni essai déjà utilisé, ni
    // abonnement payant passé — y compris résilié depuis, ce qui remet le
    // rôle à 'free' sans effacer subscription_start_date). La carte est
    // exigée dès la souscription (payment_method_collection: 'always') et
    // sera prélevée automatiquement à la fin de l'essai, sauf annulation.
    const { data: trialProfile } = await supabase
      .from('profiles')
      .select('role, trial_used_at, subscription_start_date')
      .eq('id', userId)
      .single()

    const isEligibleForTrial =
      planType === 'premium_monthly' &&
      trialProfile?.role === 'free' &&
      !trialProfile?.trial_used_at &&
      !trialProfile?.subscription_start_date

    console.log('🔑 Creating Stripe session with:', {
      priceId: plan.priceId,
      email,
      userId,
      isAnnual: plan.isAnnual,
      referralCode,
      referrerUserId,
      isEligibleForTrial
    })

    // Créer une session de paiement Stripe sans engagement
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      payment_method_collection: isEligibleForTrial ? 'always' : 'if_required',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?cancelled=true`,
      metadata: {
        userId,
        planType: plan.planType || planType,
        billing_interval: plan.interval,
        is_annual: plan.isAnnual ? 'true' : 'false',
        referral_code: shouldProcessReferral ? referralCode || '' : '',
        referrer_user_id: shouldProcessReferral ? referrerUserId || '' : '',
        is_trial: isEligibleForTrial ? 'true' : 'false'
      },
      subscription_data: {
        ...(isEligibleForTrial ? { trial_period_days: FREE_TRIAL_DAYS } : {}),
        metadata: {
          userId,
          planType: plan.planType || planType,
          billing_interval: plan.interval,
          is_annual: plan.isAnnual ? 'true' : 'false',
          referral_code: shouldProcessReferral ? referralCode || '' : '',
          referrer_user_id: shouldProcessReferral ? referrerUserId || '' : '',
          is_trial: isEligibleForTrial ? 'true' : 'false'
        }
      }
    })

    console.log('✅ Stripe session created:', {
      sessionId: session.id,
      interval: plan.interval,
      referralApplied: !!referrerUserId,
      isEligibleForTrial
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create checkout session',
        type: error.type,
        details: error.raw?.message || error.toString()
      },
      { status: 500 }
    )
  }
}
