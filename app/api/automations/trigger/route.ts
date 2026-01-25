import { NextResponse } from 'next/server'
import { triggerAutomations, TriggerEvent } from '@/lib/automation-triggers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST - Déclencher manuellement des automatisations
// Requiert soit un CRON_SECRET (pour appels internes), soit une auth admin
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification: soit CRON_SECRET, soit admin auth
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let isAuthorized = false

    // Option 1: Vérifier CRON_SECRET pour appels internes
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    }

    // Option 2: Vérifier authentification admin
    if (!isAuthorized) {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (!authError && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Non autorisé. Authentification admin ou CRON_SECRET requis.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { event, contact_id, contact_email, tag, subscription_type, metadata } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
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
