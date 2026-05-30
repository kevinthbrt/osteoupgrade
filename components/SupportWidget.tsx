'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, ArrowLeft, Paperclip, Loader2, CheckCircle, Clock, Wrench, ChevronRight, MessageSquareReply } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved'
  source: string
  created_at: string
  attachment_name?: string | null
  attachment_url?: string | null
  admin_reply?: string | null
  admin_replied_at?: string | null
}

const STATUS_CONFIG = {
  pending: { label: 'Reçu', color: 'bg-blue-100 text-blue-700', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  resolved: { label: 'Corrigé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
}

const BTN = 56

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'form' | 'success'>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const posRef = useRef<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('support-widget-pos')
      if (saved) {
        const p = JSON.parse(saved)
        setPos(p)
        posRef.current = p
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (open) fetchTickets()
  }, [open])

  const fetchTickets = async () => {
    setLoadingTickets(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) setTickets((await res.json()).tickets || [])
    } finally {
      setLoadingTickets(false)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, moved: false }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragRef.current
    if (!ds) return
    const dx = e.clientX - ds.startX
    const dy = e.clientY - ds.startY
    if (!ds.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      ds.moved = true
      setDragging(true)
    }
    if (ds.moved) {
      const x = Math.max(0, Math.min(window.innerWidth - BTN, ds.origX + dx))
      const y = Math.max(0, Math.min(window.innerHeight - BTN, ds.origY + dy))
      const p = { x, y }
      posRef.current = p
      setPos(p)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const ds = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!ds?.moved) {
      setOpen(o => !o)
    } else if (posRef.current) {
      try { localStorage.setItem('support-widget-pos', JSON.stringify(posRef.current)) } catch {}
    }
  }

  const btnStyle = (): React.CSSProperties =>
    posRef.current
      ? { position: 'fixed', left: posRef.current.x, top: posRef.current.y, bottom: 'auto', right: 'auto' }
      : { position: 'fixed', right: 24, bottom: 24 }

  const panelStyle = (): React.CSSProperties => {
    const PANEL_W = 360
    const GAP = 8
    const p = posRef.current ?? { x: window.innerWidth - BTN - 24, y: window.innerHeight - BTN - 24 }
    const left = Math.max(GAP, Math.min(window.innerWidth - PANEL_W - GAP, p.x + BTN - PANEL_W))
    const inBottomHalf = p.y > window.innerHeight / 2
    const vertical: React.CSSProperties = inBottomHalf
      ? { bottom: window.innerHeight - p.y + GAP, top: 'auto' }
      : { top: p.y + BTN + GAP, bottom: 'auto' }
    return { position: 'fixed', left, ...vertical, width: PANEL_W, maxHeight: 540, zIndex: 50 }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) { setError('Titre et message requis'); return }
    setError('')
    setSubmitting(true)
    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      let attachmentSize: number | null = null

      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const uploadRes = await fetch('/api/support/upload', { method: 'POST', body: fd })
        if (uploadRes.ok) {
          const d = await uploadRes.json()
          attachmentUrl = d.url; attachmentName = d.name; attachmentSize = d.size
        }
      }

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })

      if (!res.ok) { setError((await res.json()).error || 'Erreur'); return }
      setTitle(''); setMessage(''); setFile(null)
      setView('success')
      fetchTickets()
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => { setView('list'); setError(''); setTitle(''); setMessage(''); setFile(null) }

  return (
    <>
      {/* FAB */}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={btnStyle()}
        className={`z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-200 select-none ${dragging ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-grab'}`}
        title="Support"
      >
        {open && !dragging
          ? <X className="w-6 h-6 text-white pointer-events-none" />
          : <MessageCircleQuestion className="w-6 h-6 text-white pointer-events-none" />
        }
      </button>

      {/* Panel */}
      {open && !dragging && (
        <div style={panelStyle()} className="z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2 shrink-0">
            {(view === 'form' || view === 'success') && (
              <button onClick={reset} className="text-white/70 hover:text-white mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <MessageCircleQuestion className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">Support</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {view === 'list' && (
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setView('form')}
                  className="w-full flex items-center justify-between rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors"
                >
                  <span>Nouveau ticket</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {loadingTickets ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">Aucun ticket pour l&apos;instant</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mes demandes</p>
                    {tickets.map(t => {
                      const cfg = STATUS_CONFIG[t.status]
                      const Icon = cfg.icon
                      return (
                        <div key={t.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800 leading-tight">{t.title}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                          {t.admin_reply && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                              <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mb-1">
                                <MessageSquareReply className="w-3 h-3" /> Réponse de l&apos;équipe
                              </p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{t.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'form' && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Résumé de votre demande"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre problème ou remarque..." rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" />
                </div>
                <div>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                      <Paperclip className="w-3.5 h-3.5" />Ajouter une pièce jointe (optionnel)
                    </button>
                  )}
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Envoi...' : 'Envoyer ma demande'}
                </button>
              </div>
            )}

            {view === 'success' && (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-800">Demande envoyée !</p>
                <p className="text-sm text-gray-500">Nous avons bien reçu votre ticket. Vous pouvez suivre son avancement ici.</p>
                <button onClick={reset} className="text-sm text-indigo-600 hover:underline mt-1">Voir mes demandes</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
