'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, ArrowLeft, Paperclip, Loader2, CheckCircle, Clock, Wrench, ChevronRight } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved'
  source: string
  created_at: string
  attachment_name?: string | null
  attachment_url?: string | null
}

const STATUS_CONFIG = {
  pending: { label: 'Reçu', color: 'bg-blue-100 text-blue-700', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  resolved: { label: 'Corrigé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
}

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

  useEffect(() => {
    if (open) fetchTickets()
  }, [open])

  const fetchTickets = async () => {
    setLoadingTickets(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } finally {
      setLoadingTickets(false)
    }
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
          const uploadData = await uploadRes.json()
          attachmentUrl = uploadData.url
          attachmentName = uploadData.name
          attachmentSize = uploadData.size
        }
      }

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de l\'envoi')
        return
      }

      setTitle('')
      setMessage('')
      setFile(null)
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
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 group"
        title="Support"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircleQuestion className="w-6 h-6 text-white" />
        }
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
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
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">Aucun ticket pour l&apos;instant</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mes demandes</p>
                    {tickets.map(t => {
                      const cfg = STATUS_CONFIG[t.status]
                      const Icon = cfg.icon
                      return (
                        <div key={t.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800 leading-tight">{t.title}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
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
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Résumé de votre demande"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Décrivez votre problème ou remarque..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Ajouter une pièce jointe (optionnel)
                    </button>
                  )}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
