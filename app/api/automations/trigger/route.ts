import { NextResponse } from 'next/server'
import { triggerAutomations, TriggerEvent } from '@/lib/automation-triggers'

// POST - Déclencher manuellement des automatisations
export async function POST(request: Request) {
  try {
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
