import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { findUserByEmail } from '@/lib/find-user-by-email'

function verifySecret(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.OSTEOFLOW_PROXY_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get('email')
  const deckId = request.nextUrl.searchParams.get('deck_id')
  if (!email || !deckId) {
    return NextResponse.json({ error: 'Missing email or deck_id' }, { status: 400 })
  }

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

  const [cardsResult, progressResult] = await Promise.all([
    supabaseAdmin.from('flashcards').select('*').eq('deck_id', deckId).order('position', { ascending: true }),
    supabaseAdmin.from('flashcard_progress').select('*').eq('user_id', user.id).eq('deck_id', deckId),
  ])

  const progressMap: Record<string, { repetition: number; ease_factor: number; interval_days: number; next_review_at: string }> = {}
  for (const p of (progressResult.data ?? [])) {
    progressMap[(p as { card_id: string }).card_id] = p as { repetition: number; ease_factor: number; interval_days: number; next_review_at: string }
  }

  const now = new Date().toISOString()
  const cards = (cardsResult.data ?? []).map((card: { id: string; question: string; answer: string; explanation?: string; [key: string]: unknown }) => {
    const progress = progressMap[card.id] ?? null
    return {
      ...card,
      front: card.question,
      back: card.answer,
      repetition: progress?.repetition ?? 0,
      ease: progress?.ease_factor ?? 2.5,
      interval: progress?.interval_days ?? 1,
      due_date: progress?.next_review_at ?? now,
      progress,
    }
  })

  return NextResponse.json({ cards })
}
