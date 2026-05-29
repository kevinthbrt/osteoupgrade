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
    const { email, quiz_id, score, total_questions, correct_answers, passed, answers_data } = body

    if (!email || !quiz_id || typeof score !== 'number' || typeof passed !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.rpc('submit_quiz_attempt_for_email', {
      p_email: email,
      p_quiz_id: quiz_id,
      p_score: Math.round(score),
      p_total_questions: total_questions ?? 0,
      p_correct_answers: correct_answers ?? 0,
      p_passed: passed,
      p_answers_data: answers_data ?? {},
    })

    if (error) {
      console.error('[submit-quiz] rpc error:', error.code, error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[submit-quiz] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
