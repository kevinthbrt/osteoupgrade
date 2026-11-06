import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { planLabel, planOf } from '@/lib/entitlements'
import { aiAvailable, draftReplyWithAi, type DraftThreadMessage } from '@/lib/inbox-ai'
import { htmlToText } from '@/lib/inbox-render'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

/**
 * POST /api/admin/inbox/[threadId]/draft
 *
 * Propose un brouillon de réponse rédigé par Claude, à relire dans le
 * composeur. Body facultatif : { instruction, templateBody }.
 */
export async function POST(request: Request, { params }: { params: { threadId: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!aiAvailable()) {
    return NextResponse.json({ error: 'IA indisponible : ANTHROPIC_API_KEY n’est pas configurée.' }, { status: 503 })
  }

  const payload = await request.json().catch(() => ({}))

  const [{ data: messages }, { data: replies }] = await Promise.all([
    supabaseAdmin
      .from('received_emails')
      .select('from_email, from_name, subject, text_content, html_content, received_at, profile_id, is_latest')
      .eq('thread_id', params.threadId)
      .order('received_at', { ascending: true }),
    supabaseAdmin
      .from('inbox_replies')
      .select('body_text, created_at')
      .eq('thread_id', params.threadId)
      .eq('status', 'sent')
      .order('created_at', { ascending: true }),
  ])

  if (!messages?.length) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  const tete = messages.find((m: any) => m.is_latest) || messages[messages.length - 1]

  const thread: DraftThreadMessage[] = [
    ...messages.map((m: any) => ({
      direction: 'in' as const,
      date: m.received_at,
      text: m.text_content || (m.html_content ? htmlToText(m.html_content) : ''),
    })),
    ...(replies || []).map((r: any) => ({ direction: 'out' as const, date: r.created_at, text: r.body_text })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  let customerContext: string | null = null
  if (tete.profile_id) {
    const { data: p } = await supabaseAdmin
      .from('profiles')
      .select('full_name, plan, role, is_founding_member, created_at')
      .eq('id', tete.profile_id)
      .maybeSingle()
    if (p) {
      const depuis = p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null
      customerContext = [
        p.full_name ? `nom ${p.full_name}` : null,
        `offre ${planLabel(planOf(p))}`,
        p.is_founding_member ? 'membre Fondateur' : null,
        depuis ? `inscrit depuis ${depuis}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    }
  }

  try {
    const draft = await draftReplyWithAi({
      fromEmail: tete.from_email,
      fromName: tete.from_name,
      subject: tete.subject || '',
      thread,
      customerContext,
      instruction: typeof payload.instruction === 'string' ? payload.instruction.slice(0, 1000) : null,
      templateBody: typeof payload.templateBody === 'string' ? payload.templateBody.slice(0, 4000) : null,
    })
    return NextResponse.json({ draft })
  } catch (err: any) {
    console.error('Inbox draft failed:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Échec de la génération' }, { status: 502 })
  }
}
