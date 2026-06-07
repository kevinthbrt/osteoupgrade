import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { z } from 'zod'

function verifySecret(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.OSTEOFLOW_PROXY_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

function sm2(rating: number, repetition: number, ease: number, interval: number) {
  if (rating < 3) return { repetition: 0, ease: Math.max(1.3, ease - 0.2), interval: 1 }
  const newEase = rating === 4 ? Math.min(2.5, ease + 0.15) : rating === 2 ? Math.max(1.3, ease - 0.2) : ease
  let newInterval = repetition === 0 ? 1 : repetition === 1 ? 6 : Math.round(interval * newEase)
  if (rating === 4 && repetition > 1) newInterval = Math.round(newInterval * 1.3)
  return { repetition: repetition + 1, ease: newEase, interval: newInterval }
}

const postSchema = z.object({
  email: z.string().email(),
  card_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
})

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email, card_id, deck_id, rating } = parsed.data

  const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
  const user = userList?.users?.find((u) => u.email === email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: existing } = await supabaseAdmin
    .from('flashcard_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', card_id)
    .single()

  const prev = existing as { repetition: number; ease_factor: number; interval_days: number } | null
  const { repetition, ease, interval } = sm2(rating, prev?.repetition ?? 0, prev?.ease_factor ?? 2.5, prev?.interval_days ?? 1)

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  await supabaseAdmin.from('flashcard_progress').upsert({
    user_id: user.id, card_id, deck_id,
    repetition, ease_factor: ease, interval_days: interval,
    next_review_at: nextReview.toISOString(),
    last_rating: rating, reviewed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,card_id' })

  return NextResponse.json({ repetition, ease_factor: ease, interval_days: interval, next_review_at: nextReview.toISOString() })
}
