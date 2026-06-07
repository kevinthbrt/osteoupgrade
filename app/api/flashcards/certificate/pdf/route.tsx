export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import FlashcardCertificate from '@/components/certificates/FlashcardCertificate'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deckId = request.nextUrl.searchParams.get('deck_id')
  if (!deckId) return NextResponse.json({ error: 'Missing deck_id' }, { status: 400 })

  const { data: cert } = await supabaseAdmin
    .from('flashcard_certificates')
    .select('certificate_number, issued_at, deck:flashcard_decks(title, total_cards)')
    .eq('user_id', user.id).eq('deck_id', deckId).single()

  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('full_name').eq('id', user.id).single()

  const deck = Array.isArray(cert.deck) ? cert.deck[0] : cert.deck as { title: string; total_cards: number } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(FlashcardCertificate, {
    recipientName: (profile as any)?.full_name || user.email || 'Praticien',
    deckTitle: deck?.title || 'Lombalgie',
    totalCards: deck?.total_cards || 115,
    certificateNumber: cert.certificate_number,
    issuedAt: cert.issued_at,
  }) as any

  const pdfBuffer = await renderToBuffer(element)

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificat-osteoflash-${cert.certificate_number}.pdf"`,
    },
  })
}
