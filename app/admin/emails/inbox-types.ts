import type { InboxCategory, InboxLayout, InboxStatus } from '@/lib/inbox-render'

export interface ThreadProfile {
  id: string
  email?: string
  full_name: string | null
  plan: string | null
  role: string | null
  is_founding_member: boolean | null
  created_at?: string | null
}

export interface ThreadRow {
  id: string
  thread_id: string
  from_email: string
  from_name: string | null
  to_email: string
  subject: string
  snippet: string
  category: InboxCategory
  category_source: 'auto' | 'rule' | 'ai' | 'manual'
  category_reason: string | null
  ai_summary: string | null
  status: InboxStatus
  status_changed_at: string | null
  replied_at: string | null
  is_read: boolean
  is_archived: boolean
  received_at: string
  attachments: any[]
  profile_id: string | null
  message_count: number
  reply_count: number
  last_reply_at: string | null
  profile: ThreadProfile | null
  /** Conversation ouverte par nous, sans réponse reçue. */
  outbound?: boolean
  failed?: boolean
}

export interface InboxCounts {
  todo: number
  waiting: number
  done: number
  unread: number
  all: number
  archived: number
  sent: number
  categories: Record<InboxCategory, { total: number; todo: number }>
}

export interface ReceivedMessage {
  id: string
  thread_id: string
  from_email: string
  from_name: string | null
  to_email: string
  subject: string
  html_content: string | null
  text_content: string | null
  resend_email_id: string | null
  received_at: string
  attachments: any[]
  category: InboxCategory
  category_source: string
  category_reason: string | null
  ai_summary: string | null
  status: InboxStatus
  is_latest: boolean
}

export interface SentReply {
  id: string
  to_email: string
  from_email: string | null
  subject: string
  body_text: string
  html: string
  layout: InboxLayout
  status: 'sent' | 'failed'
  error: string | null
  created_at: string
}

export interface ThreadDetail {
  thread: ReceivedMessage & { profile_id: string | null; replied_at: string | null; is_archived: boolean; is_read: boolean }
  messages: ReceivedMessage[]
  replies: SentReply[]
  profile: ThreadProfile | null
  history: { conversations: number; customerEmails: number } | null
  aiAvailable: boolean
}

export interface InboxTemplate {
  id: string
  name: string
  category: InboxCategory | null
  subject: string | null
  body: string
  layout: InboxLayout
  emoji: string | null
  banner_title: string | null
  sort_order: number
}

export interface InboxRule {
  id: string
  field: 'from' | 'domain' | 'subject' | 'body'
  pattern: string
  category: InboxCategory
  mark_done: boolean
  priority: number
  is_active: boolean
  hit_count: number
  last_hit_at: string | null
}

export interface InboxSettings {
  from_name: string
  signature: string
  default_layout: InboxLayout
  quote_original: boolean
  ai_enabled: boolean
  notify_categories: string[]
}

export type InboxView = 'todo' | 'waiting' | 'done' | 'unread' | 'all' | 'archived' | 'sent'

// ── Styles ─────────────────────────────────────────────────────────────────

export const CATEGORY_STYLE: Record<InboxCategory, { dot: string; pill: string }> = {
  support: { dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700 ring-sky-200' },
  facturation: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  parrainage: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-200' },
  prospection: { dot: 'bg-fuchsia-500', pill: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
  notification: { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-slate-200' },
  general: { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 ring-violet-200' },
  spam: { dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export const STATUS_STYLE: Record<InboxStatus, string> = {
  todo: 'bg-violet-600 text-white',
  waiting: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
]

export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(name: string | null, email: string): string {
  const source = (name || email.split('@')[0]).replace(/[0-9_+"'<>()[\]{}@!?,;:]/g, ' ').trim()
  const parts = source.split(/[\s.-]+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase()
}

export function relativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l’instant'
  if (mins < 60) return `${mins} min`
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const hier = new Date(now)
  hier.setDate(now.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return 'Hier'
  if (diff < 6 * 86400000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function sinceLabel(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return 'aujourd’hui'
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  return `le ${new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

export function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json', ...(init?.headers || {}) } : init?.headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`)
  return data as T
}

export type { InboxCategory, InboxLayout, InboxStatus }
