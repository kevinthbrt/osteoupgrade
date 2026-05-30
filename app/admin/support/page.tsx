'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import { Clock, Wrench, CheckCircle, Paperclip, Loader2, RefreshCw, Filter, Trash2, Send, MessageSquareReply, X } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved'
  source: 'osteoflow' | 'osteoupgrade'
  user_email: string
  license_email?: string | null
  attachment_name?: string | null
  attachment_url?: string | null
  admin_reply?: string | null
  admin_replied_at?: string | null
  created_at: string
  updated_at: string
}

const STATUS_CONFIG = {
  pending: { label: 'Reçu', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Wrench, dot: 'bg-amber-500' },
  resolved: { label: 'Corrigé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' },
}

const SOURCE_COLORS: Record<string, string> = {
  osteoflow: 'bg-violet-100 text-violet-700 border-violet-200',
  osteoupgrade: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => { checkAdmin() }, [])
  useEffect(() => { fetchTickets() }, [statusFilter])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') router.push('/dashboard')
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/api/admin/support' : `/api/admin/support?status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) setTickets((await res.json()).tickets || [])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = (await res.json()).ticket
        setTickets(prev => prev.map(t => t.id === id ? updated : t))
        if (selected?.id === id) setSelected(updated)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/support/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_reply: replyText.trim() }),
      })
      if (res.ok) {
        const updated = (await res.json()).ticket
        setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
        setSelected(updated)
        setReplyText('')
      }
    } finally {
      setSendingReply(false)
    }
  }

  const deleteTicket = async (id: string) => {
    if (!confirm('Supprimer ce ticket définitivement ?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/support/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== id))
        if (selected?.id === id) setSelected(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Sync reply text when selected ticket changes
  useEffect(() => {
    setReplyText(selected?.admin_reply || '')
  }, [selected?.id])

  const counts = {
    all: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto">
        <AdminBackButton light />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets Support</h1>
            <p className="text-sm text-gray-500 mt-0.5">{tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total</p>
          </div>
          <button onClick={fetchTickets} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'in_progress', 'resolved'] as const).map(s => {
            const label = s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label ?? s
            const count = counts[s]
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setSelected(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className={`grid gap-4 ${selected ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
          {/* Ticket list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Aucun ticket</div>
            ) : (
              tickets.map(ticket => {
                const cfg = STATUS_CONFIG[ticket.status]
                const Icon = cfg.icon
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelected(selected?.id === ticket.id ? null : ticket)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      selected?.id === ticket.id
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_COLORS[ticket.source] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {ticket.source === 'osteoflow' ? 'MyOsteoFlow' : 'OsteoUpgrade'}
                          </span>
                          {ticket.admin_reply && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              <MessageSquareReply className="w-3 h-3" />Répondu
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ticket.user_email} · {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ticket.attachment_name && <Paperclip className="w-4 h-4 text-gray-400" />}
                        <button
                          onClick={e => { e.stopPropagation(); deleteTicket(ticket.id) }}
                          disabled={deletingId === ticket.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deletingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 self-start sticky top-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900 leading-tight">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium border ${STATUS_CONFIG[selected.status].color}`}>
                  {(() => { const I = STATUS_CONFIG[selected.status].icon; return <I className="w-3 h-3" /> })()}
                  {STATUS_CONFIG[selected.status].label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium border ${SOURCE_COLORS[selected.source] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {selected.source === 'osteoflow' ? 'MyOsteoFlow' : 'OsteoUpgrade'}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-0.5">
                <p><strong>De :</strong> {selected.user_email}</p>
                {selected.license_email && selected.license_email !== selected.user_email && (
                  <p><strong>Licence :</strong> {selected.license_email}</p>
                )}
                <p><strong>Le :</strong> {new Date(selected.created_at).toLocaleString('fr-FR')}</p>
              </div>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {selected.attachment_name && (
                <a href={selected.attachment_url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-indigo-600 hover:underline">
                  <Paperclip className="w-3.5 h-3.5" />{selected.attachment_name}
                </a>
              )}

              {/* Reply section */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareReply className="w-3.5 h-3.5" />
                  Réponse à l&apos;utilisateur
                </p>
                {selected.admin_replied_at && (
                  <p className="text-xs text-purple-600">Répondu le {new Date(selected.admin_replied_at).toLocaleString('fr-FR')}</p>
                )}
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Écrivez votre réponse… Un email sera envoyé à l'utilisateur."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {selected.admin_reply ? 'Mettre à jour la réponse' : 'Envoyer la réponse'}
                </button>
              </div>

              {/* Status actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Changer le statut</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['pending', 'in_progress', 'resolved'] as const).map(s => {
                    const cfg = STATUS_CONFIG[s]
                    const Icon = cfg.icon
                    const isActive = selected.status === s
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={isActive || updatingId === selected.id}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                          isActive ? `${cfg.color} cursor-default` : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {updatingId === selected.id && !isActive
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Icon className="w-4 h-4" />
                        }
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteTicket(selected.id)}
                disabled={deletingId === selected.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {deletingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer ce ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
