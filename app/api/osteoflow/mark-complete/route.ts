import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const tokenUser = await getOsteoflowSessionUser(req)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { subpart_id, completed } = body
    const email = tokenUser.email

    if (!email || !subpart_id || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'email, subpart_id et completed requis' }, { status: 400 })
    }

    const fn = completed ? 'mark_subpart_complete_for_email' : 'mark_subpart_incomplete_for_email'
    const { error } = await supabaseAdmin.rpc(fn, {
      p_email: email,
      p_subpart_id: subpart_id,
    })

    if (error) {
      console.error('[mark-complete] rpc error:', error.code, error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mark-complete] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
