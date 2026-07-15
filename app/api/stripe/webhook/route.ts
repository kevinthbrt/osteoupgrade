import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, REFERRAL_FREE_MONTH_AMOUNT } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { notifyAdmin } from '@/lib/admin-notify'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// 🎁 Crédite le mois offert (parrain + filleul) suite à un parrainage validé.
// Appelé UNIQUEMENT sur un abonnement réellement payé (jamais pendant un essai
// gratuit en cours — sinon un essai annulé avant conversion ferait gagner un
// crédit réel au parrain pour zéro euro de revenu).
async function creditReferral(params: {
  referrerUserId: string
  referralCode: string
  planType: string
  userId: string
  customerId: string | null
  subscriptionId: string | null
  referredEmail: string
  referredFullName: string | null
}) {
  const { referrerUserId, referralCode, planType, userId, customerId, subscriptionId, referredEmail, referredFullName } = params
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
    if (customerId) {
      await stripe.customers.createBalanceTransaction(customerId, {
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
      stripe_subscription_id: subscriptionId
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
            referred_name: referredEmail,
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
          contact_email: referredEmail,
          full_name: referredFullName,
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

    // 🔁 Idempotence : Stripe peut renvoyer un même événement plusieurs fois
    // (retries sur timeout/erreur). Sans ce garde-fou, un renvoi de
    // checkout.session.completed créditerait deux fois le mois offert de
    // parrainage (argent réel) et pourrait redéclencher d'autres effets de
    // bord. On n'insère la ligne qu'une fois — un conflit signale un renvoi.
    const { error: dedupeError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({ id: event.id, event_type: event.type })

    if (dedupeError) {
      if (dedupeError.code === '23505') {
        console.log('Webhook event already processed, skipping:', event.id)
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('Error recording webhook event for dedupe:', dedupeError.message)
      // On continue quand même : mieux vaut traiter deux fois un événement
      // en cas de panne de la table de dédup que de bloquer tout le webhook.
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

  // Récupérer l'abonnement Stripe pour connaître son statut réel (ex: 'trialing'
  // si un essai gratuit a été appliqué au checkout) et la date de fin d'essai.
  let subscriptionStatus = 'active'
  let trialEndsAt: string | null = null
  let isTrial = session.metadata?.is_trial === 'true'
  let subscription: any = null

  if (session.subscription) {
    try {
      subscription = await stripe.subscriptions.retrieve(session.subscription)
      subscriptionStatus = subscription.status
      if (subscription.trial_end) {
        trialEndsAt = new Date(subscription.trial_end * 1000).toISOString()
      }
    } catch (err) {
      console.error('Error retrieving subscription on checkout completed')
    }
  }

  // 🚫 ANTI-ABUS ESSAI GRATUIT : une même carte bancaire ne peut déclencher
  // qu'un seul essai, tous comptes confondus. On identifie la carte par son
  // fingerprint Stripe (stable même à travers plusieurs Customer différents).
  // Si la carte a déjà servi à un essai sur un autre compte, on met fin à
  // l'essai immédiatement (le premier prélèvement a lieu tout de suite au
  // lieu d'être différé de 7 jours) plutôt que de bloquer la souscription.
  if (isTrial && subscription) {
    try {
      const defaultPmId =
        typeof subscription.default_payment_method === 'string'
          ? subscription.default_payment_method
          : subscription.default_payment_method?.id

      if (defaultPmId) {
        const paymentMethod = await stripe.paymentMethods.retrieve(defaultPmId)
        const fingerprint = paymentMethod.card?.fingerprint

        if (fingerprint) {
          const { data: existingFingerprint } = await supabaseAdmin
            .from('trial_card_fingerprints')
            .select('user_id')
            .eq('fingerprint', fingerprint)
            .maybeSingle()

          if (existingFingerprint && existingFingerprint.user_id !== userId) {
            console.warn('⚠️ Trial abuse detected: card fingerprint already used for a trial', {
              fingerprint,
              previousUserId: existingFingerprint.user_id,
              currentUserId: userId
            })

            try {
              subscription = await stripe.subscriptions.update(session.subscription, { trial_end: 'now' })
              subscriptionStatus = subscription.status
              trialEndsAt = null
              isTrial = false
            } catch (err) {
              console.error('Error ending abusive trial early')
            }

            await notifyAdmin(
              'other',
              'Essai gratuit bloqué (carte déjà utilisée)',
              `${userId} a tenté un essai avec une carte déjà utilisée par un autre compte — essai annulé, prélèvement immédiat.`
            )
          }

          // Upsert : première utilisation de cette carte, ou ré-essai légitime du même compte
          await supabaseAdmin
            .from('trial_card_fingerprints')
            .upsert({ fingerprint, user_id: userId }, { onConflict: 'fingerprint', ignoreDuplicates: true })
        }
      }
    } catch (err) {
      console.error('Error checking trial card fingerprint')
    }
  }

  // Mettre à jour le profil utilisateur (sans engagement)
  // Rôle 'trial' pendant l'essai : déverrouille MyOsteoFlow uniquement, pas le
  // reste du contenu premium (cours, flashcards…) tant que le paiement réel
  // n'a pas eu lieu. Le plan payant n'est accordé QUE si le paiement a
  // réellement abouti (status 'active') — un statut 'incomplete'/'past_due'
  // (carte refusée, 3D Secure non validé, y compris sur le chemin anti-abus
  // qui met fin à l'essai immédiatement) ne doit jamais donner un accès
  // premium gratuit ; le compte reste 'free' jusqu'à ce que
  // customer.subscription.updated confirme un paiement réussi.
  const subscriptionStartDate = new Date()
  const updateData: Record<string, any> = {
    role: subscriptionStatus === 'trialing' ? 'trial' : subscriptionStatus === 'active' ? planType : 'free',
    subscription_status: subscriptionStatus,
    subscription_start_date: subscriptionStartDate.toISOString(),
    subscription_end_date: null,
    commitment_end_date: null, // Plus d'engagement
    commitment_cycle_number: null,
    commitment_renewal_notification_sent: false,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    trial_ends_at: trialEndsAt
  }

  // Marquer l'essai comme consommé (un seul essai gratuit par compte, à vie)
  if (isTrial) {
    updateData.trial_used_at = subscriptionStartDate.toISOString()
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

  // 🎁 GÉRER LE PARRAINAGE : 1 mois offert pour LE PARRAIN ET LE FILLEUL.
  // Jamais pendant un essai gratuit en cours (isTrial) : le crédit n'est
  // accordé qu'à la conversion réelle en abonnement payant, gérée dans
  // handleSubscriptionUpdated (transition trial → active). Sinon un essai
  // annulé avant le premier prélèvement ferait gagner un crédit réel au
  // parrain pour zéro euro de revenu.
  if (referrerUserId && referralCode && !isTrial) {
    await creditReferral({
      referrerUserId,
      referralCode,
      planType,
      userId,
      customerId: session.customer,
      subscriptionId: session.subscription,
      referredEmail: profile.email,
      referredFullName: profile.full_name
    })
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

  // 🚀 DÉCLENCHER L'AUTOMATISATION : "Essai gratuit démarré" pendant l'essai
  // (contenu spécifique : MyOsteoflow uniquement, reste verrouillé), sinon
  // "Passage à Premium" classique. La conversion réelle de l'essai déclenche
  // sa propre "Passage à Premium" dans handleSubscriptionUpdated.
  const displayPrice = '49,99€'
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: isTrial ? 'Essai gratuit démarré' : 'Passage à Premium',
        contact_email: profile.email,
        full_name: profile.full_name,
        metadata: {
          nom: 'Premium',
          prix: displayPrice,
          interval: 'mensuel',
          date_fact: (trialEndsAt ? new Date(trialEndsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('fr-FR'),
          date_fin_essai: trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('fr-FR') : '',
          essai_gratuit: isTrial ? 'true' : 'false',
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
    .select('id, role, email, full_name')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for subscription update')
    return
  }

  // Mettre à jour le statut (ex: passage de 'trialing' à 'active' à la fin
  // de l'essai gratuit, une fois le premier prélèvement effectué)
  const updateData: Record<string, any> = {
    subscription_status: subscription.status
  }
  if (subscription.status !== 'trialing') {
    updateData.trial_ends_at = null
  }

  const wasTrialing = profile.role === 'trial'

  if (wasTrialing) {
    if (subscription.status === 'active') {
      // Conversion de l'essai en abonnement payant : l'utilisateur passe du
      // rôle 'trial' (MyOsteoFlow seul) au vrai plan souscrit (accès complet).
      updateData.role = subscription.metadata?.planType || 'premium'
    } else if (subscription.status !== 'trialing') {
      // Fin de l'essai sans conversion réussie (ex: premier prélèvement
      // refusé → 'past_due'/'unpaid'/'incomplete_expired') : on révoque
      // l'accès MyOsteoFlow immédiatement plutôt que de le laisser ouvert.
      updateData.role = 'free'
    }
  }

  await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id)

  // 🎁 Parrainage différé : le code de parrainage saisi au moment de l'essai
  // n'a été crédité à personne (voir handleCheckoutCompleted). Maintenant que
  // l'essai vient de se convertir en abonnement réellement payé, on crédite
  // le mois offert au parrain et au filleul.
  const referrerUserId = subscription.metadata?.referrer_user_id
  const referralCode = subscription.metadata?.referral_code
  if (wasTrialing && subscription.status === 'active' && referrerUserId && referralCode) {
    await creditReferral({
      referrerUserId,
      referralCode,
      planType: subscription.metadata?.planType || 'premium',
      userId: profile.id,
      customerId,
      subscriptionId: subscription.id,
      referredEmail: profile.email,
      referredFullName: profile.full_name
    })
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Passage à Premium" : c'est ici, et non au
  // démarrage de l'essai, que l'utilisateur devient réellement Premium.
  if (wasTrialing && subscription.status === 'active') {
    let userReferralCode = ''
    try {
      const { data: referralCodeData } = await supabaseAdmin
        .from('referral_codes')
        .select('referral_code')
        .eq('user_id', profile.id)
        .single()
      userReferralCode = referralCodeData?.referral_code || ''
    } catch (err) {
      console.error('Could not fetch referral code for trial conversion automation')
    }

    let factureUrl = ''
    try {
      const invoiceId = subscription.latest_invoice
      if (invoiceId) {
        const latestInvoice = await stripe.invoices.retrieve(
          typeof invoiceId === 'string' ? invoiceId : invoiceId.id
        )
        factureUrl = latestInvoice.hosted_invoice_url || latestInvoice.invoice_pdf || ''
      }
    } catch (err) {
      console.error('Error retrieving invoice for trial conversion automation')
    }

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
            prix: '49,99€',
            interval: 'mensuel',
            date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
            essai_gratuit: 'true',
            code_parrainage: userReferralCode,
            facture_url: factureUrl
          }
        })
      })
    } catch (err) {
      console.error('Error triggering trial conversion automation')
    }

    await notifyAdmin('new_subscription', 'Essai converti en Premium', `${profile.email} — essai gratuit converti en abonnement Premium`)
  }
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
    .select('id, email, full_name, role')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found for subscription deletion')
    return
  }

  // Un essai jamais converti (annulé pendant les 7 jours, ou premier
  // prélèvement refusé) déclenche un email différent d'une vraie résiliation
  // Premium — l'utilisateur n'a jamais payé, "Abonnement expiré" serait faux.
  const wasNeverConverted = profile.role === 'trial'

  // Révoquer le premium (plus d'engagement, annulation immédiate)
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'free',
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      commitment_end_date: null,
      commitment_cycle_number: null,
      trial_ends_at: null
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Error downgrading user to free')
    return
  }

  // 🚀 DÉCLENCHER L'AUTOMATISATION "Abonnement expiré" ou "Essai gratuit annulé"
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        event: wasNeverConverted ? 'Essai gratuit annulé' : 'Abonnement expiré',
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
