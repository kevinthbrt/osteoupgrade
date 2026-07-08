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

    const { data, error } = await supabaseAdmin.rpc('get_formation_progress_full', {
      p_email: email,
      p_formation_id: formationId,
    })

    if (error) {
      console.error('[course-progress] rpc error:', error.code, error.message)
      return NextResponse.json({ total: 0, completed: 0, chapters: [] })
    }

    return NextResponse.json(data ?? { total: 0, completed: 0, chapters: [] })
  } catch (err) {
    console.error('[course-progress] unhandled:', err)
    return NextResponse.json({ total: 0, completed: 0, chapters: [] })
  }
}
