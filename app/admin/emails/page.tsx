'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive, CheckCircle2, Clock, Inbox, Loader2, Mail, MailOpen, Paperclip, Pencil, RefreshCw,
  Reply, Search, Settings2, ShieldAlert, Sparkles, X, Crown, Layers, CircleDot,
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import FicheClient from '@/app/admin/clients/FicheClient'
import { CATEGORY_LABELS, INBOX_CATEGORIES, STATUS_LABELS } from '@/lib/inbox-render'
import { planLabel, planOf } from '@/lib/entitlements'
import Composer from './Composer'
import SettingsDrawer from './SettingsDrawer'
import ThreadView from './ThreadView'
import {
  CATEGORY_STYLE, STATUS_STYLE, api, avatarColor, initials, relativeDate, sinceLabel,
  type InboxCategory, type InboxCounts, type InboxSettings, type InboxStatus, type InboxTemplate, type InboxView,
  type ThreadDetail, type ThreadRow,
} from './inbox-types'

const VIEWS: { key: InboxView; label: string; icon: any }[] = [
  { key: 'todo', label: 'À traiter', icon: CircleDot },
  { key: 'waiting', label: 'En attente du client', icon: Clock },
  { key: 'done', label: 'Traités', icon: CheckCircle2 },
  { key: 'unread', label: 'Non lus', icon: Mail },
  { key: 'all', label: 'Tout', icon: Layers },
  { key: 'archived', label: 'Archivés', icon: Archive },
]

const DEFAULT_SETTINGS: InboxSettings = {
  from_name: 'OsteoUpgrade',
  signature: 'Belle journée,\nL’équipe OsteoUpgrade × MyOsteoflow',
  default_layout: 'simple',
  quote_original: true,
  ai_enabled: true,
  notify_categories: ['support', 'facturation', 'parrainage'],
}

type Patch = { status?: InboxStatus; category?: InboxCategory; is_read?: boolean; is_archived?: boolean }

