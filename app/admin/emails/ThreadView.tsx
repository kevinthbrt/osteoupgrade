'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Archive, ArchiveRestore, ArrowLeft, Bot, Check, ChevronDown, ChevronUp, Crown, ExternalLink, Filter,
  Loader2, Mail, MailOpen, Paperclip, Reply, Sparkles, Trash2, UserRound, AlertTriangle,
} from 'lucide-react'
import { CATEGORY_LABELS, INBOX_CATEGORIES, STATUS_LABELS, htmlToText } from '@/lib/inbox-render'
import { planLabel, planOf } from '@/lib/entitlements'
import Composer from './Composer'
import {
  CATEGORY_STYLE, api, avatarColor, fullDate, initials, sinceLabel,
  type InboxCategory, type InboxSettings, type InboxStatus, type InboxTemplate, type ReceivedMessage, type SentReply, type ThreadDetail,
} from './inbox-types'

interface Props {
  detail: ThreadDetail | null
  loading: boolean
  templates: InboxTemplate[]
  settings: InboxSettings
  composerOpen: boolean
  setComposerOpen: (v: boolean) => void
  onBack: () => void
  onPatch: (patch: { status?: InboxStatus; category?: InboxCategory; is_read?: boolean; is_archived?: boolean }) => Promise<void>
  onDelete: () => void
  onSent: (status?: string) => void
  onOpenProfile: (id: string) => void
  onRuleCreated: (message: string) => void
}

/** Corps HTML d'un email reçu, isolé dans une iframe qui s'ajuste à sa hauteur. */
function MessageFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(120)
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;color:#334155;word-break:break-word}img{max-width:100%;height:auto}a{color:#7c3aed}blockquote{margin:0 0 0 4px;padding-left:12px;border-left:3px solid #e2e8f0;color:#64748b}</style></head><body>${html}</body></html>`
  return (
    <iframe
      ref={ref}
      title="Contenu de l’email"
      srcDoc={doc}
      // Pas de scripts : le HTML reçu vient de n'importe qui. `allow-same-origin`
      // sert seulement à mesurer la hauteur du contenu.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="w-full border-0"
      style={{ height }}
      onLoad={() => {
        const h = ref.current?.contentDocument?.documentElement?.scrollHeight
        if (h) setHeight(Math.min(Math.max(h + 8, 60), 4000))
      }}
    />
  )
}

