import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { deckId: string } }
) {
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

    const { deckId } = params

    const [cardsResult, progressResult] = await Promise.all([
      supabaseAdmin
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('position', { ascending: true }),
      supabaseAdmin
        .from('flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('deck_id', deckId),
    ])

    if (cardsResult.error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const progressMap: Record<string, unknown> = {}
    for (const p of (progressResult.data ?? [])) {
      progressMap[(p as { card_id: string }).card_id] = p
    }

    const cards = cardsResult.data.map((card: { id: string; [key: string]: unknown }) => ({
      ...card,
      progress: progressMap[card.id] ?? null,
    }))

    return NextResponse.json({ cards })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
