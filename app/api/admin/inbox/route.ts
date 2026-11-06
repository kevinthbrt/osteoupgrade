import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isCategory, isStatus, INBOX_CATEGORIES } from '@/lib/inbox-render'
import { escapeLike } from '@/lib/inbox'

export const dynamic = 'force-dynamic'

const LIST_FIELDS =
  'id, thread_id, from_email, from_name, to_email, subject, text_content, category, category_source, category_reason, ai_summary, status, status_changed_at, replied_at, is_read, is_archived, received_at, attachments, profile_id'

/**
 * GET /api/admin/inbox
 *
 * Liste des conversations (une ligne par fil : son dernier message).
 *   view     : todo | waiting | done | unread | all | archived | sent  (défaut : todo)
 *   category : filtre de catégorie
 *   q        : recherche dans l'expéditeur et l'objet
 */
export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'todo'
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 300)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  if (view === 'sent') {
    const { threads, total } = await outboundThreads(q)
    const counts = await computeCounts(total)
    return NextResponse.json({ threads, counts })
  }

  let query = supabaseAdmin
    .from('received_emails')
    .select(LIST_FIELDS)
    .eq('is_latest', true)
    .order('received_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (view === 'archived') query = query.eq('is_archived', true)
  else {
    query = query.eq('is_archived', false)
    if (isStatus(view)) query = query.eq('status', view)
    if (view === 'unread') query = query.eq('is_read', false)
  }
  // « Tout » et « Non lus » n'affichent pas le spam, qui a sa propre vue.
  if (category && isCategory(category)) query = query.eq('category', category)
  else if (view === 'all' || view === 'unread') query = query.neq('category', 'spam')

  if (q) {
    const motif = `%${escapeLike(q).replace(/[,()]/g, ' ')}%`
    query = query.or(`from_email.ilike.${motif},from_name.ilike.${motif},subject.ilike.${motif}`)
  }

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const threadIds = Array.from(new Set((rows || []).map((r: any) => r.thread_id)))
  const profileIds = Array.from(new Set((rows || []).map((r: any) => r.profile_id).filter(Boolean)))

  const [messages, replies, profiles] = await Promise.all([
    threadIds.length
      ? supabaseAdmin.from('received_emails').select('thread_id').in('thread_id', threadIds)
      : Promise.resolve({ data: [] as any[] }),
    threadIds.length
      ? supabaseAdmin
          .from('inbox_replies')
          .select('thread_id, created_at, status')
          .in('thread_id', threadIds)
          .eq('status', 'sent')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    profileIds.length
      ? supabaseAdmin.from('profiles').select('id, full_name, plan, role, is_founding_member').in('id', profileIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const nbMessages = new Map<string, number>()
  for (const m of messages.data || []) nbMessages.set(m.thread_id, (nbMessages.get(m.thread_id) || 0) + 1)
  const nbReponses = new Map<string, number>()
  const derniereReponse = new Map<string, string>()
  for (const r of replies.data || []) {
    nbReponses.set(r.thread_id, (nbReponses.get(r.thread_id) || 0) + 1)
    if (!derniereReponse.has(r.thread_id)) derniereReponse.set(r.thread_id, r.created_at)
  }
  const profilParId = new Map((profiles.data || []).map((p: any) => [p.id, p]))

  const threads = (rows || []).map((r: any) => ({
    ...r,
    snippet: (r.text_content || '').replace(/\s+/g, ' ').trim().slice(0, 180),
    text_content: undefined,
    message_count: nbMessages.get(r.thread_id) || 1,
    reply_count: nbReponses.get(r.thread_id) || 0,
    last_reply_at: derniereReponse.get(r.thread_id) || null,
    profile: r.profile_id ? profilParId.get(r.profile_id) || null : null,
  }))

  const counts = await computeCounts()

  return NextResponse.json({ threads, counts })
}

/** Compteurs de la barre latérale (quelques centaines de lignes au plus). */
async function computeCounts(sentTotal?: number) {
  const { data } = await supabaseAdmin
    .from('received_emails')
    .select('status, category, is_read, is_archived')
    .eq('is_latest', true)
    .limit(10000)
  const all = data || []
  const actifs = all.filter((r: any) => !r.is_archived)
  return {
    todo: actifs.filter((r: any) => r.status === 'todo').length,
    waiting: actifs.filter((r: any) => r.status === 'waiting').length,
    done: actifs.filter((r: any) => r.status === 'done').length,
    unread: actifs.filter((r: any) => !r.is_read && r.category !== 'spam').length,
    all: actifs.filter((r: any) => r.category !== 'spam').length,
    archived: all.length - actifs.length,
    sent: sentTotal ?? (await outboundThreads()).total,
    categories: Object.fromEntries(
      INBOX_CATEGORIES.map((c) => [
        c,
        {
          total: actifs.filter((r: any) => r.category === c).length,
          todo: actifs.filter((r: any) => r.category === c && r.status === 'todo').length,
        },
      ])
    ),
  }
}

/**
 * Conversations ouvertes depuis « Nouveau message » et restées sans réponse :
 * elles n'ont aucun message reçu, donc n'apparaissent pas dans les autres vues.
 */
async function outboundThreads(q?: string) {
  const { data: envois } = await supabaseAdmin
    .from('inbox_replies')
    .select('id, thread_id, to_email, subject, body_text, status, created_at')
    .is('email_id', null)
    .order('created_at', { ascending: false })
    .limit(500)
  const parFil = new Map<string, any[]>()
  for (const e of envois || []) {
    if (!parFil.has(e.thread_id)) parFil.set(e.thread_id, [])
    parFil.get(e.thread_id)!.push(e)
  }
  const ids = Array.from(parFil.keys())
  const { data: recus } = ids.length
    ? await supabaseAdmin.from('received_emails').select('thread_id').in('thread_id', ids)
    : { data: [] as any[] }
  const avecReponse = new Set((recus || []).map((r: any) => r.thread_id))

  let threads = ids
    .filter((id) => !avecReponse.has(id))
    .map((id) => {
      const liste = parFil.get(id)!
      const dernier = liste[0]
      return {
        id: dernier.id,
        thread_id: id,
        from_email: dernier.to_email,
        from_name: null,
        to_email: '',
        subject: dernier.subject,
        snippet: (dernier.body_text || '').replace(/\s+/g, ' ').trim().slice(0, 180),
        category: 'general',
        category_source: 'manual',
        category_reason: null,
        ai_summary: null,
        status: 'waiting',
        status_changed_at: null,
        replied_at: dernier.created_at,
        is_read: true,
        is_archived: false,
        received_at: dernier.created_at,
        attachments: [],
        profile_id: null,
        message_count: 0,
        reply_count: liste.length,
        last_reply_at: dernier.status === 'sent' ? dernier.created_at : null,
        profile: null,
        outbound: true,
        failed: dernier.status === 'failed',
      }
    })
  const total = threads.length
  if (q) {
    const motif = q.toLowerCase()
    threads = threads.filter((t) => t.from_email.toLowerCase().includes(motif) || (t.subject || '').toLowerCase().includes(motif))
  }
  return { threads, total }
}

/**
 * PATCH /api/admin/inbox
 *
 * Action groupée sur des conversations : { threadIds, patch: { status?,
 * category?, is_read?, is_archived? } }.
 */
export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const threadIds: unknown = body.threadIds
  const patch = body.patch || {}

  if (!Array.isArray(threadIds) || threadIds.length === 0 || threadIds.length > 500) {
    return NextResponse.json({ error: 'Sélection invalide' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}
  if (patch.status !== undefined) {
    if (!isStatus(patch.status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    updates.status = patch.status
    updates.status_changed_at = now
  }
  if (patch.category !== undefined) {
    if (!isCategory(patch.category)) return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
    updates.category = patch.category
    updates.category_source = 'manual'
    updates.category_reason = 'Choisie à la main'
  }
  if (typeof patch.is_read === 'boolean') {
    updates.is_read = patch.is_read
    updates.read_at = patch.is_read ? now : null
  }
  if (typeof patch.is_archived === 'boolean') {
    updates.is_archived = patch.is_archived
    updates.archived_at = patch.is_archived ? now : null
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })

  // Lecture et catégorie valent pour tout le fil ; le statut et l'archivage
  // ne comptent que sur la tête de fil, mais les propager évite qu'un ancien
  // message ressorte tel quel si la tête est supprimée.
  const { error } = await supabaseAdmin.from('received_emails').update(updates).in('thread_id', threadIds as string[])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
