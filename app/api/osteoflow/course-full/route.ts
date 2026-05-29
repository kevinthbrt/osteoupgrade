import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const formationId = searchParams.get('formation_id')
    const email = searchParams.get('email')

    if (!formationId || !email) {
      return NextResponse.json({ error: 'formation_id et email requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.rpc('get_formation_full', {
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
