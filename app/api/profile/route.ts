import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { NextResponse } from 'next/server'
import { planToRole, type Plan } from '@/lib/entitlements'
import { SIMULATION_COOKIE, parseSimulatedPlan } from '@/lib/plan-simulation'

const CHAMPS = 'id, email, full_name, role, plan, subscription_status, is_founding_member, trial_used_at, trial_ends_at'

/**
 * Applique la simulation d'offre d'un administrateur (cf. lib/plan-simulation.ts).
 *
 * Réservée aux comptes dont le rôle **réel** est `admin` : pour tout autre
 * compte, un cookie forgé n'a strictement aucun effet. Le profil renvoyé porte
 * l'offre simulée et son rôle miroir, exactement comme le ferait la base pour
 * un vrai abonné — c'est ce qui rend la simulation fidèle sans rien écrire.
 */
function appliquerSimulation<T extends { role?: string | null } | null>(
  profile: T,
  simulation: Plan | null,
): { profile: T; simulation: Plan | null } {
  if (!profile || !simulation || profile.role !== 'admin') {
    return { profile, simulation: null }
  }
  return {
    profile: { ...profile, plan: simulation, role: planToRole(simulation) } as T,
    simulation,
  }
}

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const simulationDemandee = parseSimulatedPlan(cookieStore.get(SIMULATION_COOKIE)?.value)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(CHAMPS)
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profileError) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select(CHAMPS)
        .eq('id', user.id)
        .maybeSingle()

      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }

      const simule = appliquerSimulation(adminProfile, simulationDemandee)
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
        profile: simule.profile,
        simulation: simule.simulation,
      })
    }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
  }

  const simule = appliquerSimulation(profile, simulationDemandee)

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: simule.profile,
    simulation: simule.simulation,
  })
}
