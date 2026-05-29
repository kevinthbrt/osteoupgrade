import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { email, subpart_id, completed } = body

    if (!email || !subpart_id || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'email, subpart_id et completed requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const fn = completed ? 'mark_subpart_complete_for_email' : 'mark_subpart_incomplete_for_email'
    const { error } = await supabase.rpc(fn, {
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
