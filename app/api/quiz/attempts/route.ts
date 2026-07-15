import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { z } from 'zod'

const getSchema = z.object({
  quiz_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

const postSchema = z.object({
  quiz_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  total_questions: z.number().int().min(1).optional(),
  correct_answers: z.number().int().min(0).optional(),
  passed: z.boolean().optional(),
  answers_data: z.unknown().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const parsed = getSchema.safeParse({
      quiz_id: searchParams.get('quiz_id'),
      user_id: searchParams.get('user_id'),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { quiz_id, user_id } = parsed.data

    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: attempts, error } = await supabaseAdmin
      .from('elearning_quiz_attempts')
      .select('*')
      .eq('quiz_id', quiz_id)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ attempts })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { quiz_id, user_id, score, total_questions, correct_answers, passed, answers_data } = parsed.data

    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: attempt, error } = await supabaseAdmin
      .from('elearning_quiz_attempts')
      .insert({
        quiz_id,
        user_id: user.id,
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
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ attempt })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
