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

  const [cardsResult, progressResult] = await Promise.all([
    supabaseAdmin.from('flashcards').select('*').eq('deck_id', deckId).order('position', { ascending: true }),
    supabaseAdmin.from('flashcard_progress').select('*').eq('user_id', user.id).eq('deck_id', deckId),
  ])

  const progressMap: Record<string, unknown> = {}
  for (const p of (progressResult.data ?? [])) {
    progressMap[(p as { card_id: string }).card_id] = p
  }

  const cards = (cardsResult.data ?? []).map((card: { id: string; [key: string]: unknown }) => ({
    ...card,
    progress: progressMap[card.id] ?? null,
  }))

  return NextResponse.json({ cards })
}
