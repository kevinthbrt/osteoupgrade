import { NextResponse } from 'next/server'
import { processAutomations } from '@/lib/automation-processor'
import { isAdminOrCron } from '@/lib/api-guards'

// Cette route est appelée soit par un cron (Bearer CRON_SECRET),
// soit manuellement depuis l'UI admin (cookie de session admin).
//
// Sans maxDuration explicite, Vercel applique la limite par défaut de la
// plateforme (10s en Hobby / 15s en Pro), largement insuffisante dès qu'il y a
// plus de quelques enrollments à traiter (1 appel Resend + plusieurs requêtes
// DB par enrollment). C'est la cause du "Timeout" récurrent remonté par
// cron-job.org. processAutomations() s'arrête elle-même avant cette limite
// (voir TIME_BUDGET_MS dans automation-processor.ts) pour rendre la main
// proprement plutôt que d'être tuée en plein lot.
export const maxDuration = 280

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
