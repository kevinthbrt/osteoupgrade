import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const quizId = searchParams.get('quiz_id')

    if (!quizId) {
      return NextResponse.json({ error: 'Missing quiz_id' }, { status: 400 })
    }

    // Utiliser l'ID de l'utilisateur authentifié (pas celui du paramètre)
    const { data: attempts, error } = await supabase
      .from('elearning_quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error fetching quiz attempts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Error in GET /api/quiz/attempts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { quiz_id, score, total_questions, correct_answers, passed, answers_data } = body

    if (!quiz_id || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Utiliser l'ID de l'utilisateur authentifié (pas celui du body)
    const { data: attempt, error } = await supabase
      .from('elearning_quiz_attempts')
      .insert({
        quiz_id,
        user_id: user.id, // Utiliser l'ID de l'utilisateur authentifié
        score,
        total_questions,
        correct_answers,
        passed,
        answers_data,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz attempt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Error in POST /api/quiz/attempts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
