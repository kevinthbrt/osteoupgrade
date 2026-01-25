import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// Cette route sera appelée par un cron job QUOTIDIEN
// Détecte les utilisateurs inactifs depuis 30 jours et les comptes free depuis 14 jours

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification par CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Non autorisé. CRON_SECRET requis.' },
        { status: 401 }
      )
    }

    console.log('🔍 Starting daily checks...')

    let inactiveCount = 0
    let freeCount = 0

    // 1️⃣ DÉTECTER LES UTILISATEURS INACTIFS DEPUIS 30 JOURS
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, created_at')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .not('email', 'is', null)

      if (profiles && profiles.length > 0) {
        console.log(`Found ${profiles.length} inactive users (30+ days)`)

        for (const profile of profiles) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
              },
              body: JSON.stringify({
                event: 'Inactif depuis 30 jours',
                contact_email: profile.email,
                metadata: {
                  user_id: profile.id,
                  check_date: new Date().toISOString()
                }
              })
            })
            inactiveCount++
          } catch (err) {
            console.error(`Error triggering automation for ${profile.email}:`, err)
          }
        }
      }
    } catch (error) {
      console.error('Error checking inactive users:', error)
    }

    // 2️⃣ DÉTECTER LES COMPTES FREE DEPUIS 14 JOURS
    try {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

      const { data: freeProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, created_at')
        .eq('role', 'free')
        .lt('created_at', fourteenDaysAgo.toISOString())
        .gt('created_at', fifteenDaysAgo.toISOString())
        .not('email', 'is', null)

      if (freeProfiles && freeProfiles.length > 0) {
        console.log(`Found ${freeProfiles.length} free accounts (14 days old)`)

        for (const profile of freeProfiles) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
              },
              body: JSON.stringify({
                event: 'Sur free depuis 14 jours',
                contact_email: profile.email,
                metadata: {
                  user_id: profile.id,
                  account_age_days: 14,
                  check_date: new Date().toISOString()
                }
              })
            })
            freeCount++
          } catch (err) {
            console.error(`Error triggering automation for ${profile.email}:`, err)
          }
        }
      }
    } catch (error) {
      console.error('Error checking free accounts:', error)
    }

    console.log(`✅ Daily checks complete: ${inactiveCount} inactive, ${freeCount} free`)

    return NextResponse.json({
      success: true,
      inactive_users: inactiveCount,
      free_accounts: freeCount,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in daily checks:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET aussi protégé par CRON_SECRET
export async function GET(request: Request) {
  return POST(request)
}
