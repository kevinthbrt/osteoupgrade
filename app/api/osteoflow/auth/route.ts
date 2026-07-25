import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { notifyAdmin } from '@/lib/admin-notify'
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
    // Rate limiting anti brute-force : par IP et par email
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { email, password, device_id, device_name } = await request.json()

    if (!email || !password || !device_id) {
      return NextResponse.json({ error: 'Param\u00e8tres manquants' }, { status: 400, headers: CORS })
    }

    const ipLimit = rateLimit(`osteoflow-auth-ip:${ip}`, { limit: 10, windowSeconds: 60 })
    const emailLimit = rateLimit(`osteoflow-auth-email:${String(email).toLowerCase()}`, { limit: 5, windowSeconds: 300 })
    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfter ?? 0, emailLimit.retryAfter ?? 0)
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. R\u00e9essayez plus tard.' },
        { status: 429, headers: { ...CORS, 'Retry-After': String(retryAfter) } }
      )
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

    // 'trial' déverrouille MyOsteoFlow (mais pas le contenu premium — voir les
    // endpoints formations/flashcards qui, eux, excluent explicitement 'trial').
    if (!['premium', 'trial', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Un abonnement Premium Osteoupgrade est requis pour utiliser MyOsteoFlow.', code: 'NOT_PREMIUM' },
        { status: 403, headers: CORS }
      )
    }

    // 🚫 ANTI-ABUS ESSAI GRATUIT : un poste ne peut bénéficier que d'un seul
    // essai, tous comptes confondus. L'essai ne demandant plus de carte, c'est
    // le device_id qui sert d'ancrage — il vit dans la même base SQLite locale
    // que les dossiers patients, donc en obtenir un nouveau impose d'effacer
    // les données que l'utilisateur cherche justement à conserver.
    // Les comptes premium/admin ne sont jamais concernés.
    if (profile.role === 'trial') {
      const { data: existingClaim } = await supabaseAdmin
        .from('trial_device_claims')
        .select('user_id')
        .eq('device_id', device_id)
        .maybeSingle()

      if (existingClaim && existingClaim.user_id !== userId) {
        console.warn('⚠️ Trial abuse detected: device already used for a trial', {
          deviceId: device_id,
          previousUserId: existingClaim.user_id,
          currentUserId: userId,
        })

        await notifyAdmin(
          'other',
          'Essai gratuit bloqué (poste déjà utilisé)',
          `${email} a tenté un essai sur un poste ayant déjà bénéficié d'un essai (compte ${existingClaim.user_id}).`
        )

        return NextResponse.json(
          {
            error:
              "Cet ordinateur a déjà bénéficié d'un essai gratuit MyOsteoFlow. Souscrivez un abonnement pour continuer, ou contactez-nous si vous pensez qu'il s'agit d'une erreur.",
            code: 'TRIAL_DEVICE_ALREADY_USED',
          },
          { status: 403, headers: CORS }
        )
      }

      if (!existingClaim) {
        await supabaseAdmin
          .from('trial_device_claims')
          .upsert({ device_id, user_id: userId }, { onConflict: 'device_id', ignoreDuplicates: true })
      }
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
