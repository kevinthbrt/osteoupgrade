import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { planType, userId, email } = await request.json()

    console.log('📦 Stripe checkout request:', { planType, userId, email })

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
          details: `Please set STRIPE_PRICE_${planType.toUpperCase().replace('PREMIUM_', '')} in Vercel environment variables`
        },
        { status: 400 }
      )
    }

    console.log('🔑 Creating Stripe session with:', {
      priceId: plan.priceId,
      email,
      userId,
      commitment: plan.commitment
    })

    // Créer une session de paiement Stripe avec Subscription Schedule
    // pour un paiement mensuel avec engagement de 12 mois
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
        planType,
        commitment_months: plan.commitment.toString(),
        billing_type: 'monthly_with_commitment'
      },
      // Configuration pour l'engagement
      subscription_data: {
        metadata: {
          userId,
          planType,
          commitment_months: plan.commitment.toString(),
          commitment_start: new Date().toISOString()
        },
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' }
        }
      }
    })

    console.log('✅ Stripe session created with commitment:', {
      sessionId: session.id,
      commitment: `${plan.commitment} months`
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
