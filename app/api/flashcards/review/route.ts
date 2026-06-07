import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase-server'
import { z } from 'zod'

/**
 * SM-2 algorithm — full implementation
 *
 * Ratings:
 *   1 = Oublié   → reset complet, re-queue en session
 *   2 = Difficile → garde la progression, pénalise l'ease, revient demain
 *   3 = Bien      → progression normale
 *   4 = Facile    → progression boostée
 *
 * Fuzz ±5% sur les intervalles > 1 pour éviter le clustering.
 */
function sm2(
  rating: number,
  repetition: number,
  ease: number,
  interval: number
): { repetition: number; ease: number; interval: number } {
  let newRepetition = repetition
  let newEase = ease
  let newInterval = interval

  if (rating === 1) {
    // Oublié — reset total
    newRepetition = 0
    newEase = Math.max(1.3, ease - 0.2)
    newInterval = 1
  } else if (rating === 2) {
    // Difficile — garde la progression mais pénalise l'ease, repasse demain
    newEase = Math.max(1.3, ease - 0.15)
    newInterval = 1
    // repetition inchangé
  } else {
    // Bien (3) ou Facile (4)
    if (rating === 4) newEase = Math.min(2.5, ease + 0.15)

    if (repetition === 0) {
      newInterval = 1
    } else if (repetition === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEase)
      if (rating === 4) newInterval = Math.round(newInterval * 1.3)
    }
    newRepetition = repetition + 1
  }

  // Fuzz ±5% pour éviter le clustering (seulement sur intervalles > 1)
  if (newInterval > 1) {
    const fuzz = 1 + (Math.random() - 0.5) * 0.1
    newInterval = Math.max(2, Math.round(newInterval * fuzz))
  }

  return { repetition: newRepetition, ease: newEase, interval: newInterval }
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!['premium', 'admin'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Un abonnement Premium est requis pour accéder à OsteoFlash.', code: 'NOT_PREMIUM' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { card_id, deck_id, rating } = parsed.data

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

    const { error } = await supabaseAdmin
      .from('flashcard_progress')
      .upsert({
        user_id: user.id,
        card_id,
        deck_id,
        repetition,
        ease_factor: ease,
        interval_days: interval,
        next_review_at: nextReview.toISOString(),
        last_rating: rating,
        reviewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,card_id' })

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
