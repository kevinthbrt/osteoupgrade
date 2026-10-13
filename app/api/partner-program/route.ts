import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { activePartnerProgramFor, joinPartnerProgram } from '@/lib/partner-programs'
import { logCustomerEvent } from '@/lib/customer-events'

export const dynamic = 'force-dynamic'

// GET /api/partner-program : école partenaire du compte connecté, si elle
// ouvre encore ses tarifs. Sert à afficher les tarifs partenaires.
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const program = await activePartnerProgramFor(user.id)
  return NextResponse.json({ program })
}

// POST /api/partner-program { code } : rattache le compte à l'école dont le
// stagiaire présente le code d'accès.
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json().catch(() => ({ code: null }))
  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Code école requis.' }, { status: 400 })
  }

  const resultat = await joinPartnerProgram(user.id, code)
  if (!resultat.ok) return NextResponse.json({ error: resultat.error }, { status: 400 })

  // N'échoue jamais : le suivi client avale ses propres erreurs.
  await logCustomerEvent({
    userId: user.id,
    email: user.email ?? '',
    type: 'other',
    source: 'app',
    comment: `École partenaire rejointe : ${resultat.program.name}`,
    metadata: { action: 'partner_program_joined', programme: resultat.program.name }
  })

  return NextResponse.json({ program: resultat.program })
}