function ReceivedItem({ m, expanded, onToggle }: { m: ReceivedMessage; expanded: boolean; onToggle: () => void }) {
  const texte = m.text_content || (m.html_content ? htmlToText(m.html_content) : '')
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/70">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(m.from_email)}`}>
          {initials(m.from_name, m.from_email)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {m.from_name || m.from_email}
            {m.from_name && <span className="ml-1.5 font-normal text-xs text-slate-400">{m.from_email}</span>}
          </p>
          {!expanded && <p className="text-xs text-slate-500 truncate">{texte.replace(/\s+/g, ' ').slice(0, 140)}</p>}
          {expanded && <p className="text-[11px] text-slate-400">à {m.to_email}</p>}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0">{fullDate(m.received_at)}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {m.html_content ? (
            <MessageFrame html={m.html_content} />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{texte || <em className="text-slate-400">Aucun contenu</em>}</p>
          )}
          {m.attachments?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              {m.attachments.map((att: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={async () => {
                    if (!m.resend_email_id || !att.id) return alert('Pièce jointe indisponible')
                    // La route renvoie un lien signé Resend (valable une heure),
                    // pas le fichier. La fenêtre est ouverte avant l'appel pour
                    // ne pas être bloquée comme fenêtre surgissante.
                    const fenetre = window.open('', '_blank')
                    try {
                      const res = await fetch(`/api/emails/${m.resend_email_id}/attachments/${att.id}`)
                      const data = await res.json().catch(() => ({}))
                      const url = data?.attachment?.downloadUrl
                      if (!res.ok || !url) throw new Error()
                      if (fenetre) fenetre.location.href = url
                      else window.location.href = url
                    } catch {
                      fenetre?.close()
                      alert('Impossible de télécharger la pièce jointe')
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:bg-violet-50 hover:border-violet-200"
                >
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="max-w-[180px] truncate">{att.filename || 'Pièce jointe'}</span>
                  {att.size ? <span className="text-slate-400">{Math.ceil(att.size / 1024)} Ko</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReplyItem({ r }: { r: SentReply }) {
  const [open, setOpen] = useState(false)
  const failed = r.status === 'failed'
  return (
    <div className={`ml-6 sm:ml-12 rounded-2xl border overflow-hidden ${failed ? 'bg-rose-50 border-rose-200' : 'bg-violet-50/70 border-violet-100'}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
        {failed ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <Reply className="h-4 w-4 text-violet-500" />}
        <span className={`text-xs font-semibold ${failed ? 'text-rose-700' : 'text-violet-800'}`}>
          {failed ? 'Échec de l’envoi' : 'Vous avez répondu'}
        </span>
        <span className="text-[11px] text-slate-500 truncate">à {r.to_email}</span>
        <span className="ml-auto text-[11px] text-slate-400 shrink-0">{fullDate(r.created_at)}</span>
      </button>
      <div className="px-4 pb-3">
        <p className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${open ? '' : 'line-clamp-3'}`}>{r.body_text}</p>
        {failed && r.error && <p className="mt-2 text-xs text-rose-600">{r.error}</p>}
        {r.attachments && r.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.attachments.map((a) => (
              <button
                key={a.path}
                type="button"
                onClick={async () => {
                  const fenetre = window.open('', '_blank')
                  try {
                    const res = await fetch(`/api/admin/inbox/attachments?path=${encodeURIComponent(a.path)}`)
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok || !data.url) throw new Error()
                    if (fenetre) fenetre.location.href = data.url
                    else window.location.href = data.url
                  } catch {
                    fenetre?.close()
                    alert('Pièce jointe indisponible')
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-violet-100 text-[11px] text-slate-700 hover:border-violet-300"
              >
                <Paperclip className="h-3 w-3 text-violet-400" />
                <span className="max-w-[160px] truncate">{a.filename}</span>
              </button>
            ))}
          </div>
        )}
        {open && (
          <div className="mt-3 rounded-xl border border-violet-100 bg-white overflow-hidden">
            <iframe title="Email envoyé" srcDoc={r.html} sandbox="" className="w-full h-80" />
          </div>
        )}
      </div>
    </div>
  )
}

function RuleDialog({ email, category, onClose, onDone }: { email: string; category: InboxCategory; onClose: () => void; onDone: (msg: string) => void }) {
  const domain = email.split('@')[1] || ''
  const [field, setField] = useState<'from' | 'domain'>('from')
  const [cat, setCat] = useState<InboxCategory>(category)
  const [markDone, setMarkDone] = useState(category === 'spam' || category === 'notification' || category === 'prospection')
  const [apply, setApply] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const res = await api<{ reclassified: { changed: number } | null }>('/api/admin/inbox/rules', {
        method: 'POST',
        json: { field, pattern: field === 'from' ? email : domain, category: cat, mark_done: markDone, applyToExisting: apply },
      })
      onDone(`Règle créée${res.reclassified ? `, ${res.reclassified.changed} conversation(s) reclassée(s)` : ''}.`)
    } catch (e: any) {
      setErr(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Filter className="h-4 w-4 text-violet-600" /> Classer automatiquement
        </h3>
        <p className="text-xs text-slate-500 mt-1">Les prochains emails correspondants seront rangés sans intervention.</p>

        <div className="mt-4 space-y-3 text-sm">
          <div className="space-y-1.5">
            {(['from', 'domain'] as const).map((f) => (
              <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer ${field === f ? 'border-violet-300 bg-violet-50' : 'border-slate-200'}`}>
                <input type="radio" checked={field === f} onChange={() => setField(f)} className="accent-violet-600" />
                {f === 'from' ? (
                  <span>Les emails de <strong className="font-medium">{email}</strong></span>
                ) : (
                  <span>Tout le domaine <strong className="font-medium">@{domain}</strong></span>
                )}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="text-slate-600 w-24">Catégorie</span>
            <select value={cat} onChange={(e) => setCat(e.target.value as InboxCategory)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm">
              {INBOX_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} className="accent-violet-600" />
            Marquer comme traité (aucune réponse attendue)
          </label>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} className="accent-violet-600" />
            Appliquer aussi au courrier déjà reçu
          </label>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Créer la règle
          </button>
        </div>
      </div>
    </div>
  )
}

const SOURCE_LABEL: Record<string, string> = { auto: 'Tri automatique', rule: 'Règle', ai: 'IA', manual: 'Manuel' }

export default function ThreadView({
  detail, loading, templates, settings, composerOpen, setComposerOpen, onBack, onPatch, onDelete, onSent, onOpenProfile, onRuleCreated,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [ruleOpen, setRuleOpen] = useState(false)
  const composerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!detail) return
    const dernier = detail.messages[detail.messages.length - 1]
    setExpanded(new Set(dernier ? [dernier.id] : []))
    setShowAll(detail.messages.length + detail.replies.length <= 4)
  }, [detail?.thread.thread_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (composerOpen) setTimeout(() => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
  }, [composerOpen])

  if (loading && !detail) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (!detail) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
          <Mail className="h-7 w-7 text-violet-500" />
        </div>
        <p className="text-sm font-medium text-slate-700">Sélectionnez une conversation</p>
        <p className="text-xs text-slate-400 mt-1">Raccourcis : <kbd className="px-1 rounded bg-slate-100">j</kbd> / <kbd className="px-1 rounded bg-slate-100">k</kbd> pour naviguer, <kbd className="px-1 rounded bg-slate-100">r</kbd> pour répondre, <kbd className="px-1 rounded bg-slate-100">e</kbd> pour clore</p>
      </div>
    )
  }

  const { thread, messages, replies, profile, history } = detail
  const timeline = [
    ...messages.map((m) => ({ kind: 'in' as const, date: m.received_at, m })),
    ...replies.map((r) => ({ kind: 'out' as const, date: r.created_at, r })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const visibles = showAll ? timeline : timeline.slice(-3)
  const caches = timeline.length - visibles.length
  const style = CATEGORY_STYLE[thread.category]

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* En-tête */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="flex items-start gap-2">
          <button type="button" onClick={onBack} className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 leading-snug break-words">{thread.subject || '(sans objet)'}</h2>
            {thread.ai_summary && (
              <p className="mt-1 text-xs text-violet-700 flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {thread.ai_summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {messages.length > 0 && <>
            <button type="button" title="Classer automatiquement les emails de cet expéditeur" onClick={() => setRuleOpen(true)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-violet-600">
              <Filter className="h-4 w-4" />
            </button>
            <button type="button" title="Marquer non lu" onClick={() => onPatch({ is_read: false })} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <MailOpen className="h-4 w-4" />
            </button>
            <button type="button" title={thread.is_archived ? 'Désarchiver' : 'Archiver'} onClick={() => onPatch({ is_archived: !thread.is_archived })} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              {thread.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </button>
            </>}
            <button type="button" title="Supprimer la conversation" onClick={onDelete} className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 inline-block px-2.5 py-1 rounded-lg">
            Message envoyé depuis la boîte, en attente d’une réponse de {thread.from_email}.
          </p>
        ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 text-xs font-medium">
            {(['todo', 'waiting', 'done'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPatch({ status: s })}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${thread.status === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {thread.status === s && <Check className="h-3 w-3 text-violet-600" />}
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="relative inline-flex items-center">
            <span className={`absolute left-2.5 w-2 h-2 rounded-full ${style.dot}`} />
            <select
              value={thread.category}
              onChange={(e) => onPatch({ category: e.target.value as InboxCategory })}
              className={`appearance-none pl-6 pr-7 py-1.5 rounded-xl text-xs font-medium ring-1 ring-inset cursor-pointer outline-none ${style.pill}`}
            >
              {INBOX_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-60" />
          </div>

          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1" title={thread.category_reason || ''}>
            {thread.category_source === 'ai' ? <Bot className="h-3 w-3" /> : null}
            {SOURCE_LABEL[thread.category_source] || ''}{thread.category_reason ? ` : ${thread.category_reason}` : ''}
          </span>

          {thread.replied_at && (
            <span className="ml-auto text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
              <Reply className="h-3 w-3" /> Répondu {sinceLabel(thread.replied_at)}
            </span>
          )}
        </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-slate-50/60">
        {/* Fiche expéditeur */}
        {profile ? (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
              <UserRound className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                {profile.full_name || profile.email}
                {profile.is_founding_member && <Crown className="h-3.5 w-3.5 text-amber-500" />}
              </p>
              <p className="text-[11px] text-slate-500">
                Client · {planLabel(planOf(profile as any))}
                {profile.created_at ? ` · inscrit ${sinceLabel(profile.created_at)}` : ''}
                {history ? ` · ${history.conversations} conversation(s), ${history.customerEmails} email(s) de suivi` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenProfile(profile.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100"
            >
              Fiche client <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 px-1">Aucun compte OsteoUpgrade associé à {thread.from_email}.</p>
        )}

        {caches > 0 && (
          <button type="button" onClick={() => setShowAll(true)} className="w-full py-2 text-xs text-violet-700 font-medium rounded-xl border border-dashed border-violet-200 hover:bg-violet-50 inline-flex items-center justify-center gap-1">
            <ChevronUp className="h-3.5 w-3.5" /> {caches} message(s) plus ancien(s)
          </button>
        )}

        {visibles.map((item) =>
          item.kind === 'in' ? (
            <ReceivedItem
              key={item.m.id}
              m={item.m}
              expanded={expanded.has(item.m.id)}
              onToggle={() =>
                setExpanded((prev) => {
                  const next = new Set(prev)
                  next.has(item.m.id) ? next.delete(item.m.id) : next.add(item.m.id)
                  return next
                })
              }
            />
          ) : (
            <ReplyItem key={item.r.id} r={item.r} />
          )
        )}

        <div ref={composerRef} className="pt-2 pb-6">
          {composerOpen ? (
            <Composer
              key={thread.thread_id}
              mode="reply"
              detail={detail}
              templates={templates}
              settings={settings}
              aiAvailable={detail.aiAvailable}
              autoFocus
              onCancel={() => setComposerOpen(false)}
              onSent={({ status }) => onSent(status)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left text-sm text-slate-400 hover:border-violet-300 hover:text-slate-600 transition"
            >
              <Reply className="h-4 w-4 text-violet-500" />
              Répondre à {thread.from_name || thread.from_email}…
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">r</kbd>
            </button>
          )}
        </div>
      </div>

      {ruleOpen && (
        <RuleDialog
          email={thread.from_email}
          category={thread.category}
          onClose={() => setRuleOpen(false)}
          onDone={(msg) => {
            setRuleOpen(false)
            onRuleCreated(msg)
          }}
        />
      )}
    </div>
  )
}
