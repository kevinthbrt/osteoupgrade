import { NextResponse } from 'next/server'
import { processAutomations } from '@/lib/automation-processor'
import { isAdminOrCron } from '@/lib/api-guards'

// Cette route est appelée soit par un cron (Bearer CRON_SECRET),
// soit manuellement depuis l'UI admin (cookie de session admin).

export async function POST(request: Request) {
  try {
    if (!(await isAdminOrCron(request))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    console.log('🔄 Processing automations...')
    const result = await processAutomations()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in automation processor:', error)
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

// Test manuel (admin uniquement)
export async function GET(request: Request) {
  try {
    if (!(await isAdminOrCron(request))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    console.log('🧪 Manual automation processing triggered')
    const result = await processAutomations()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      note: 'This is a manual trigger. In production, use POST with cron.'
    })
  } catch (error: any) {
    console.error('Error in automation processor:', error)
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
