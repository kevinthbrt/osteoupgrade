import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyAdmin } from '@/lib/admin-notify'

async function getOwnedTicket(id: string, userEmail: string) {
  const { data } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .eq('user_email', userEmail)
    .single()
  return data
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const ticket = await getOwnedTicket(params.id, user.email!)
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
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const ticket = await getOwnedTicket(params.id, user.email!)
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const { data: msg, error } = await supabaseAdmin
    .from('support_messages')
    .insert({ ticket_id: params.id, sender: 'user', content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admin of new user message in existing ticket
  await notifyAdmin('other', `[Support] Réponse dans : ${ticket.title}`, `De : ${user.email}`)

  // Reopen the ticket if it was resolved
  if (ticket.status === 'resolved') {
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'pending' })
      .eq('id', params.id)
  }

  return NextResponse.json({ message: msg })
}
