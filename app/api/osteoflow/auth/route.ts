import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Sessions are valid for 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email, password, device_id, device_name } = await request.json()

    if (!email || !password || !device_id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Authenticate with Supabase using the anon key
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    // Check the user's role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    if (!['premium', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        {
          error:
            'Un abonnement Premium Osteoupgrade est requis pour utiliser Osteoflow.',
          code: 'NOT_PREMIUM',
        },
        { status: 403 }
      )
    }

    // Generate a cryptographically secure session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    // Replace any existing session for this device
    await supabaseAdmin
      .from('osteoflow_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', device_id)

    const { error: sessionError } = await supabaseAdmin
      .from('osteoflow_sessions')
      .insert({
        user_id: userId,
        token,
        device_id,
        device_name: device_name || 'Appareil inconnu',
        last_active_at: new Date().toISOString(),
      })

    if (sessionError) {
      console.error('[osteoflow/auth] Session insert error:', sessionError)
      return NextResponse.json({ error: 'Impossible de créer la session' }, { status: 500 })
    }

    await anonClient.auth.signOut()

    return NextResponse.json({
      token,
      email: authData.user.email,
      role: profile.role,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('[osteoflow/auth] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
