import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { planType, userId, email, referralCode } = await request.json()

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

    // Validate referral code if provided
    let referrerUserId = null
    if (referralCode) {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
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
      } else {
        referrerUserId = referralData.user_id
        console.log('✅ Valid referral code:', referralCode, 'Referrer:', referrerUserId)
      }
    }

    console.log('🔑 Creating Stripe session with:', {
      priceId: plan.priceId,
      email,
      userId,
      isAnnual: plan.isAnnual,
      referralCode,
      referrerUserId
    })

    // Créer une session de paiement Stripe sans engagement
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?cancelled=true`,
      metadata: {
        userId,
        planType: plan.planType || planType,
        billing_interval: plan.interval,
        is_annual: plan.isAnnual ? 'true' : 'false',
        referral_code: referralCode || '',
        referrer_user_id: referrerUserId || ''
      },
      subscription_data: {
        metadata: {
          userId,
          planType: plan.planType || planType,
          billing_interval: plan.interval,
          is_annual: plan.isAnnual ? 'true' : 'false',
          referral_code: referralCode || '',
          referrer_user_id: referrerUserId || ''
        }
      }
    })

    console.log('✅ Stripe session created:', {
      sessionId: session.id,
      interval: plan.interval,
      referralApplied: !!referrerUserId
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
