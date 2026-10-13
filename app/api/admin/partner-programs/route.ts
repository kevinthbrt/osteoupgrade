import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// GET /api/admin/partner-programs : écoles partenaires et nombre de stagiaires
// rattachés à chacune.
export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: programmes, error } = await supabaseAdmin
    .from('partner_programs')
    .select('id, name, access_code, active, ends_at, note, created_at, partner_program_members(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    programs: (programmes ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      accessCode: p.access_code,
      active: p.active,
      endsAt: p.ends_at,
      note: p.note,
      createdAt: p.created_at,
      members: p.partner_program_members?.[0]?.count ?? 0,
    })),
  })
}

// POST /api/admin/partner-programs { name, accessCode, endsAt?, note? }
export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, accessCode, endsAt, note } = await request.json()
  const nom = typeof name === 'string' ? name.trim() : ''
  const code = typeof accessCode === 'string' ? accessCode.trim().toUpperCase() : ''

  if (!nom) return NextResponse.json({ error: "Le nom de l'école est requis." }, { status: 400 })
  if (!/^[A-Z0-9-]{6,40}$/.test(code)) {
    return NextResponse.json(
      { error: 'Le code doit compter 6 à 40 caractères (lettres, chiffres, tirets).' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('partner_programs')
    .insert({
      name: nom,
      access_code: code,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      note: typeof note === 'string' && note.trim() ? note.trim() : null,
    })
    .select('id')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'Ce code est déjà utilisé.' : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }
  return NextResponse.json({ id: data.id })
}

// PATCH /api/admin/partner-programs { id, active } : ouvre ou ferme un
// programme. Fermer n'affecte pas les abonnements déjà souscrits au tarif
// partenaire : seulement les nouvelles souscriptions.
export async function PATCH(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, active } = await request.json()
  if (!id || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'id et active requis' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('partner_programs').update({ active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
