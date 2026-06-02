import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const OSTEOFLOW_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-osteoflow-secret') === OSTEOFLOW_SECRET
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const licenseEmail = req.nextUrl.searchParams.get('license_email')

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .select('id, license_email, user_email, status, last_admin_message_at')
    .eq('id', params.id)
    .single()

  if (ticketError || !ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })
  if (licenseEmail && ticket.license_email !== licenseEmail) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { data: messages, error } = await supabaseAdmin
    .from('support_messages')
    .select('id, sender, content, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages: messages || [], ticket })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, license_email } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .select('id, license_email, status')
    .eq('id', params.id)
    .single()

  if (ticketError || !ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })
  if (license_email && ticket.license_email !== license_email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { data: msg, error } = await supabaseAdmin
    .from('support_messages')
    .insert({ ticket_id: params.id, sender: 'user', content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reopen ticket if it was resolved
  if (ticket.status === 'resolved') {
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'in_progress' })
      .eq('id', params.id)
  }

  return NextResponse.json({ message: msg })
}
