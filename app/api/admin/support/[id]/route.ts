import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

async function verifyAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { status, message: adminMessage } = body

  const { data: ticket, error: fetchError } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })

  const updates: Record<string, unknown> = {}

  if (status !== undefined) {
    const valid = ['pending', 'in_progress', 'resolved']
    if (!valid.includes(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    updates.status = status
  }

  let newMessage = null
  if (adminMessage?.trim()) {
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('support_messages')
      .insert({ ticket_id: params.id, sender: 'admin', content: adminMessage.trim() })
      .select()
      .single()

    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })
    newMessage = msg

    const now = new Date().toISOString()
    updates.last_admin_message_at = now
    updates.admin_reply = adminMessage.trim()
    updates.admin_replied_at = now
  }

  let updatedTicket = ticket
  if (Object.keys(updates).length > 0) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    updatedTicket = updated
  }

  return NextResponse.json({ ticket: updatedTicket, message: newMessage })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('support_tickets')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
