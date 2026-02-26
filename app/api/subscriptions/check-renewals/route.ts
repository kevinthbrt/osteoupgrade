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

    console.log('🔍 Checking Stripe subscriptions for upcoming renewals (within 7 days)...')

    // Récupérer tous les utilisateurs Premium actifs avec un stripe_subscription_id
    const { data: premiumUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, stripe_subscription_id, stripe_customer_id, renewal_reminder_sent_at')
      .eq('subscription_status', 'active')
      .in('role', ['premium_silver', 'premium_gold'])
      .not('stripe_subscription_id', 'is', null)

    if (usersError) {
      console.error('❌ Error fetching premium users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    console.log(`Found ${premiumUsers?.length || 0} active premium users to check`)

    const notifications: any[] = []
    const cooldownMs = REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

    for (const user of premiumUsers || []) {
      try {
        // Vérifier le cooldown anti-doublon
        if (user.renewal_reminder_sent_at) {
          const lastSent = new Date(user.renewal_reminder_sent_at).getTime()
          if (now.getTime() - lastSent < cooldownMs) {
            console.log(`⏭️ Skipping ${user.email}: reminder already sent recently`)
            continue
          }
        }

        // Interroger Stripe pour obtenir la date de fin de période
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)

        const periodEndTimestamp = subscription.current_period_end
        const periodEndDate = new Date(periodEndTimestamp * 1000)

        // Déclencher le rappel uniquement si le renouvellement est dans les 7 prochains jours
        if (periodEndDate > now && periodEndDate <= sevenDaysFromNow) {
          const daysUntilRenewal = Math.ceil(
            (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          console.log(`📨 Sending renewal reminder to ${user.email} (renouvellement dans ${daysUntilRenewal} j)`)

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
                nom: user.role === 'premium_gold' ? 'Premium Gold' : 'Premium Silver'
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
            email: user.email,
            days_until_renewal: daysUntilRenewal,
            renewal_date: periodEndDate.toISOString(),
            status: 'sent'
          })

          console.log(`✅ Renewal reminder sent to ${user.email}`)
        }
      } catch (err) {
        console.error(`❌ Error processing renewal check for ${user.email}:`, err)
        notifications.push({
          user_id: user.id,
          email: user.email,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Renewal check complete: ${notifications.filter(n => n.status === 'sent').length} reminders sent`)

    return NextResponse.json({
      success: true,
      checked_at: now.toISOString(),
      checked_users: premiumUsers?.length || 0,
      notifications_sent: notifications.filter(n => n.status === 'sent').length,
      details: notifications
    })
  } catch (error: any) {
    console.error('❌ Error in check-renewals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
