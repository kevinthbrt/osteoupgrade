import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

// Cron quotidien : détecte les abonnements Stripe dont le prochain renouvellement
// tombe dans les 7 prochains jours et déclenche l'email "Renouvellement imminent" (template e4444444).
// Remplace l'ancienne logique basée sur commitment_end_date (désormais dépréciée).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Délai entre deux envois pour le même abonnement (6 jours) — évite les doublons
// si le cron tourne plusieurs jours de suite avec une fenêtre de 7 jours.
const REMINDER_COOLDOWN_DAYS = 6

export async function GET(request: Request) {
  try {
    // Vérifier l'autorisation (token secret pour le cron)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Récupérer tous les utilisateurs Premium actifs avec un stripe_subscription_id
    const { data: premiumUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, stripe_subscription_id, stripe_customer_id, renewal_reminder_sent_at')
      .eq('subscription_status', 'active')
      .eq('role', 'premium')
      .not('stripe_subscription_id', 'is', null)

    if (usersError) {
      console.error('Error fetching premium users for renewal check')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const notifications: any[] = []
    const cooldownMs = REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

    for (const user of premiumUsers || []) {
      try {
        // Vérifier le cooldown anti-doublon
        if (user.renewal_reminder_sent_at) {
          const lastSent = new Date(user.renewal_reminder_sent_at).getTime()
          if (now.getTime() - lastSent < cooldownMs) {
            continue
          }
        }

        // Interroger Stripe pour obtenir la date de fin de période
        // Note : dans l'API Stripe >= 2025-11-17.clover, current_period_end n'est pas
        // exposé dans les types TypeScript mais existe bien à l'exécution.
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id) as any

        const periodEndTimestamp: number = subscription.current_period_end
        const periodEndDate = new Date(periodEndTimestamp * 1000)

        // Déclencher le rappel uniquement si le renouvellement est dans les 7 prochains jours
        if (periodEndDate > now && periodEndDate <= sevenDaysFromNow) {
          const daysUntilRenewal = Math.ceil(
            (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Déclencher l'automatisation "Renouvellement imminent" → template e4444444
          await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({
              event: 'Renouvellement imminent',
              contact_email: user.email,
              metadata: {
                date_renouv: periodEndDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }),
                jours: daysUntilRenewal,
                nom: 'Premium'
              }
            })
          })

          // Mémoriser la date d'envoi pour éviter les doublons
          await supabaseAdmin
            .from('profiles')
            .update({ renewal_reminder_sent_at: now.toISOString() })
            .eq('id', user.id)

          notifications.push({
            user_id: user.id,
            days_until_renewal: daysUntilRenewal,
            renewal_date: periodEndDate.toISOString(),
            status: 'sent'
          })
        }
      } catch (err) {
        console.error('Error processing renewal check for a user')
        notifications.push({
          user_id: user.id,
          status: 'failed',
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked_at: now.toISOString(),
      checked_users: premiumUsers?.length || 0,
      notifications_sent: notifications.filter(n => n.status === 'sent').length,
      details: notifications
    })
  } catch (error: any) {
    console.error('Error in check-renewals')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
