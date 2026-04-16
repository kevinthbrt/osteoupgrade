import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// Window for detecting concurrent sessions (5 minutes)
const CONCURRENT_WINDOW_MS = 5 * 60 * 1000

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const device_id = searchParams.get('device_id')

    if (!token || !device_id) {
      return NextResponse.json(
        { valid: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Look up the session by token + device_id
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('osteoflow_sessions')
      .select('user_id, device_id')
      .eq('token', token)
      .eq('device_id', device_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({
        valid: false,
        error: 'Session invalide ou expirée',
        code: 'INVALID_SESSION',
      })
    }

    // Check current subscription role (source of truth)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', session.user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ valid: false, error: 'Profil introuvable' })
    }

    if (!['premium', 'admin'].includes(profile.role)) {
      return NextResponse.json({
        valid: false,
        error:
          'Votre abonnement Osteoupgrade Premium a expiré. Renouvelez votre abonnement pour continuer.',
        code: 'SUBSCRIPTION_EXPIRED',
      })
    }

    // Detect concurrent sessions — premium only, admins are exempt
    if (profile.role === 'premium') {
      const windowStart = new Date(Date.now() - CONCURRENT_WINDOW_MS).toISOString()
      const { data: activeSessions } = await supabaseAdmin
        .from('osteoflow_sessions')
        .select('device_id')
        .eq('user_id', session.user_id)
        .neq('device_id', device_id)
        .gt('last_active_at', windowStart)

      if (activeSessions && activeSessions.length > 0) {
        return NextResponse.json({
          valid: false,
          error:
            "Osteoflow est déjà actif sur un autre appareil. Fermez l'application sur l'autre appareil et réessayez dans 5 minutes.",
          code: 'CONCURRENT_SESSION',
        })
      }
    }

    // Update heartbeat
    await supabaseAdmin
      .from('osteoflow_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token)

    return NextResponse.json({ valid: true, role: profile.role, email: profile.email })
  } catch (error) {
    console.error('[osteoflow/verify] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
