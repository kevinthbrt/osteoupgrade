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
    const { quiz_id, score, total_questions, correct_answers, passed, answers_data } = body
    const email = tokenUser.email

    if (!email || !quiz_id || typeof score !== 'number' || typeof passed !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('submit_quiz_attempt_for_email', {
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
