'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mail, MailOpen, Archive, Trash2, Search, RefreshCw,
  ChevronLeft, Clock, User, Paperclip, Pencil, Reply,
  Send, X, Loader2
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'

interface Email {
  id: string
  from_email: string
  from_name: string | null
  to_email: string
  subject: string
  html_content?: string
  text_content?: string
  resend_email_id?: string
  category: 'parrainage' | 'support' | 'general' | 'spam'
  is_read: boolean
  is_archived: boolean
  received_at: string
  attachments: any[]
  tags: string[]
}

interface EmailCounts {
  total: number
  unread: number
  parrainage: number
  support: number
  general: number
  spam: number
}

interface ComposeData {
  to: string
  subject: string
  body: string
}

const CATEGORY_STYLES: Record<string, { label: string; pill: string; sidebar: string }> = {
  parrainage: { label: 'Parrainage', pill: 'bg-amber-100 text-amber-800 border-amber-300', sidebar: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  support:    { label: 'Support',    pill: 'bg-blue-100 text-blue-800 border-blue-300',   sidebar: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  general:    { label: 'Général',    pill: 'bg-slate-100 text-slate-700 border-slate-300', sidebar: 'bg-slate-50 text-slate-700 hover:bg-slate-100' },
  spam:       { label: 'Spam',       pill: 'bg-red-100 text-red-700 border-red-300',       sidebar: 'bg-red-50 text-red-700 hover:bg-red-100' },
}

function relativeDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function fullDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<EmailCounts>({ total: 0, unread: 0, parrainage: 0, support: 0, general: 0, spam: 0 })

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Compose modal
  const [showCompose, setShowCompose] = useState(false)
  const [compose, setCompose] = useState<ComposeData>({ to: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => { loadEmails() }, [categoryFilter, isReadFilter])

  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(loadEmails, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [searchQuery])

  async function loadEmails() {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (categoryFilter) p.set('category', categoryFilter)
      if (isReadFilter !== null) p.set('is_read', String(isReadFilter))
      if (searchQuery) p.set('search', searchQuery)
      p.set('is_archived', 'false')
      const res = await fetch(`/api/emails/list?${p}`)
      const data = await res.json()
      if (res.ok) { setEmails(data.emails || []); setCounts(data.counts || counts) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function openEmail(email: Email) {
    const res = await fetch(`/api/emails/${email.id}`)
    const data = await res.json()
    if (res.ok) {
      setSelectedEmail(data.email)
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
      if (!email.is_read) setCounts(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
    }
  }

  async function patchEmail(emailId: string, patch: object) {
    await fetch(`/api/emails/${emailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
  }

  async function toggleRead(email: Email) {
    await patchEmail(email.id, { is_read: !email.is_read })
    const delta = email.is_read ? 1 : -1
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: !email.is_read } : e))
    if (selectedEmail?.id === email.id) setSelectedEmail({ ...selectedEmail, is_read: !email.is_read })
    setCounts(prev => ({ ...prev, unread: prev.unread + delta }))
  }

  async function changeCategory(email: Email, category: string) {
    await patchEmail(email.id, { category })
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, category: category as Email['category'] } : e))
    if (selectedEmail?.id === email.id) setSelectedEmail({ ...selectedEmail, category: category as Email['category'] })
  }

  async function archiveEmail(emailId: string) {
    await patchEmail(emailId, { is_archived: true })
    setEmails(prev => prev.filter(e => e.id !== emailId))
    if (selectedEmail?.id === emailId) setSelectedEmail(null)
  }

  async function deleteEmail(emailId: string) {
    if (!confirm('Supprimer cet email définitivement ?')) return
    await fetch(`/api/emails/${emailId}`, { method: 'DELETE' })
    setEmails(prev => prev.filter(e => e.id !== emailId))
    if (selectedEmail?.id === emailId) setSelectedEmail(null)
  }

  function openReply(email: Email) {
    setCompose({ to: email.from_email, subject: `Re: ${email.subject}`, body: '' })
    setShowCompose(true)
    setSendResult(null)
  }

  function openCompose() {
    setCompose({ to: '', subject: '', body: '' })
    setShowCompose(true)
    setSendResult(null)
  }

  async function handleSend() {
    if (!compose.to || !compose.subject || !compose.body) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: compose.to,
          subject: compose.subject,
          html: compose.body.replace(/\n/g, '<br>'),
          text: compose.body,
          audienceMode: 'manual'
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSendResult({ ok: true, msg: 'Email envoyé avec succès !' })
        setTimeout(() => setShowCompose(false), 1500)
      } else {
        setSendResult({ ok: false, msg: data.error || 'Erreur lors de l\'envoi' })
      }
    } catch { setSendResult({ ok: false, msg: 'Erreur réseau' }) }
    finally { setSending(false) }
  }

  const navItems = [
    { label: 'Tous', count: counts.total, active: !categoryFilter && isReadFilter === null, onClick: () => { setCategoryFilter(null); setIsReadFilter(null) }, style: 'bg-purple-100 text-purple-700' },
    { label: 'Non lus', count: counts.unread, active: isReadFilter === false && !categoryFilter, onClick: () => { setCategoryFilter(null); setIsReadFilter(false) }, style: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl p-6 md:p-8 shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                  <AdminBackButton />
                  <Mail className="h-4 w-4" /> Administration
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                  Boîte mail
                </h1>
                <p className="text-blue-300/70 text-sm mt-1.5">{counts.unread} message{counts.unread !== 1 ? 's' : ''} non lu{counts.unread !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadEmails} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-all">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button onClick={openCompose} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white text-sm font-semibold hover:bg-purple-600 shadow-sm transition-all">
                  <Pencil className="h-4 w-4" /> Composer
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-4 md:px-6 pt-6 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">

            {/* ── Sidebar ── */}
            <div className="w-48 flex-shrink-0 flex flex-col gap-2">
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-3 flex flex-col gap-1">

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white/70 border border-blue-200/60 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                </div>

                {navItems.map(item => (
                  <button key={item.label} onClick={item.onClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${item.active ? item.style : 'text-slate-600 hover:bg-white/60'}`}>
                    <span>{item.label}</span>
                    <span className="text-[11px] opacity-70">{item.count}</span>
                  </button>
                ))}

                <div className="border-t border-blue-100/60 my-1" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1">Catégories</p>

                {Object.entries(CATEGORY_STYLES).map(([key, cfg]) => (
                  <button key={key} onClick={() => { setCategoryFilter(key); setIsReadFilter(null) }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${categoryFilter === key ? cfg.sidebar : 'text-slate-600 hover:bg-white/60'}`}>
                    <span>{cfg.label}</span>
                    <span className="text-[11px] opacity-70">{counts[key as keyof EmailCounts]}</span>
                  </button>
                ))}

                <div className="border-t border-blue-100/60 my-1" />
                <button onClick={() => { setCategoryFilter(null); setIsReadFilter(null); /* fetch archived */ }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-white/60 transition-colors">
                  <span>Archivés</span>
                  <Archive className="h-3 w-3 opacity-50" />
                </button>
              </div>
            </div>

            {/* ── Email list ── */}
            <div className="w-72 flex-shrink-0 bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-blue-100/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{emails.length} message{emails.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-blue-50">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                  </div>
                ) : emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                    <Mail className="h-8 w-8 opacity-30" />
                    <span>Aucun email</span>
                  </div>
                ) : emails.map(email => (
                  <button key={email.id} onClick={() => openEmail(email)}
                    className={`w-full text-left px-4 py-3 hover:bg-purple-50/60 transition-colors relative ${selectedEmail?.id === email.id ? 'bg-purple-50/80 border-l-2 border-purple-500' : ''} ${!email.is_read ? 'bg-blue-50/40' : ''}`}>
                    {!email.is_read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-500" />}
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className={`text-xs truncate ${!email.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {email.from_name || email.from_email}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{relativeDate(email.received_at)}</span>
                    </div>
                    <p className={`text-xs truncate mb-1 ${!email.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {email.subject}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${CATEGORY_STYLES[email.category]?.pill || ''}`}>
                        {CATEGORY_STYLES[email.category]?.label || email.category}
                      </span>
                      {email.attachments?.length > 0 && <Paperclip className="h-3 w-3 text-slate-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Detail panel ── */}
            <div className="flex-1 bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl overflow-hidden flex flex-col">
              {selectedEmail ? (
                <>
                  {/* Detail header */}
                  <div className="px-6 py-4 border-b border-blue-100/60 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 truncate mb-1">{selectedEmail.subject}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-slate-700">{selectedEmail.from_name || selectedEmail.from_email}</span>
                          {selectedEmail.from_name && <span className="text-slate-400">&lt;{selectedEmail.from_email}&gt;</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {fullDate(selectedEmail.received_at)}
                        </span>
                        <select
                          value={selectedEmail.category}
                          onChange={e => changeCategory(selectedEmail, e.target.value)}
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer outline-none ${CATEGORY_STYLES[selectedEmail.category]?.pill}`}
                        >
                          {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openReply(selectedEmail)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/90 text-white text-xs font-semibold hover:bg-purple-600 transition-all">
                        <Reply className="h-3.5 w-3.5" /> Répondre
                      </button>
                      <button onClick={() => toggleRead(selectedEmail)} title={selectedEmail.is_read ? 'Marquer non lu' : 'Marquer lu'}
                        className="p-2 rounded-xl bg-white/70 border border-blue-200/60 text-slate-500 hover:bg-white/90 transition-all">
                        {selectedEmail.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                      </button>
                      <button onClick={() => archiveEmail(selectedEmail.id)} title="Archiver"
                        className="p-2 rounded-xl bg-white/70 border border-blue-200/60 text-slate-500 hover:bg-white/90 transition-all">
                        <Archive className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteEmail(selectedEmail.id)} title="Supprimer"
                        className="p-2 rounded-xl bg-red-50 border border-red-200/60 text-red-500 hover:bg-red-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {selectedEmail.html_content ? (
                      <div className="prose prose-sm max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }} />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                        {selectedEmail.text_content || 'Aucun contenu'}
                      </pre>
                    )}
                  </div>

                  {/* Attachments */}
                  {selectedEmail.attachments?.length > 0 && (
                    <div className="border-t border-blue-100/60 px-6 py-4">
                      <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> {selectedEmail.attachments.length} pièce{selectedEmail.attachments.length > 1 ? 's' : ''} jointe{selectedEmail.attachments.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att: any, i: number) => (
                          <button key={i} onClick={async () => {
                            const res = await fetch(`/api/emails/${selectedEmail.resend_email_id}/attachments/${att.id}`)
                            if (res.ok) { const d = await res.json(); window.open(d.attachment.downloadUrl, '_blank') }
                          }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-blue-200/60 text-xs text-slate-700 hover:bg-white/90 transition-all">
                            <Paperclip className="h-3 w-3 text-slate-400" />
                            {att.filename} <span className="text-slate-400">({Math.round(att.size / 1024)} KB)</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <MailOpen className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Sélectionnez un email pour le lire</p>
                  <button onClick={openCompose}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/90 text-white text-sm font-semibold hover:bg-purple-600 transition-all">
                    <Pencil className="h-4 w-4" /> Nouveau message
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Compose modal ── */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              {/* Modal header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30">
                    <Pencil className="h-4 w-4 text-purple-300" />
                  </div>
                  <h3 className="text-white font-semibold">{compose.subject.startsWith('Re:') ? 'Répondre' : 'Nouveau message'}</h3>
                </div>
                <button onClick={() => setShowCompose(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">À</label>
                  <input type="email" value={compose.to} onChange={e => setCompose(p => ({ ...p, to: e.target.value }))}
                    placeholder="destinataire@email.com"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Objet</label>
                  <input type="text" value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Objet de l'email"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Message</label>
                  <textarea value={compose.body} onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                    rows={8} placeholder="Écrivez votre message…"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-none" />
                </div>

                {sendResult && (
                  <p className={`text-sm px-3 py-2 rounded-xl ${sendResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {sendResult.msg}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 flex items-center justify-between">
                <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition">
                  Annuler
                </button>
                <button onClick={handleSend} disabled={sending || !compose.to || !compose.subject || !compose.body}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthLayout>
  )
}
