import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// Cette route doit être appelée quotidiennement (via un cron job Vercel)
// Elle vérifie les utilisateurs dont le cycle d'engagement se termine bientôt

export async function GET(request: Request) {
  try {
    // Vérifier l'autorisation (token secret pour le cron)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    console.log('🔍 Checking for upcoming commitment renewals...')

    // Récupérer les utilisateurs dont l'engagement se termine dans 7 jours
    const { data: usersNeedingNotification, error: notificationError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, commitment_end_date, commitment_cycle_number, commitment_renewal_notification_sent')
      .eq('subscription_status', 'active')
      .in('role', ['premium_silver', 'premium_gold'])
      .not('commitment_end_date', 'is', null)
      .eq('commitment_renewal_notification_sent', false)
      .lte('commitment_end_date', sevenDaysFromNow.toISOString())
      .gte('commitment_end_date', now.toISOString())

    if (notificationError) {
      console.error('❌ Error fetching users:', notificationError)
      return NextResponse.json({ error: notificationError.message }, { status: 500 })
    }

    console.log(`📧 Found ${usersNeedingNotification?.length || 0} users needing renewal notification`)

    const notifications = []

    for (const user of usersNeedingNotification || []) {
      const commitmentEndDate = new Date(user.commitment_end_date!)
      const daysUntilRenewal = Math.ceil((commitmentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`📨 Sending renewal notification to ${user.email} (${daysUntilRenewal} days until renewal)`)

      try {
        // Préparer les métadonnées avec variables courtes
        const renewalDate = new Date(user.commitment_end_date)

        // Déclencher l'automatisation email "Renouvellement imminent"
        await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Renouvellement imminent',
            contact_email: user.email,
            metadata: {
              cycle: user.commitment_cycle_number || 1,
              date_renouv: renewalDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
              jours: daysUntilRenewal,
              nom: user.role === 'premium_gold' ? 'Premium Gold' : 'Premium Silver',
              prix: user.role === 'premium_gold' ? '49,99€' : '29,99€'
            }
          })
        })

        // Marquer la notification comme envoyée
        await supabaseAdmin
          .from('profiles')
          .update({ commitment_renewal_notification_sent: true })
          .eq('id', user.id)

        notifications.push({
          user_id: user.id,
          email: user.email,
          days_until_renewal: daysUntilRenewal,
          status: 'sent'
        })

        console.log(`✅ Notification sent to ${user.email}`)
      } catch (error) {
        console.error(`❌ Error sending notification to ${user.email}:`, error)
        notifications.push({
          user_id: user.id,
          email: user.email,
          days_until_renewal: daysUntilRenewal,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked_at: now.toISOString(),
      notifications_sent: notifications.length,
      details: notifications
    })
  } catch (error: any) {
    console.error('❌ Error in check-renewals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
