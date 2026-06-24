import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const tokenUser = await getOsteoflowSessionUser(req)
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!tokenUser && (!expectedSecret || authHeader !== expectedSecret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = tokenUser?.email ?? searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'email requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.rpc('get_all_formations_with_progress', {
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
