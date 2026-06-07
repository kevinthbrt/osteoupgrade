import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase-server'
import { z } from 'zod'

// SM-2 algorithm
// rating: 1=Oublié, 2=Difficile, 3=Bien, 4=Facile
function sm2(
  rating: number,
  repetition: number,
  ease: number,
  interval: number
): { repetition: number; ease: number; interval: number } {
  if (rating < 3) {
    // Failed — reset
    return { repetition: 0, ease: Math.max(1.3, ease - 0.2), interval: 1 }
  }

  const newEase = rating === 4
    ? Math.min(2.5, ease + 0.15)
    : rating === 2
    ? Math.max(1.3, ease - 0.2)
    : ease

  let newInterval: number
  if (repetition === 0) {
    newInterval = 1
  } else if (repetition === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEase)
    if (rating === 4) newInterval = Math.round(newInterval * 1.3)
  }

  return { repetition: repetition + 1, ease: newEase, interval: newInterval }
}

const postSchema = z.object({
  card_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
})

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

    const { card_id, deck_id, rating } = parsed.data

    // Get existing progress
    const { data: existing } = await supabaseAdmin
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', card_id)
      .single()

    const prev = existing as {
      repetition: number
      ease_factor: number
      interval_days: number
    } | null

    const { repetition, ease, interval } = sm2(
      rating,
      prev?.repetition ?? 0,
      prev?.ease_factor ?? 2.5,
      prev?.interval_days ?? 1
    )

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    const upsertData = {
      user_id: user.id,
      card_id,
      deck_id,
      repetition,
      ease_factor: ease,
      interval_days: interval,
      next_review_at: nextReview.toISOString(),
      last_rating: rating,
      reviewed_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('flashcard_progress')
      .upsert(upsertData, { onConflict: 'user_id,card_id' })

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      repetition,
      ease_factor: ease,
      interval_days: interval,
      next_review_at: nextReview.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
