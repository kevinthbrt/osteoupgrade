import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deck_id } = await request.json()
  if (!deck_id) return NextResponse.json({ error: 'Missing deck_id' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('flashcard_certificates')
    .select('certificate_number, issued_at')
    .eq('user_id', user.id)
    .eq('deck_id', deck_id)
    .single()

  if (existing) return NextResponse.json({ certificate_number: existing.certificate_number, already_existed: true })

  const { data: deck } = await supabaseAdmin
    .from('flashcard_decks').select('total_cards, theme').eq('id', deck_id).single()
  if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 })

  const { count: mastered } = await supabaseAdmin
    .from('flashcard_progress').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('deck_id', deck_id).gt('repetition', 0)

  if ((mastered ?? 0) < deck.total_cards) {
    return NextResponse.json({ error: 'Not fully mastered', mastered, total: deck.total_cards }, { status: 400 })
  }

  const { data: certNumber } = await supabaseAdmin.rpc('next_certificate_number', { deck_theme: deck.theme })

  await supabaseAdmin.from('flashcard_certificates').insert({
    user_id: user.id, deck_id, certificate_number: certNumber as string,
  })

  const { data: achievement } = await supabaseAdmin
    .from('achievements').select('id').eq('slug', `osteoflash_${deck.theme}`).single()

  if (achievement) {
    await supabaseAdmin.from('user_achievements').upsert({
      user_id: user.id, achievement_id: achievement.id, unlocked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ certificate_number: certNumber, already_existed: false })
}
