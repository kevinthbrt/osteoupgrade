import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    // Gérer les différents événements Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Gérer la fin du checkout (nouveau paiement)
async function handleCheckoutCompleted(session: any) {
  const userId = session.client_reference_id || session.metadata?.userId
  const planType = session.metadata?.planType

  console.log('📦 Checkout session data:', { userId, planType, sessionId: session.id })

  if (!userId || !planType) {
    console.error('❌ Missing userId or planType in checkout session:', { userId, planType })
    return
  }

  console.log(`✅ Checkout completed for user ${userId}, plan ${planType}`)

  // Mettre à jour le profil utilisateur avec le client admin
  const updateData = {
    role: planType,
    subscription_status: 'active',
    subscription_start_date: new Date().toISOString(),
    subscription_end_date: null,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription
  }

  console.log('📝 Updating profile with:', updateData)

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()

  if (updateError) {
    console.error('❌ Error updating profile:', updateError)
    return
  }

  console.log('✅ Profile updated successfully:', updatedProfile)

  // Récupérer l'email du user
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile) {
    console.error('❌ Profile not found for email automation')
    return
  }

  console.log('📧 Triggering automation for:', profile.email)

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Passage à Premium"
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'Passage à Premium',
        contact_email: profile.email,
        metadata: {
          plan_type: planType,
          upgrade_date: new Date().toISOString()
        }
      })
    })
    console.log('✅ Automation triggered: Passage à Premium')
  } catch (err) {
    console.error('❌ Error triggering automation:', err)
  }
}

// Gérer la mise à jour d'abonnement
async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription')
    return
  }

  console.log(`ℹ️ Subscription updated for user ${userId}`)

  // Mettre à jour le statut
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status
    })
    .eq('id', userId)
}

// Gérer la suppression/annulation d'abonnement
async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription')
    return
  }

  console.log(`❌ Subscription deleted for user ${userId}`)

  // Révoquer le premium
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'free',
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString()
    })
    .eq('id', userId)

  if (updateError) {
    console.error('❌ Error updating profile:', updateError)
    return
  }

  // Récupérer l'email
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile) {
    console.error('❌ Profile not found for cancellation email')
    return
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Abonnement expiré"
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'Abonnement expiré',
        contact_email: profile.email,
        metadata: {
          cancellation_date: new Date().toISOString()
        }
      })
    })
    console.log('✅ Automation triggered: Abonnement expiré')
  } catch (err) {
    console.error('❌ Error triggering automation:', err)
  }
}

// Paiement réussi (renouvellement)
async function handlePaymentSucceeded(invoice: any) {
  console.log(`✅ Payment succeeded for subscription ${invoice.subscription}`)
  // Optionnel : envoyer un email de confirmation de paiement
}

// Paiement échoué
async function handlePaymentFailed(invoice: any) {
  console.log(`❌ Payment failed for subscription ${invoice.subscription}`)
  // Optionnel : alerter l'utilisateur
}
