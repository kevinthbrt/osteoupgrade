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
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: decks } = await supabaseAdmin
    .from('flashcard_decks')
    .select('*')
    .order('created_at', { ascending: true })

  const deckIds = (decks ?? []).map((d: { id: string }) => d.id)
  const { data: progressRows } = await supabaseAdmin
    .from('flashcard_progress')
    .select('deck_id, repetition, next_review_at')
    .eq('user_id', user.id)
    .in('deck_id', deckIds)

  const now = new Date().toISOString()
  const progressByDeck: Record<string, { reviewed: number; due: number }> = {}
  for (const id of deckIds) progressByDeck[id] = { reviewed: 0, due: 0 }
  for (const row of (progressRows ?? [])) {
    if (row.repetition > 0) progressByDeck[row.deck_id].reviewed++
    if (row.next_review_at <= now) progressByDeck[row.deck_id].due++
  }

  const result = (decks ?? []).map((deck: { id: string; title: string; total_cards: number; [key: string]: unknown }) => ({
    ...deck,
    name: deck.title,
    user_reviewed: progressByDeck[deck.id]?.reviewed ?? 0,
    user_due: progressByDeck[deck.id]?.due ?? 0,
  }))

  return NextResponse.json({ decks: result })
}
