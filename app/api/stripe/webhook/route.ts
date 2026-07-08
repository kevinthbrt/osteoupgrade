import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, REFERRAL_FREE_MONTH_AMOUNT } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { notifyAdmin } from '@/lib/admin-notify'

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
      console.error('Webhook signature verification failed')
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
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Gérer la fin du checkout (nouveau paiement)
async function handleCheckoutCompleted(session: any) {
  const userId = session.client_reference_id || session.metadata?.userId
  const planType = session.metadata?.planType
  const referralCode = session.metadata?.referral_code
  const referrerUserId = session.metadata?.referrer_user_id

  if (!userId || !planType) {
    console.error('Checkout completed: missing userId or planType')
    return
  }

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

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()

  if (updateError) {
    console.error('Error updating profile on checkout completed')
    return
  }

  // Récupérer l'email du user
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (!profile) {
    console.error('Profile not found for email automation')
    return
  }

  // 🎁 GÉRER LE PARRAINAGE : 1 mois offert pour LE PARRAIN ET LE FILLEUL
  // Mécanisme : on crédite la valeur d'un mois d'abonnement sur le solde Stripe
  // (customer balance) de chaque partie → leur prochaine facture est offerte.
  if (referrerUserId && referralCode) {
    const freeMonthAmount = REFERRAL_FREE_MONTH_AMOUNT

    // Récupérer le parrain (customer Stripe + email pour la notification)
    const { data: referrerProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', referrerUserId)
      .single()

    // 1️⃣ Créditer LE FILLEUL (mois suivant offert)
    let referredCredited = false
    try {
      if (session.customer) {
        await stripe.customers.createBalanceTransaction(session.customer, {
          amount: -freeMonthAmount, // montant négatif = crédit en faveur du client
          currency: 'eur',
          description: `Parrainage ${referralCode.toUpperCase()} — 1 mois offert (filleul)`
        })
        referredCredited = true
      }
    } catch (err) {
      console.error('Error crediting referred user free month')
    }

    // 2️⃣ Créditer LE PARRAIN (mois suivant offert)
    let referrerCredited = false
    try {
      if (referrerProfile?.stripe_customer_id) {
        await stripe.customers.createBalanceTransaction(referrerProfile.stripe_customer_id, {
          amount: -freeMonthAmount,
          currency: 'eur',
          description: `Parrainage ${referralCode.toUpperCase()} — 1 mois offert (parrain)`
        })
        referrerCredited = true
      }
    } catch (err) {
      console.error('Error crediting referrer free month')
    }

    // 3️⃣ Historiser le parrainage côté parrain (1 ligne = 1 mois offert gagné)
    const { error: referralError } = await supabaseAdmin
      .from('referral_transactions')
      .insert({
        referrer_id: referrerUserId,
        referred_user_id: userId,
        referral_code: referralCode.toUpperCase(),
        subscription_type: planType,
        subscription_plan: 'monthly',
        subscription_amount: freeMonthAmount,
        // On stocke la valeur du mois offert (sert d'historique de la récompense)
        commission_amount: freeMonthAmount,
        commission_status: referrerCredited ? 'available' : 'pending',
        stripe_subscription_id: session.subscription
      })

    if (referralError) {
      console.error('Error recording referral transaction')
    }

    // 4️⃣ Notifier le parrain (mois offert)
    if (referrerProfile?.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          },
          body: JSON.stringify({
            event: 'Nouveau parrainage',
            contact_email: referrerProfile.email,
            full_name: referrerProfile.full_name,
            metadata: {
              referred_name: profile.email,
              plan: 'Premium'
            }
          })
        })
      } catch (err) {
        console.error('Error sending referrer notification')
      }
    }

    // 5️⃣ Notifier le filleul (mois offert de bienvenue)
    if (referredCredited) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          },
          body: JSON.stringify({
            event: 'Bonus parrainage filleul',
            contact_email: profile.email,
            full_name: profile.full_name,
            metadata: {
              plan: 'Premium'
            }
          })
        })
      } catch (err) {
        console.error('Error sending referred user notification')
      }
    }
  }

  // 🛑 ANNULER la séquence de relance Premium (l'utilisateur vient de souscrire)
  try {
    // Trouver le contact dans mail_contacts par email
    const { data: mailContact } = await supabaseAdmin
      .from('mail_contacts')
      .select('id')
      .eq('email', profile.email)
      .single()

    if (mailContact) {
      const { error: cancelError } = await supabaseAdmin
        .from('mail_automation_enrollments')
        .update({ status: 'cancelled' })
        .eq('contact_id', mailContact.id)
        .eq('automation_id', 'b2222222-2222-2222-2222-222222222222')
        .in('status', ['pending', 'processing'])

      if (cancelError) {
        console.error('Error cancelling relance enrollment')
      }
    }
  } catch (err) {
    console.error('Error cancelling relance enrollment')
  }

  // Récupérer le code de parrainage de l'utilisateur (pour l'email de bienvenue)
  let userReferralCode = ''
  try {
    const { data: referralCodeData } = await supabaseAdmin
      .from('referral_codes')
      .select('referral_code')
      .eq('user_id', userId)
      .single()
    userReferralCode = referralCodeData?.referral_code || ''
  } catch (err) {
    console.error('Could not fetch referral code for automation')
  }

  // Récupérer le lien de la facture Stripe du premier paiement (pour l'email de bienvenue)
  let factureUrl = ''
  try {
    if (session.invoice) {
      const firstInvoice = await stripe.invoices.retrieve(session.invoice)
      factureUrl = firstInvoice.hosted_invoice_url || firstInvoice.invoice_pdf || ''
    }
  } catch (err) {
    console.error('Error retrieving first invoice for confirmation email')
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Passage à Premium"
  const displayPrice = '49,99€'
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: 'Passage à Premium',
        contact_email: profile.email,
        full_name: profile.full_name,
        metadata: {
          nom: 'Premium',
          prix: displayPrice,
          interval: 'mensuel',
          date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          code_parrainage: userReferralCode,
          facture_url: factureUrl
        }
      })
    })
  } catch (err) {
    console.error('Error triggering automation')
  }

  // 🔔 NOTIF INTERNE admin (cloche)
  const planLabel = 'Premium · 49,99€/mois'
  const notifBody = referralCode
    ? `${profile.email} — ${planLabel} (parrainage : ${referralCode})`
    : `${profile.email} — ${planLabel}`
  await notifyAdmin('new_subscription', 'Nouvel abonné', notifBody)

  // 📧 NOTIFIER L'ADMIN du nouvel abonnement
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try {
      const planLabel = 'Premium (49,99€/mois)'
      const referralInfo = referralCode ? `<p style="margin:4px 0;font-size:13px;color:#64748b;">Code parrainage utilisé : <strong>${referralCode}</strong></p>` : ''
      await sendTransactionalEmail({
        to: adminEmail,
        subject: `[OsteoUpgrade] Nouvel abonnement — ${profile.email}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#0f172a;margin:0 0 16px;">Nouvel abonné</h2>
            <p style="margin:0 0 8px;font-size:14px;color:#1e293b;"><strong>Email :</strong> ${profile.email}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#1e293b;"><strong>Plan :</strong> ${planLabel}</p>
            ${referralInfo}
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">OsteoUpgrade — notification automatique</p>
          </div>
        `,
        skipUnsubscribeFooter: true,
      })
    } catch (err) {
      console.error('Error sending admin new subscription notification')
    }
  }
}

