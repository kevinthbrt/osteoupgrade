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
  const isAnnual = session.metadata?.is_annual === 'true'
  const billingInterval = session.metadata?.billing_interval || (isAnnual ? 'year' : 'month')
  const referralCode = session.metadata?.referral_code
  const referrerUserId = session.metadata?.referrer_user_id

  console.log('📦 Checkout session data:', {
    userId,
    planType,
    isAnnual,
    billingInterval,
    referralCode,
    referrerUserId,
    sessionId: session.id
  })

  if (!userId || !planType) {
    console.error('❌ Missing userId or planType in checkout session:', { userId, planType })
    return
  }

  console.log(`✅ Checkout completed for user ${userId}, plan ${planType}, interval: ${billingInterval}`)

  // Mettre à jour le profil utilisateur (sans engagement)
  const subscriptionStartDate = new Date()
  const updateData = {
    role: planType,
    subscription_status: 'active',
    subscription_start_date: subscriptionStartDate.toISOString(),
    subscription_end_date: null,
    commitment_end_date: null, // Plus d'engagement
    commitment_cycle_number: null,
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

  // 💰 GÉRER LA COMMISSION DE PARRAINAGE (UNIQUEMENT POUR LES ABONNEMENTS ANNUELS)
  if (referrerUserId && referralCode && isAnnual) {
    console.log('💰 Processing referral commission for:', referralCode)

    // Récupérer le montant de l'abonnement depuis Stripe
    let subscriptionAmount = 0
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      // Le montant est en centimes
      subscriptionAmount = subscription.items.data[0]?.price?.unit_amount || 0
      console.log('💵 Subscription amount:', subscriptionAmount, 'cents')
    } catch (err) {
      console.error('❌ Error retrieving subscription amount:', err)
    }

    if (subscriptionAmount > 0) {
      // Calculer la commission (10%)
      const commissionAmount = Math.floor(subscriptionAmount * 0.10)

      console.log('📊 Commission calculation:', {
        subscriptionAmount,
        commissionAmount,
        percentage: '10%'
      })

      // 1️⃣ Créer la transaction de parrainage pour LE PARRAIN
      const { data: referrerTransaction, error: referrerError } = await supabaseAdmin
        .from('referral_transactions')
        .insert({
          referrer_id: referrerUserId,
          referred_user_id: userId,
          referral_code: referralCode.toUpperCase(),
          subscription_type: planType,
          subscription_plan: 'annual',
          subscription_amount: subscriptionAmount,
          commission_amount: commissionAmount,
          commission_status: 'available', // Immédiatement disponible
          stripe_subscription_id: session.subscription
        })
        .select()
        .single()

      if (referrerError) {
        console.error('❌ Error creating referrer transaction:', referrerError)
      } else {
        console.log('✅ Referrer transaction created:', referrerTransaction)

        // Notifier le parrain par email
        try {
          const { data: referrerProfile } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', referrerUserId)
            .single()

          if (referrerProfile) {
            await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'Nouveau parrainage',
                contact_email: referrerProfile.email,
                metadata: {
                  commission: `${(commissionAmount / 100).toFixed(2)}€`,
                  referred_user: profile.email,
                  plan: planType === 'premium_gold' ? 'Premium Gold' : 'Premium Silver'
                }
              })
            })
            console.log('✅ Referrer notification sent')
          }
        } catch (err) {
          console.error('⚠️ Error sending referrer notification:', err)
        }
      }

      // 2️⃣ Créer AUSSI une transaction de parrainage pour LE FILLEUL (10% de son propre achat)
      const { data: referredTransaction, error: referredError } = await supabaseAdmin
        .from('referral_transactions')
        .insert({
          referrer_id: userId, // Le filleul reçoit la commission dans son propre compte
          referred_user_id: userId, // C'est son propre achat
          referral_code: referralCode.toUpperCase(),
          subscription_type: planType,
          subscription_plan: 'annual',
          subscription_amount: subscriptionAmount,
          commission_amount: commissionAmount, // Même montant : 10%
          commission_status: 'available', // Immédiatement disponible
          stripe_subscription_id: session.subscription
        })
        .select()
        .single()

      if (referredError) {
        console.error('❌ Error creating referred user (self) transaction:', referredError)
      } else {
        console.log('✅ Referred user (self) transaction created:', referredTransaction)

        // Notifier le filleul qu'il a gagné 10% sur son propre achat
        try {
          await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'Bonus parrainage filleul',
              contact_email: profile.email,
              metadata: {
                commission: `${(commissionAmount / 100).toFixed(2)}€`,
                plan: planType === 'premium_gold' ? 'Premium Gold' : 'Premium Silver'
              }
            })
          })
          console.log('✅ Referred user (self) bonus notification sent')
        } catch (err) {
          console.error('⚠️ Error sending referred user notification:', err)
        }
      }
    }
  }

  console.log('📧 Triggering automation for:', profile.email)

  // 🚀 DÉCLENCHER L'AUTOMATISATION selon le plan (Silver ou Gold)
  const eventName = planType === 'premium_gold' ? 'Passage à Premium Gold' : 'Passage à Premium Silver'
  const displayPrice = planType === 'premium_gold'
    ? (isAnnual ? '499€' : '49,99€')
    : (isAnnual ? '240€' : '29€')

  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        contact_email: profile.email,
        metadata: {
          nom: planType === 'premium_gold' ? 'Premium Gold' : 'Premium Silver',
          prix: displayPrice,
          interval: isAnnual ? 'annuel' : 'mensuel',
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
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found for customer:', customerId, profileError)
    return
  }

  console.log(`Found user ${profile.id} for customer ${customerId}`)

  // Révoquer le premium (plus d'engagement, annulation immédiate)
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'free',
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      commitment_end_date: null,
      commitment_cycle_number: null
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
    .select('id, email, role')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found for subscription:', subscriptionId, profileError)
    return
  }

  console.log(`💰 Payment processed for user ${profile.id}`)

  // Vérifier que le statut de l'abonnement est toujours actif
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active'
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('❌ Error updating subscription status:', updateError)
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Renouvellement effectué" (optionnel)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'Renouvellement effectué',
        contact_email: profile.email,
        metadata: {
          nom: profile.role === 'premium_gold' ? 'Premium Gold' : 'Premium Silver',
          date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
        }
      })
    })
    console.log('✅ Automation triggered: Renouvellement effectué')
  } catch (err) {
    console.error('❌ Error triggering automation:', err)
  }
}

// Paiement échoué
async function handlePaymentFailed(invoice: any) {
  console.log(`❌ Payment failed for subscription ${invoice.subscription}`)
  // Optionnel : alerter l'utilisateur
}
