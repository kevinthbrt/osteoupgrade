import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyAdmin } from '@/lib/admin-notify'

const OSTEOFLOW_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

function verifySecret(req: NextRequest) {
  return req.headers.get('x-osteoflow-secret') === OSTEOFLOW_SECRET
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifySecret(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const url = new URL(req.url)
  const licenseEmail = url.searchParams.get('license_email')

  const query = supabaseAdmin
    .from('support_tickets')
    .select('id, user_email, license_email')
    .eq('id', params.id)

  if (licenseEmail) query.eq('license_email', licenseEmail)

  const { data: ticket } = await query.single()
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })

  const { data: messages, error } = await supabaseAdmin
    .from('support_messages')
    .select('id, sender, content, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: messages || [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifySecret(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { content, license_email } = body

  if (!content?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', params.id)

  if (license_email) query.eq('license_email', license_email)

  const { data: ticket } = await query.single()
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })

  const { data: msg, error } = await supabaseAdmin
    .from('support_messages')
    .insert({ ticket_id: params.id, sender: 'user', content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admin of new user message in existing ticket
  await notifyAdmin('other', `[Support MyOsteoFlow] Réponse dans : ${ticket.title}`, `De : ${ticket.license_email || ticket.user_email}`)

  // Reopen if resolved
  if (ticket.status === 'resolved') {
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'pending' })
      .eq('id', params.id)
  }

  return NextResponse.json({ message: msg })
}
