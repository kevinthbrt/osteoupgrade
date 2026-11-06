import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { escapeLike, findProfileByEmail, outboundThreadHead } from '@/lib/inbox'
import { aiAvailable } from '@/lib/inbox-ai'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/inbox/[threadId]
 *
 * Toute la conversation : messages reçus et réponses envoyées, dans l'ordre,
 * plus le compte de l'expéditeur s'il en a un. Ouvrir la conversation la
 * marque comme lue.
 */
export async function GET(_request: Request, { params }: { params: { threadId: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: messages, error } = await supabaseAdmin
    .from('received_emails')
    .select('*')
    .eq('thread_id', params.threadId)
    .order('received_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sans message reçu : conversation ouverte par nous, pas encore de réponse.
  const tete: any = messages?.length
    ? messages.reduce((a: any, b: any) => (b.received_at >= a.received_at ? b : a))
    : await outboundThreadHead(params.threadId)
  if (!tete) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const [{ data: replies }, profile] = await Promise.all([
    supabaseAdmin
      .from('inbox_replies')
      .select('id, email_id, to_email, from_email, subject, body_text, html, layout, attachments, status, error, created_at, sent_by')
      .eq('thread_id', params.threadId)
      .order('created_at', { ascending: true }),
    tete.profile_id
      ? supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, plan, role, is_founding_member, created_at')
          .eq('id', tete.profile_id)
          .maybeSingle()
          .then((r) => r.data)
      : findProfileByEmail(tete.from_email),
  ])

  // Historique côté client : autres conversations et emails de suivi.
  let history: { conversations: number; customerEmails: number } | null = null
  if (profile) {
    const [{ count: conv }, { count: suivis }] = await Promise.all([
      supabaseAdmin
        .from('received_emails')
        .select('id', { count: 'exact', head: true })
        .ilike('from_email', escapeLike(tete.from_email))
        .eq('is_latest', true),
      supabaseAdmin.from('customer_emails').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ])
    history = { conversations: conv || 0, customerEmails: suivis || 0 }
  }

  if (messages?.some((m: any) => !m.is_read)) {
    await supabaseAdmin
      .from('received_emails')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('thread_id', params.threadId)
      .eq('is_read', false)
  }

  return NextResponse.json({
    thread: { ...tete, is_read: true },
    messages: (messages || []).map((m: any) => ({ ...m, is_read: true })),
    replies: replies || [],
    profile: profile || null,
    history,
    aiAvailable: aiAvailable(),
  })
}

/** DELETE /api/admin/inbox/[threadId] : supprime toute la conversation. */
export async function DELETE(_request: Request, { params }: { params: { threadId: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('received_emails').delete().eq('thread_id', params.threadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseAdmin.from('inbox_replies').delete().eq('thread_id', params.threadId)

  return NextResponse.json({ success: true })
}
