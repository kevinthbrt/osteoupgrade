import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const quizId = searchParams.get('quiz_id')
    const userId = searchParams.get('user_id')

    if (!quizId || !userId) {
      return NextResponse.json({ error: 'Missing quiz_id or user_id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: attempts, error } = await supabase
      .from('elearning_quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
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
    const body = await request.json()
    const { quiz_id, user_id, score, total_questions, correct_answers, passed, answers_data } = body

    if (!quiz_id || !user_id || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: attempt, error } = await supabase
      .from('elearning_quiz_attempts')
      .insert({
        quiz_id,
        user_id,
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
