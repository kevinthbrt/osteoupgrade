import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** POST /api/admin/customers/[id]/notes : ajoute une note interne. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { body, pinned } = await request.json().catch(() => ({}))
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Note vide' }, { status: 400 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', params.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('customer_notes')
    .insert({
      user_id: params.id,
      email: profile.email,
      body: body.trim().slice(0, 5000),
      pinned: Boolean(pinned),
      author_id: admin.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ note: data })
}

/** DELETE /api/admin/customers/[id]/notes?noteId=... */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const noteId = new URL(request.url).searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId manquant' }, { status: 400 })

  // Le `user_id` est réaffirmé dans le filtre : l'identifiant de note vient du
  // navigateur, il ne doit pas permettre de supprimer la note d'un autre.
  const { error } = await supabaseAdmin
    .from('customer_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
