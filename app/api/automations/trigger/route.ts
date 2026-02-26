import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { triggerAutomations, TriggerEvent } from '@/lib/automation-triggers'

// POST - Déclencher manuellement des automatisations
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }

    const hasCronToken = cronSecret && authHeader === `Bearer ${cronSecret}`

    const body = await request.json()
    const { event, contact_id, contact_email, tag, subscription_type, metadata } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
    }

    const allowedUserEvents: TriggerEvent[] = ['Inscription', 'user_registered']

    if (!isAdmin && !hasCronToken) {
      const isAllowedUserEvent = user && allowedUserEvents.includes(event as TriggerEvent)
      const isMatchingEmail = user?.email && contact_email === user.email

      if (!isAllowedUserEvent || !isMatchingEmail) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const result = await triggerAutomations(event as TriggerEvent, {
      contact_id,
      contact_email,
      tag,
      subscription_type,
      metadata
    })

    return NextResponse.json({
      success: true,
      enrolled: result.enrolled,
      errors: result.errors,
      message: `${result.enrolled} automation(s) triggered`
    })
  } catch (error: any) {
    console.error('Error in POST /api/automations/trigger:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
