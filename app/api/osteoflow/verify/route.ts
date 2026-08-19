import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { entitlementsOf, hasOsteoflow, planOf } from '@/lib/entitlements'

const CONCURRENT_WINDOW_MS = 5 * 60 * 1000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const device_id = searchParams.get('device_id')

    if (!token || !device_id) {
      return NextResponse.json({ valid: false, error: 'Param\u00e8tres manquants' }, { status: 400, headers: CORS })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('osteoflow_sessions')
      .select('user_id, device_id')
      .eq('token', token)
      .eq('device_id', device_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { valid: false, error: 'Session invalide ou expir\u00e9e', code: 'INVALID_SESSION' },
        { headers: CORS }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, plan, email')
      .eq('id', session.user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ valid: false, error: 'Profil introuvable' }, { headers: CORS })
    }

    // Seules les offres incluant MyOsteoFlow gardent une session desktop valide.
    // Un abonn\u00e9 OsteoUpgrade seul re\u00e7oit un message distinct de l'expiration :
    // son abonnement est actif, c'est son offre qui ne couvre pas l'application.
    if (!hasOsteoflow(profile)) {
      const abonneSansOsteoflow = planOf(profile) === 'osteoupgrade'
      return NextResponse.json(
        {
          valid: false,
          error: abonneSansOsteoflow
            ? "Votre offre OsteoUpgrade n'inclut pas MyOsteoFlow. Ajoutez MyOsteoFlow depuis votre espace abonnement pour continuer \u00e0 utiliser l'application."
            : 'Votre abonnement Osteoupgrade Premium a expir\u00e9. Renouvelez votre abonnement pour continuer.',
          code: abonneSansOsteoflow ? 'PLAN_WITHOUT_OSTEOFLOW' : 'SUBSCRIPTION_EXPIRED',
        },
        { headers: CORS }
      )
    }

    if (profile.role === 'premium' || profile.role === 'trial') {
      const windowStart = new Date(Date.now() - CONCURRENT_WINDOW_MS).toISOString()
      const { data: activeSessions } = await supabaseAdmin
        .from('osteoflow_sessions')
        .select('device_id')
        .eq('user_id', session.user_id)
        .neq('device_id', device_id)
        .gt('last_active_at', windowStart)

      if (activeSessions && activeSessions.length > 0) {
        return NextResponse.json(
          {
            valid: false,
            error: "MyOsteoFlow est d\u00e9j\u00e0 actif sur un autre appareil. Fermez l'application sur l'autre appareil et r\u00e9essayez dans 5 minutes.",
            code: 'CONCURRENT_SESSION',
          },
          { headers: CORS }
        )
      }
    }

    await supabaseAdmin
      .from('osteoflow_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token)

    // `role` reste en t\u00eate de r\u00e9ponse : les binaires desktop d\u00e9j\u00e0 distribu\u00e9s le
    // lisent et le persistent. `plan` et `entitlements` sont purement additifs.
    return NextResponse.json(
      {
        valid: true,
        role: profile.role,
        plan: planOf(profile),
        entitlements: entitlementsOf(profile),
        email: profile.email,
      },
      { headers: CORS }
    )
  } catch (error) {
    console.error('[osteoflow/verify] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: CORS })
  }
}
