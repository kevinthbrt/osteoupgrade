import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { findUserByEmail } from '@/lib/find-user-by-email'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'
import { z } from 'zod'

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
    newRepetition = 0
    newEase = Math.max(1.3, ease - 0.2)
    newInterval = 1
  } else if (rating === 2) {
    newEase = Math.max(1.3, ease - 0.15)
    newInterval = 1
  } else {
    if (rating === 4) newEase = Math.min(2.5, ease + 0.15)
    if (repetition === 0) newInterval = 1
    else if (repetition === 1) newInterval = 6
    else {
      newInterval = Math.round(interval * newEase)
      if (rating === 4) newInterval = Math.round(newInterval * 1.3)
    }
    newRepetition = repetition + 1
  }

  if (newInterval > 1) {
    const fuzz = 1 + (Math.random() - 0.5) * 0.1
    newInterval = Math.max(2, Math.round(newInterval * fuzz))
  }

  return { repetition: newRepetition, ease: newEase, interval: newInterval }
}

const postSchema = z.object({
  email: z.string().email(),
  card_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
})

export async function POST(request: NextRequest) {
  const tokenUser = await getOsteoflowSessionUser(request)
  if (!tokenUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { card_id, deck_id, rating } = parsed.data
  const email = tokenUser.email

  const user = await findUserByEmail(email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!['premium', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Un abonnement Premium Osteoupgrade est requis pour utiliser OsteoFlash.', code: 'NOT_PREMIUM' }, { status: 403 })
  }

  const { data: existing } = await supabaseAdmin
    .from('flashcard_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', card_id)
    .single()

  const prev = existing as { repetition: number; ease_factor: number; interval_days: number } | null
  const { repetition, ease, interval } = sm2(
    rating,
    prev?.repetition ?? 0,
    prev?.ease_factor ?? 2.5,
    prev?.interval_days ?? 1
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  await supabaseAdmin.from('flashcard_progress').upsert({
    user_id: user.id, card_id, deck_id,
    repetition, ease_factor: ease, interval_days: interval,
    next_review_at: nextReview.toISOString(),
    last_rating: rating, reviewed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,card_id' })

  return NextResponse.json({
    repetition,
    ease_factor: ease,
    interval_days: interval,
    next_review_at: nextReview.toISOString(),
  })
}
