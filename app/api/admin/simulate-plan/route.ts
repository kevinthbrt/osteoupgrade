import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { isPlan } from '@/lib/entitlements'
import { SIMULATION_COOKIE, SIMULATION_MAX_AGE } from '@/lib/plan-simulation'

export const dynamic = 'force-dynamic'

/**
 * Active ou coupe la simulation d'offre (cf. lib/plan-simulation.ts).
 *
 * Aucune écriture en base : la simulation ne vit que dans un cookie, et
 * `/api/profile` ne l'honore que pour un compte réellement administrateur.
 * Body : { plan: 'free'|'osteoflow'|'osteoupgrade'|'bundle'|null }
 */
async function requireAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { error: null }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  let plan: unknown = null
  try {
    plan = (await request.json())?.plan ?? null
  } catch {
    plan = null
  }

  if (plan !== null && !isPlan(plan)) {
    return NextResponse.json({ error: 'Offre inconnue' }, { status: 400 })
  }

  const response = NextResponse.json({ simulation: plan })
  if (plan === null) {
    response.cookies.set(SIMULATION_COOKIE, '', { path: '/', maxAge: 0 })
  } else {
    response.cookies.set(SIMULATION_COOKIE, plan, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SIMULATION_MAX_AGE,
    })
  }
  return response
}

/** Sortie de simulation — utilisable depuis le bandeau, sans corps de requête. */
export async function DELETE() {
  const { error } = await requireAdmin()
  if (error) return error

  const response = NextResponse.json({ simulation: null })
  response.cookies.set(SIMULATION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
