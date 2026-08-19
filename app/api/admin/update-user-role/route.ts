import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isPlan } from '@/lib/entitlements'

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, role, plan } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Deux écritures possibles, jamais les deux à la fois :
  //   - `plan` : chemin cible, le trigger SQL en dérive le rôle miroir ;
  //   - `role` : chemin hérité conservé pour l'UI admin actuelle, le trigger
  //     en dérive `plan`. Passer 'admin' reste le seul moyen de promouvoir
  //     un compte, `admin` n'étant pas une offre.
  let patch: Record<string, string>
  if (plan !== undefined) {
    if (!isPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    patch = { plan }
  } else if (['free', 'trial', 'premium', 'admin'].includes(role)) {
    patch = { role }
  } else {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
