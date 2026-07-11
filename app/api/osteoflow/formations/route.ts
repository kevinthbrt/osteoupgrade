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

    const email = tokenUser.email

    if (!email) {
      return NextResponse.json({ error: 'email requis' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('get_all_formations_with_progress', {
      p_email: email,
    })

    if (error) {
      console.error('[formations] rpc error:', error.code, error.message)
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[formations] unhandled:', err)
    return NextResponse.json([], { status: 500 })
  }
}
