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
  const commitmentMonths = parseInt(session.metadata?.commitment_months || '12')

  console.log('📦 Checkout session data:', { userId, planType, commitmentMonths, sessionId: session.id })

  if (!userId || !planType) {
    console.error('❌ Missing userId or planType in checkout session:', { userId, planType })
    return
  }

  console.log(`✅ Checkout completed for user ${userId}, plan ${planType}, commitment: ${commitmentMonths} months`)

  // Calculer la date de fin d'engagement
  const commitmentStartDate = new Date()
  const commitmentEndDate = new Date(commitmentStartDate)
  commitmentEndDate.setMonth(commitmentEndDate.getMonth() + commitmentMonths)

  // Mettre à jour le profil utilisateur avec le client admin
  const updateData = {
    role: planType,
    subscription_status: 'active',
    subscription_start_date: commitmentStartDate.toISOString(),
    subscription_end_date: null,
    commitment_end_date: commitmentEndDate.toISOString(),
    commitment_cycle_number: 1,
    commitment_renewal_notification_sent: false,
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

  // 🚀 DÉCLENCHER L'AUTOMATISATION selon le plan (Silver ou Gold)
  const eventName = planType === 'premium_gold' ? 'Passage à Premium Gold' : 'Passage à Premium Silver'

  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        contact_email: profile.email,
        metadata: {
          nom: planType === 'premium_gold' ? 'Premium Gold' : 'Premium Silver',
          prix: planType === 'premium_gold' ? '49,99€' : '29,99€',
          date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
        }
      })
    })
    console.log(`✅ Automation triggered: ${eventName}`)
  } catch (err) {
    console.error('❌ Error triggering automation:', err)
  }
}

// Gérer la mise à jour d'abonnement
async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer

  if (!customerId) {
    console.error('❌ Missing customer ID in subscription')
    return
  }

  console.log(`ℹ️ Subscription updated for customer ${customerId}, status: ${subscription.status}`)

  // Trouver l'utilisateur par son stripe_customer_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found for customer:', customerId, profileError)
    return
  }

  // Mettre à jour le statut
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status
    })
    .eq('id', profile.id)

  console.log(`✅ Updated subscription status to ${subscription.status} for user ${profile.id}`)
}

// Gérer la suppression/annulation d'abonnement
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer

  if (!customerId) {
    console.error('❌ Missing customer ID in subscription')
    return
  }

  console.log(`❌ Subscription deleted for customer ${customerId}`)

  // Trouver l'utilisateur par son stripe_customer_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, commitment_end_date, subscription_start_date')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found for customer:', customerId, profileError)
    return
  }

  console.log(`Found user ${profile.id} for customer ${customerId}`)

  // Vérifier si l'annulation se fait avant la fin de l'engagement
  const now = new Date()
  const commitmentEndDate = profile.commitment_end_date ? new Date(profile.commitment_end_date) : null
  const isEarlyTermination = commitmentEndDate && now < commitmentEndDate

  if (isEarlyTermination) {
    console.warn(`⚠️ Early termination detected for user ${profile.id}. Commitment end: ${commitmentEndDate?.toISOString()}`)
    // Note: Dans Stripe, vous pourriez configurer des frais de résiliation anticipée
    // ou bloquer l'annulation via le portail client
  }

  // Révoquer le premium
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'free',
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('❌ Error updating profile:', updateError)
    return
  }

  console.log('✅ User downgraded to free')

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
  const subscriptionId = invoice.subscription

  if (!subscriptionId) {
    console.log('ℹ️ Payment succeeded but no subscription ID (one-time payment)')
    return
  }

  console.log(`✅ Payment succeeded for subscription ${subscriptionId}`)

  // Trouver l'utilisateur par son stripe_subscription_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, commitment_end_date, commitment_cycle_number, role')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found for subscription:', subscriptionId, profileError)
    return
  }

  console.log(`💰 Payment processed for user ${profile.id}`)

  // Vérifier si le cycle d'engagement est terminé
  const now = new Date()
  const commitmentEndDate = profile.commitment_end_date ? new Date(profile.commitment_end_date) : null

  if (commitmentEndDate && now >= commitmentEndDate) {
    // Le cycle d'engagement est terminé, on démarre un nouveau cycle automatiquement
    const currentCycle = profile.commitment_cycle_number || 1
    const newCycleNumber = currentCycle + 1
    const newCommitmentEndDate = new Date(now)
    newCommitmentEndDate.setMonth(newCommitmentEndDate.getMonth() + 12)

    console.log(`🔄 Starting new commitment cycle ${newCycleNumber} for user ${profile.id}`)
    console.log(`📅 New commitment end date: ${newCommitmentEndDate.toISOString()}`)

    // Mettre à jour le profil avec le nouveau cycle
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        commitment_cycle_number: newCycleNumber,
        commitment_end_date: newCommitmentEndDate.toISOString(),
        commitment_renewal_notification_sent: false
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ Error updating commitment cycle:', updateError)
      return
    }

    console.log(`✅ Commitment cycle ${newCycleNumber} started successfully for user ${profile.id}`)

    // 🚀 DÉCLENCHER L'AUTOMATISATION "Renouvellement effectué"
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Renouvellement effectué',
          contact_email: profile.email,
          metadata: {
            cycle: newCycleNumber,
            date_renouv: newCommitmentEndDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            nom: profile.role === 'premium_gold' ? 'Premium Gold' : 'Premium Silver',
            prix: profile.role === 'premium_gold' ? '49,99€' : '29,99€',
            date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
          }
        })
      })
      console.log('✅ Automation triggered: Renouvellement effectué')
    } catch (err) {
      console.error('❌ Error triggering automation:', err)
    }
  } else {
    console.log(`ℹ️ Recurring payment within current commitment cycle (ends ${commitmentEndDate?.toISOString()})`)
  }
}

// Paiement échoué
async function handlePaymentFailed(invoice: any) {
  console.log(`❌ Payment failed for subscription ${invoice.subscription}`)
  // Optionnel : alerter l'utilisateur
}
