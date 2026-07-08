import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const tokenUser = await getOsteoflowSessionUser(req)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const formationId = searchParams.get('formation_id')
    const email = tokenUser.email

    if (!formationId || !email) {
      return NextResponse.json({ error: 'formation_id et email requis' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('get_formation_full', {
      p_email: email,
      p_formation_id: formationId,
    })

    if (error) {
      console.error('[course-full] rpc error:', error.code, error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[course-full] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
