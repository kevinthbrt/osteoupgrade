import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: Request) {
  try {
    const { email, password, device_id, device_name } = await request.json()

    if (!email || !password || !device_id) {
      return NextResponse.json({ error: 'Param\u00e8tres manquants' }, { status: 400, headers: CORS })
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401, headers: CORS })
    }

    const userId = authData.user.id

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404, headers: CORS })
    }

    if (!['premium', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Un abonnement Premium Osteoupgrade est requis pour utiliser MyOsteoFlow.', code: 'NOT_PREMIUM' },
        { status: 403, headers: CORS }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    await supabaseAdmin.from('osteoflow_sessions').delete().eq('user_id', userId).eq('device_id', device_id)

    const { error: sessionError } = await supabaseAdmin.from('osteoflow_sessions').insert({
      user_id: userId,
      token,
      device_id,
      device_name: device_name || 'Appareil inconnu',
      last_active_at: new Date().toISOString(),
    })

    if (sessionError) {
      console.error('[osteoflow/auth] Session insert error:', sessionError)
      return NextResponse.json({ error: 'Impossible de cr\u00e9er la session' }, { status: 500, headers: CORS })
    }

    await anonClient.auth.signOut()

    return NextResponse.json(
      { token, email: authData.user.email, role: profile.role, expires_at: expiresAt },
      { headers: CORS }
    )
  } catch (error) {
    console.error('[osteoflow/auth] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: CORS })
  }
}
