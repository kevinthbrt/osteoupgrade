import { NextResponse } from 'next/server'
import { processAutomations } from '@/lib/automation-processor'

// Cette route sera appelée par un cron job toutes les minutes
// Pour Vercel: configurez dans vercel.json
// Pour d'autres services: utilisez un service comme Uptime Robot ou Cron-job.org

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification (optionnel mais recommandé)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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

// Pour tester manuellement (à supprimer en production)
export async function GET(request: Request) {
  try {
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
