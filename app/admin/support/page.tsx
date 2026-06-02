'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import {
  Clock, Wrench, CheckCircle, Paperclip, Loader2,
  RefreshCw, Trash2, Send, User, Shield, MessageSquare
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'admin'
  content: string
  created_at: string
}

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
  last_admin_message_at?: string | null
  created_at: string
  updated_at: string
  messages?: Message[]
}

const STATUS_CONFIG = {
  pending: { label: 'Reçu', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: Wrench },
  resolved: { label: 'Corrigé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle },
}

const SOURCE_COLORS: Record<string, string> = {
  osteoflow: 'bg-violet-100 text-violet-700',
  osteoupgrade: 'bg-indigo-100 text-indigo-700',
}

const FILTERS = ['all', 'pending', 'in_progress', 'resolved'] as const

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<typeof FILTERS[number]>('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { checkAdmin() }, [])
  useEffect(() => { fetchTickets() }, [statusFilter])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages?.length])

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
      if (res.ok) {
        const list: Ticket[] = (await res.json()).tickets || []
        setTickets(list)
        if (selected) {
          const updated = list.find(t => t.id === selected.id)
          if (updated) setSelected(prev => prev ? { ...updated, messages: updated.messages || prev.messages || [] } : null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const selectTicket = (ticket: Ticket) => {
    setSelected(ticket)
    setReplyText('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
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
        const { ticket: updated } = await res.json()
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t))
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: updated.status } : prev)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const sendReply = async () => {
    if (!selected || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    const content = replyText.trim()
    setReplyText('')
    try {
      const res = await fetch(`/api/admin/support/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      if (res.ok) {
        const { message: newMsg } = await res.json()
        if (newMsg) {
          setSelected(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMsg], last_admin_message_at: newMsg.created_at } : prev)
          setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, last_admin_message_at: newMsg.created_at } : t))
        }
      }
    } finally {
      setSendingReply(false)
      textareaRef.current?.focus()
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

  const filtered = tickets.filter(t => statusFilter === 'all' || t.status === statusFilter)

  return (
    <AuthLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <AdminBackButton light />
          <h1 className="font-semibold text-gray-900 text-base">Support</h1>
          <div className="flex gap-1 ml-4">
            {FILTERS.map(f => {
              const label = f === 'all' ? 'Tous' : STATUS_CONFIG[f].label
              const count = f === 'all' ? tickets.length : tickets.filter(t => t.status === f).length
              return (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {label} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              )
            })}
          </div>
          <button onClick={fetchTickets} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Ticket list */}
          <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">Aucun ticket</div>
              ) : (
                filtered.map(ticket => {
                  const cfg = STATUS_CONFIG[ticket.status]
                  const lastMsg = ticket.messages?.at(-1)
                  const isActive = selected?.id === ticket.id
                  return (
                    <button key={ticket.id} onClick={() => selectTicket(ticket)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                        isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
                      }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium leading-tight truncate ${
                          isActive ? 'text-indigo-900' : 'text-gray-900'
                        }`}>{ticket.title}</p>
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                      </div>
                      <p className="text-xs text-gray-400 truncate">{ticket.user_email}</p>
                      {lastMsg && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 italic">
                          {lastMsg.sender === 'admin' ? 'Vous : ' : ''}{lastMsg.content}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          SOURCE_COLORS[ticket.source] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {ticket.source === 'osteoflow' ? 'MyOsteoFlow' : 'OsteoUpgrade'}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Conversation */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50">
              {/* Conversation header */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 bg-white shrink-0">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selected.title}</p>
                  <p className="text-xs text-gray-400">
                    {selected.user_email}
                    {selected.license_email && selected.license_email !== selected.user_email && (
                      <span className="ml-2 text-gray-300">· licence : {selected.license_email}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status buttons */}
                  {(['pending', 'in_progress', 'resolved'] as const).map(s => {
                    const cfg = STATUS_CONFIG[s]
                    const Icon = cfg.icon
                    const isActive = selected.status === s
                    return (
                      <button key={s} onClick={() => updateStatus(selected.id, s)}
                        disabled={isActive || updatingId === selected.id}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                          isActive ? `${cfg.color} cursor-default` : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}>
                        {updatingId === selected.id && !isActive
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Icon className="w-3 h-3" />}
                        {cfg.label}
                      </button>
                    )
                  })}
                  {selected.attachment_name && (
                    <a href={selected.attachment_url || '#'} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => deleteTicket(selected.id)} disabled={deletingId === selected.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deletingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {(selected.messages || []).length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-10">Aucun message</p>
                )}
                {(selected.messages || []).map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 ${
                    msg.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.sender === 'admin' ? 'bg-indigo-100' : 'bg-gray-200'
                    }`}>
                      {msg.sender === 'admin'
                        ? <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        : <User className="w-3.5 h-3.5 text-gray-500" />}
                    </div>
                    <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'admin'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.sender === 'admin' ? 'text-indigo-200' : 'text-gray-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="shrink-0 px-5 py-3 bg-white border-t border-gray-200">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
                    }}
                    rows={2}
                    placeholder="Répondre… (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 mb-0.5"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Sélectionne un ticket pour voir la conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
