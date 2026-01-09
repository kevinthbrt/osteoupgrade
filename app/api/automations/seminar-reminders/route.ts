import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Cette route sera appelée par un cron job QUOTIDIEN
// Détecte les séminaires à venir et envoie les rappels appropriés
// - 30 jours avant : rappel 1 mois
// - 7 jours avant : rappel 1 semaine
// - 1 jour avant : rappel veille

export async function POST(request: Request) {
  try {
    console.log('🔍 Starting seminar reminders check...')

    let oneMonthCount = 0
    let oneWeekCount = 0
    let oneDayCount = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1️⃣ RAPPEL 1 MOIS AVANT (30 jours)
    try {
      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data: seminarsOneMonth, error: error1 } = await supabase
        .from('seminars')
        .select('id, title, location, start_date, end_date, facilitator, theme')
        .gte('start_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .lt('start_date', new Date(thirtyDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error1) {
        console.error('Error fetching seminars (1 month):', error1)
      } else if (seminarsOneMonth && seminarsOneMonth.length > 0) {
        console.log(`Found ${seminarsOneMonth.length} seminars in 30 days`)

        for (const seminar of seminarsOneMonth) {
          // Récupérer tous les utilisateurs inscrits
          const { data: registrations } = await supabase
            .from('seminar_registrations')
            .select('user_id, profiles:user_id(email, full_name)')
            .eq('seminar_id', seminar.id)

          if (registrations && registrations.length > 0) {
            console.log(`Processing ${registrations.length} registrations for seminar: ${seminar.title}`)

            for (const registration of registrations) {
              try {
                const profile = (registration as any).profiles
                if (!profile || !profile.email) continue

                await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'seminar_reminder_1_month',
                    contact_email: profile.email,
                    metadata: {
                      user_id: registration.user_id,
                      user_name: profile.full_name || 'Cher membre',
                      seminar_id: seminar.id,
                      seminar_title: seminar.title,
                      seminar_location: seminar.location,
                      seminar_start_date: new Date(seminar.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_end_date: new Date(seminar.end_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_facilitator: seminar.facilitator || 'À confirmer',
                      seminar_theme: seminar.theme || '',
                      reminder_type: '1_month'
                    }
                  })
                })
                oneMonthCount++
              } catch (err) {
                console.error(`Error triggering 1-month reminder for ${(registration as any).profiles?.email}:`, err)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking 1-month seminars:', error)
    }

    // 2️⃣ RAPPEL 1 SEMAINE AVANT (7 jours)
    try {
      const sevenDaysFromNow = new Date(today)
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      const { data: seminarsOneWeek, error: error2 } = await supabase
        .from('seminars')
        .select('id, title, location, start_date, end_date, facilitator, theme')
        .gte('start_date', sevenDaysFromNow.toISOString().split('T')[0])
        .lt('start_date', new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error2) {
        console.error('Error fetching seminars (1 week):', error2)
      } else if (seminarsOneWeek && seminarsOneWeek.length > 0) {
        console.log(`Found ${seminarsOneWeek.length} seminars in 7 days`)

        for (const seminar of seminarsOneWeek) {
          const { data: registrations } = await supabase
            .from('seminar_registrations')
            .select('user_id, profiles:user_id(email, full_name)')
            .eq('seminar_id', seminar.id)

          if (registrations && registrations.length > 0) {
            console.log(`Processing ${registrations.length} registrations for seminar: ${seminar.title}`)

            for (const registration of registrations) {
              try {
                const profile = (registration as any).profiles
                if (!profile || !profile.email) continue

                await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'seminar_reminder_1_week',
                    contact_email: profile.email,
                    metadata: {
                      user_id: registration.user_id,
                      user_name: profile.full_name || 'Cher membre',
                      seminar_id: seminar.id,
                      seminar_title: seminar.title,
                      seminar_location: seminar.location,
                      seminar_start_date: new Date(seminar.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_end_date: new Date(seminar.end_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_facilitator: seminar.facilitator || 'À confirmer',
                      seminar_theme: seminar.theme || '',
                      reminder_type: '1_week'
                    }
                  })
                })
                oneWeekCount++
              } catch (err) {
                console.error(`Error triggering 1-week reminder for ${(registration as any).profiles?.email}:`, err)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking 1-week seminars:', error)
    }

    // 3️⃣ RAPPEL VEILLE (1 jour avant)
    try {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: seminarsOneDay, error: error3 } = await supabase
        .from('seminars')
        .select('id, title, location, start_date, end_date, facilitator, theme')
        .gte('start_date', tomorrow.toISOString().split('T')[0])
        .lt('start_date', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error3) {
        console.error('Error fetching seminars (1 day):', error3)
      } else if (seminarsOneDay && seminarsOneDay.length > 0) {
        console.log(`Found ${seminarsOneDay.length} seminars tomorrow`)

        for (const seminar of seminarsOneDay) {
          const { data: registrations } = await supabase
            .from('seminar_registrations')
            .select('user_id, profiles:user_id(email, full_name)')
            .eq('seminar_id', seminar.id)

          if (registrations && registrations.length > 0) {
            console.log(`Processing ${registrations.length} registrations for seminar: ${seminar.title}`)

            for (const registration of registrations) {
              try {
                const profile = (registration as any).profiles
                if (!profile || !profile.email) continue

                await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'seminar_reminder_1_day',
                    contact_email: profile.email,
                    metadata: {
                      user_id: registration.user_id,
                      user_name: profile.full_name || 'Cher membre',
                      seminar_id: seminar.id,
                      seminar_title: seminar.title,
                      seminar_location: seminar.location,
                      seminar_start_date: new Date(seminar.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_end_date: new Date(seminar.end_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      seminar_facilitator: seminar.facilitator || 'À confirmer',
                      seminar_theme: seminar.theme || '',
                      reminder_type: '1_day'
                    }
                  })
                })
                oneDayCount++
              } catch (err) {
                console.error(`Error triggering 1-day reminder for ${(registration as any).profiles?.email}:`, err)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking 1-day seminars:', error)
    }

    console.log(`✅ Seminar reminders complete: ${oneMonthCount} (1 month), ${oneWeekCount} (1 week), ${oneDayCount} (1 day)`)

    return NextResponse.json({
      success: true,
      one_month_reminders: oneMonthCount,
      one_week_reminders: oneWeekCount,
      one_day_reminders: oneDayCount,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in seminar reminders:', error)
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

// Pour tester manuellement
export async function GET(request: Request) {
  return POST(request)
}
