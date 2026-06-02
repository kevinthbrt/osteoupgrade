import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'

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

    if (ticket.user_email) {
      try {
        await sendTransactionalEmail({
          to: ticket.user_email,
          subject: `Réponse à votre ticket : ${ticket.title}`,
          html: buildReplyEmailHtml(ticket.title, adminMessage.trim(), ticket.source),
          skipUnsubscribeFooter: true,
        })
      } catch (e) {
        console.error('Failed to send reply email:', e)
      }
    }
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

function buildReplyEmailHtml(title: string, reply: string, source: string) {
  const appName = source === 'osteoflow' ? 'MyOsteoFlow' : 'OsteoUpgrade'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f172a;margin:0 0 4px;">Réponse à votre ticket</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:12px;">Application : ${appName}</p>
      <p style="margin:0 0 8px;color:#0f172a;font-size:15px;font-weight:600;">${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <div style="background:#f0f9ff;border-left:4px solid #6366f1;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0 0 6px;color:#6366f1;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Réponse de l'équipe</p>
        <p style="margin:0;white-space:pre-wrap;color:#1e293b;font-size:14px;line-height:1.6;">${reply.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Pour répondre, ouvrez le widget support dans ${appName}.</p>
    </div>
  `
}
