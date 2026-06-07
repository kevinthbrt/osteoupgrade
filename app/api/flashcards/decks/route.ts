import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
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

    const { data: decks, error } = await supabaseAdmin
      .from('flashcard_decks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // For each deck, compute user progress
    const deckIds = decks.map((d: { id: string }) => d.id)

    const { data: progressRows } = await supabaseAdmin
      .from('flashcard_progress')
      .select('deck_id, repetition, next_review_at')
      .eq('user_id', user.id)
      .in('deck_id', deckIds)

    const progressByDeck: Record<string, { reviewed: number; due: number }> = {}
    for (const id of deckIds) {
      progressByDeck[id] = { reviewed: 0, due: 0 }
    }

    const now = new Date().toISOString()
    for (const row of (progressRows ?? [])) {
      if (!progressByDeck[row.deck_id]) continue
      if (row.repetition > 0) progressByDeck[row.deck_id].reviewed++
      if (row.next_review_at <= now) progressByDeck[row.deck_id].due++
    }

    const result = decks.map((deck: { id: string; total_cards: number; [key: string]: unknown }) => ({
      ...deck,
      user_reviewed: progressByDeck[deck.id]?.reviewed ?? 0,
      user_due: progressByDeck[deck.id]?.due ?? 0,
    }))

    return NextResponse.json({ decks: result })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