// Gérer la mise à jour d'abonnement
async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer

  if (!customerId) {
    console.error('Missing customer ID in subscription update')
    return
  }

  // Trouver l'utilisateur par son stripe_customer_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for subscription update')
    return
  }

  // Mettre à jour le statut
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status
    })
    .eq('id', profile.id)
}

// Gérer la suppression/annulation d'abonnement
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer

  if (!customerId) {
    console.error('Missing customer ID in subscription deletion')
    return
  }

  // Trouver l'utilisateur par son stripe_customer_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for subscription deletion')
    return
  }

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
    console.error('Error downgrading user to free')
    return
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Abonnement expiré"
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: 'Abonnement expiré',
        contact_email: profile.email,
        full_name: profile.full_name,
        metadata: {
          cancellation_date: new Date().toISOString()
        }
      })
    })
  } catch (err) {
    console.error('Error triggering expiry automation')
  }
}

// Paiement réussi (renouvellement)
async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription

  if (!subscriptionId) {
    return
  }

  // Ignorer le premier paiement lors de la création de l'abonnement :
  // il est déjà traité par checkout.session.completed (confirmation initiale envoyée là-bas).
  // billing_reason = 'subscription_create' → premier paiement
  // billing_reason = 'subscription_cycle'  → renouvellement périodique → on envoie e5555555
  if (invoice.billing_reason === 'subscription_create') {
    return
  }

  // Trouver l'utilisateur par son stripe_subscription_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for payment succeeded')
    return
  }

  // S'assurer que le statut de l'abonnement est actif
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active'
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Error updating subscription status on renewal')
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Renouvellement effectué" → template e5555555
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: 'Renouvellement effectué',
        contact_email: profile.email,
        full_name: profile.full_name,
        metadata: {
          nom: 'Premium',
          date_fact: new Date().toLocaleDateString('fr-FR'),
          facture_url: invoice.hosted_invoice_url || invoice.invoice_pdf || ''
        }
      })
    })
  } catch (err) {
    console.error('Error triggering renewal automation')
  }
}

// Paiement échoué
async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription
  if (!subscriptionId) {
    return
  }

  // Trouver l'utilisateur par son stripe_subscription_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for payment failed')
    return
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Paiement échoué" (relance / dunning)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: 'Paiement échoué',
        contact_email: profile.email,
        full_name: profile.full_name,
        metadata: {
          nom: 'Premium'
        }
      })
    })
  } catch (err) {
    console.error('Error triggering payment failed automation')
  }
}