export default function AdminInboxPage() {
  const [view, setView] = useState<InboxView>('todo')
  const [category, setCategory] = useState<InboxCategory | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [counts, setCounts] = useState<InboxCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ThreadDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [composerOpen, setComposerOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templates, setTemplates] = useState<InboxTemplate[]>([])
  const [settings, setSettings] = useState<InboxSettings>(DEFAULT_SETTINGS)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [ficheId, setFicheId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const notify = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const loadThreads = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ view })
      if (category) p.set('category', category)
      if (debouncedQuery) p.set('q', debouncedQuery)
      const data = await api<{ threads: ThreadRow[]; counts: InboxCounts }>(`/api/admin/inbox?${p}`)
      setThreads(data.threads)
      setCounts(data.counts)
    } catch (e: any) {
      notify(e.message)
    } finally {
      setLoading(false)
    }
  }, [view, category, debouncedQuery, notify])

  useEffect(() => {
    loadThreads()
    setChecked(new Set())
  }, [loadThreads])

  useEffect(() => {
    Promise.all([
      api<{ templates: InboxTemplate[] }>('/api/admin/inbox/templates'),
      api<{ settings: InboxSettings; aiAvailable: boolean }>('/api/admin/inbox/settings'),
    ])
      .then(([t, s]) => {
        setTemplates(t.templates)
        setSettings(s.settings)
        setAiAvailable(s.aiAvailable)
      })
      .catch(() => {})
  }, [])

  // Rafraîchissement discret toutes les 60 s, onglet visible seulement.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && !composerOpen && !newOpen) loadThreads()
    }, 60000)
    return () => clearInterval(id)
  }, [loadThreads, composerOpen, newOpen])

  const openThread = useCallback(async (threadId: string, opts?: { reply?: boolean }) => {
    setSelectedId(threadId)
    setComposerOpen(Boolean(opts?.reply))
    setDetailLoading(true)
    try {
      const d = await api<ThreadDetail>(`/api/admin/inbox/${threadId}`)
      setDetail(d)
      setThreads((prev) => prev.map((t) => (t.thread_id === threadId ? { ...t, is_read: true } : t)))
      setCounts((prev) => {
        const row = threads.find((t) => t.thread_id === threadId)
        return prev && row && !row.is_read ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev
      })
    } catch (e: any) {
      notify(e.message)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [threads, notify])

  async function patchThreads(threadIds: string[], patch: Patch, opts?: { silent?: boolean }) {
    if (!threadIds.length) return
    try {
      await api('/api/admin/inbox', { method: 'PATCH', json: { threadIds, patch } })
    } catch (e: any) {
      return notify(e.message)
    }
    const sortDeLaVue = (t: ThreadRow) => {
      const merged = { ...t, ...patch }
      if (view === 'archived') return !merged.is_archived
      if (merged.is_archived) return true
      if (view === 'todo' || view === 'waiting' || view === 'done') return merged.status !== view
      if (view === 'unread') return merged.is_read
      if (category && merged.category !== category) return true
      return false
    }
    setThreads((prev) =>
      prev
        .map((t) => (threadIds.includes(t.thread_id) ? { ...t, ...patch } : t))
        .filter((t) => !(threadIds.includes(t.thread_id) && sortDeLaVue(t)))
    )
    if (detail && threadIds.includes(detail.thread.thread_id)) {
      setDetail({ ...detail, thread: { ...detail.thread, ...patch } as any })
    }
    if (!opts?.silent) {
      const libelle = patch.status
        ? `Marqué « ${STATUS_LABELS[patch.status]} »`
        : patch.category
          ? `Classé en ${CATEGORY_LABELS[patch.category]}`
          : patch.is_archived !== undefined
            ? patch.is_archived ? 'Archivé' : 'Désarchivé'
            : patch.is_read === false ? 'Marqué non lu' : 'Mis à jour'
      notify(threadIds.length > 1 ? `${libelle} (${threadIds.length})` : libelle)
    }
    setChecked(new Set())
    // Les compteurs se recalculent côté serveur.
    loadCountsSoon()
  }

  const countsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function loadCountsSoon() {
    if (countsTimer.current) clearTimeout(countsTimer.current)
    countsTimer.current = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ view, limit: '1' })
        const data = await api<{ counts: InboxCounts }>(`/api/admin/inbox?${p}`)
        setCounts(data.counts)
      } catch {}
    }, 400)
  }

  /** Après une action sur la conversation ouverte, passe à la suivante. */
  function advanceFrom(threadId: string) {
    const idx = threads.findIndex((t) => t.thread_id === threadId)
    const next = threads[idx + 1] || threads[idx - 1]
    if (next && next.thread_id !== threadId) openThread(next.thread_id)
    else {
      setSelectedId(null)
      setDetail(null)
    }
  }

  async function patchCurrent(patch: Patch) {
    if (!detail) return
    const id = detail.thread.thread_id
    const quitteLaVue =
      patch.is_archived !== undefined ||
      (patch.status && (view === 'todo' || view === 'waiting' || view === 'done') && patch.status !== view)
    await patchThreads([id], patch)
    if (patch.is_read === false) {
      setSelectedId(null)
      setDetail(null)
    } else if (quitteLaVue) advanceFrom(id)
  }

  async function deleteCurrent() {
    if (!detail) return
    if (!confirm('Supprimer définitivement toute la conversation ?')) return
    const id = detail.thread.thread_id
    try {
      await api(`/api/admin/inbox/${id}`, { method: 'DELETE' })
      advanceFrom(id)
      setThreads((prev) => prev.filter((t) => t.thread_id !== id))
      notify('Conversation supprimée')
      loadCountsSoon()
    } catch (e: any) {
      notify(e.message)
    }
  }

  // ── Raccourcis clavier ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (settingsOpen || newOpen || ficheId) return
      const idx = threads.findIndex((t) => t.thread_id === selectedId)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        const next = threads[Math.min(idx + 1, threads.length - 1)]
        if (next) { e.preventDefault(); openThread(next.thread_id) }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        const prev = threads[Math.max(idx - 1, 0)]
        if (prev) { e.preventDefault(); openThread(prev.thread_id) }
      } else if (e.key === 'r' && detail) {
        e.preventDefault()
        setComposerOpen(true)
      } else if (e.key === 'e' && detail) {
        e.preventDefault()
        patchCurrent({ status: 'done' })
      } else if (e.key === 'a' && detail) {
        e.preventDefault()
        patchCurrent({ is_archived: true })
      } else if (e.key === 'u' && detail) {
        e.preventDefault()
        patchCurrent({ is_read: false })
      } else if (e.key === 'c') {
        e.preventDefault()
        setNewOpen(true)
      } else if (e.key === '/') {
        e.preventDefault()
        document.getElementById('inbox-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!selectedId) return
    listRef.current?.querySelector(`[data-thread="${selectedId}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  const allChecked = threads.length > 0 && threads.every((t) => checked.has(t.thread_id))
  const checkedIds = Array.from(checked)

  return (
    <AuthLayout>
      <div className="-m-6 md:-m-8 min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-sky-50/60 flex flex-col">
        {/* ── En-tête ── */}
        <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 px-4 md:px-8 py-5">
          <div className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-10 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-violet-300 text-xs font-medium tracking-wide flex items-center gap-2">
                <AdminBackButton /> Administration
              </p>
              <h1 className="mt-0.5 text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Inbox className="h-7 w-7 text-violet-300" /> Boîte mail
              </h1>
              {counts && (
                <p className="text-sm text-slate-300 mt-1">
                  <span className="font-semibold text-white">{counts.todo}</span> à traiter
                  <span className="mx-2 text-slate-500">·</span>
                  {counts.waiting} en attente du client
                  <span className="mx-2 text-slate-500">·</span>
                  {counts.unread} non lu{counts.unread > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadThreads} title="Actualiser" className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm hover:bg-white/15">
                <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Modèles et réglages</span>
              </button>
              <button type="button" onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 shadow-lg shadow-violet-900/40">
                <Pencil className="h-4 w-4" /> Nouveau message
              </button>
            </div>
          </div>
        </header>

        {/* ── Corps ── */}
        <div className="flex-1 flex min-h-0 h-[calc(100vh-128px)]">
          {/* Barre latérale */}
          <aside className="hidden md:flex w-60 shrink-0 flex-col gap-4 p-3 border-r border-slate-200/70 bg-white/60 backdrop-blur overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="inbox-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher  /"
                className="w-full pl-8 pr-7 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <nav className="flex flex-col gap-0.5">
              {VIEWS.map((v) => {
                const n = counts ? (counts as any)[v.key] : null
                const actif = view === v.key && !category
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => { setView(v.key); setCategory(null) }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${actif ? 'bg-violet-600 text-white shadow-sm' : view === v.key ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-white'}`}
                  >
                    <v.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{v.label}</span>
                    {n != null && n > 0 && (
                      <span className={`text-[11px] font-semibold ${actif ? 'text-violet-100' : v.key === 'todo' ? 'text-violet-700' : 'text-slate-400'}`}>{n}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Catégories</p>
              <div className="flex flex-col gap-0.5">
                {INBOX_CATEGORIES.map((c) => {
                  const n = counts?.categories[c]
                  const actif = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(actif ? null : c)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm transition ${actif ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900 font-medium' : 'text-slate-600 hover:bg-white'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_STYLE[c].dot}`} />
                      <span className="flex-1 text-left">{CATEGORY_LABELS[c]}</span>
                      {n && n.todo > 0 && c !== 'spam' && c !== 'notification' ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{n.todo}</span>
                      ) : n ? (
                        <span className="text-[11px] text-slate-400">{n.total}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-auto px-3 py-3 rounded-xl bg-white/70 border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-700 mb-1">Raccourcis</p>
              <p><kbd>j</kbd>/<kbd>k</kbd> naviguer · <kbd>r</kbd> répondre</p>
              <p><kbd>e</kbd> traité · <kbd>a</kbd> archiver · <kbd>u</kbd> non lu</p>
              <p><kbd>c</kbd> nouveau · <kbd>/</kbd> rechercher</p>
            </div>
          </aside>

          {/* Liste */}
          <section className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[400px] xl:w-[440px] shrink-0 flex-col border-r border-slate-200/70 bg-white/70 min-h-0`}>
            {/* Filtres mobiles */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto px-3 pt-3">
              {VIEWS.slice(0, 5).map((v) => (
                <button key={v.key} type="button" onClick={() => { setView(v.key); setCategory(null) }} className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${view === v.key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {v.label}{counts && (counts as any)[v.key] ? ` ${(counts as any)[v.key]}` : ''}
                </button>
              ))}
            </div>
            <div className="md:hidden px-3 pt-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => setChecked(allChecked ? new Set() : new Set(threads.map((t) => t.thread_id)))}
                className="accent-violet-600"
                title="Tout sélectionner"
              />
              {checked.size > 0 ? (
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="font-medium text-slate-700 mr-1">{checked.size} sélection{checked.size > 1 ? 's' : ''}</span>
                  <button type="button" onClick={() => patchThreads(checkedIds, { status: 'done' })} className="px-2 py-1 rounded-lg hover:bg-emerald-50 text-emerald-700">Traité</button>
                  <button type="button" onClick={() => patchThreads(checkedIds, { status: 'todo' })} className="px-2 py-1 rounded-lg hover:bg-violet-50 text-violet-700">À traiter</button>
                  <button type="button" onClick={() => patchThreads(checkedIds, { is_read: true })} className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600">Lu</button>
                  <button type="button" onClick={() => patchThreads(checkedIds, { is_archived: view !== 'archived' })} className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600">{view === 'archived' ? 'Désarchiver' : 'Archiver'}</button>
                  <select
                    value=""
                    onChange={(e) => e.target.value && patchThreads(checkedIds, { category: e.target.value as InboxCategory })}
                    className="px-1.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    <option value="">Classer…</option>
                    {INBOX_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{category ? CATEGORY_LABELS[category] : VIEWS.find((v) => v.key === view)?.label}</span>
                  {category && view !== 'all' ? ` · ${VIEWS.find((v) => v.key === view)?.label.toLowerCase()}` : ''}
                  {` · ${threads.length} conversation${threads.length > 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto">
              {loading && threads.length === 0 ? (
                <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">{view === 'todo' && !debouncedQuery ? 'Tout est traité' : 'Aucune conversation'}</p>
                  <p className="text-xs text-slate-400 mt-1">{view === 'todo' && !debouncedQuery ? 'Rien n’attend de réponse pour l’instant.' : 'Essayez une autre vue ou une autre recherche.'}</p>
                </div>
              ) : (
                threads.map((t) => {
                  const actif = t.thread_id === selectedId
                  const coche = checked.has(t.thread_id)
                  return (
                    <div
                      key={t.thread_id}
                      data-thread={t.thread_id}
                      onClick={() => openThread(t.thread_id)}
                      className={`group relative flex gap-3 px-3 py-3 cursor-pointer border-b border-slate-100 transition ${actif ? 'bg-violet-50' : coche ? 'bg-violet-50/50' : 'hover:bg-slate-50'}`}
                    >
                      {actif && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-600" />}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${coche ? 'opacity-0' : 'group-hover:opacity-0'} ${avatarColor(t.from_email)}`}>
                          {initials(t.from_name, t.from_email)}
                        </div>
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => setChecked((prev) => { const n = new Set(prev); n.has(t.thread_id) ? n.delete(t.thread_id) : n.add(t.thread_id); return n })}
                          className={`absolute inset-0 m-auto w-4 h-4 accent-violet-600 transition ${coche ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!t.is_read && <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />}
                          <span className={`text-sm truncate ${t.is_read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{t.from_name || t.from_email}</span>
                          {t.profile && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700" title="A un compte OsteoUpgrade">
                              {t.profile.is_founding_member && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                              {planLabel(planOf(t.profile as any))}
                            </span>
                          )}
                          {t.message_count > 1 && <span className="shrink-0 text-[10px] text-slate-400">{t.message_count}</span>}
                          <span className={`ml-auto shrink-0 text-[11px] ${t.is_read ? 'text-slate-400' : 'text-violet-700 font-semibold'}`}>{relativeDate(t.received_at)}</span>
                        </div>
                        <p className={`text-[13px] truncate mt-0.5 ${t.is_read ? 'text-slate-600' : 'font-medium text-slate-800'}`}>{t.subject || '(sans objet)'}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          {t.ai_summary ? <><Sparkles className="h-3 w-3 text-violet-400 shrink-0" /><span className="truncate">{t.ai_summary}</span></> : t.snippet}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 ring-inset ${CATEGORY_STYLE[t.category].pill}`}>
                            {t.category === 'spam' && <ShieldAlert className="h-2.5 w-2.5" />}
                            {CATEGORY_LABELS[t.category]}
                          </span>
                          {(view === 'all' || view === 'unread' || view === 'archived' || category) && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_STYLE[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                          )}
                          {t.last_reply_at ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
                              <Reply className="h-2.5 w-2.5" /> Répondu {sinceLabel(t.last_reply_at)}
                            </span>
                          ) : t.status === 'todo' && t.category !== 'spam' ? (
                            <span className="text-[10px] text-slate-400">Sans réponse</span>
                          ) : null}
                          {t.attachments?.length > 0 && <Paperclip className="h-3 w-3 text-slate-400" />}
                        </div>
                      </div>
                      {/* Actions rapides au survol */}
                      <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-0.5 bg-white/95 rounded-lg shadow-sm border border-slate-200 p-0.5" onClick={(e) => e.stopPropagation()}>
                        {t.status !== 'done' && (
                          <button type="button" title="Traité" onClick={() => patchThreads([t.thread_id], { status: 'done' })} className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                        )}
                        <button type="button" title={t.is_read ? 'Marquer non lu' : 'Marquer lu'} onClick={() => patchThreads([t.thread_id], { is_read: !t.is_read }, { silent: true })} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
                          {t.is_read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                        </button>
                        <button type="button" title="Archiver" onClick={() => patchThreads([t.thread_id], { is_archived: !t.is_archived })} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"><Archive className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Conversation */}
          <main className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 flex-col min-h-0`}>
            <ThreadView
              detail={detail}
              loading={detailLoading}
              templates={templates}
              settings={settings}
              composerOpen={composerOpen}
              setComposerOpen={setComposerOpen}
              onBack={() => { setSelectedId(null); setDetail(null) }}
              onPatch={patchCurrent}
              onDelete={deleteCurrent}
              onOpenProfile={(id) => setFicheId(id)}
              onRuleCreated={(msg) => { notify(msg); loadThreads() }}
              onSent={async (status) => {
                notify(status === 'done' ? 'Réponse envoyée, conversation close' : 'Réponse envoyée')
                setComposerOpen(false)
                const id = detail?.thread.thread_id
                if (!id) return
                if (view === 'todo') {
                  setThreads((prev) => prev.filter((t) => t.thread_id !== id))
                  advanceFrom(id)
                } else {
                  await openThread(id)
                  loadThreads()
                }
                loadCountsSoon()
              }}
            />
          </main>
        </div>
      </div>

      {/* Nouveau message */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNewOpen(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 rounded-t-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Nouveau message
            </div>
            <Composer
              mode="new"
              templates={templates}
              settings={settings}
              aiAvailable={false}
              autoFocus
              onCancel={() => setNewOpen(false)}
              onSent={() => { setNewOpen(false); notify('Message envoyé') }}
            />
          </div>
        </div>
      )}

      <SettingsDrawer
        open={settingsOpen}
        templates={templates}
        settings={settings}
        aiAvailable={aiAvailable}
        onClose={() => setSettingsOpen(false)}
        onTemplatesChange={setTemplates}
        onSettingsChange={setSettings}
        onReclassified={(msg) => { notify(msg); loadThreads() }}
      />

      {ficheId && <FicheClient clientId={ficheId} onClose={() => setFicheId(null)} onChange={() => {}} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </AuthLayout>
  )
}
