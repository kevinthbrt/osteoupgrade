'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  Tag,
  Clock,
  User,
  Paperclip
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'

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

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<EmailCounts>({
    total: 0,
    unread: 0,
    parrainage: 0,
    support: 0,
    general: 0,
    spam: 0
  })

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEmails()
  }, [categoryFilter, isReadFilter, searchQuery])

  async function loadEmails() {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      if (isReadFilter !== null) params.set('is_read', String(isReadFilter))
      if (searchQuery) params.set('search', searchQuery)
      params.set('is_archived', 'false') // Only show non-archived by default

      const response = await fetch(`/api/emails/list?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEmails(data.emails || [])
        setCounts(data.counts || counts)
      } else {
        console.error('Failed to load emails:', data.error)
      }
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  async function openEmail(email: Email) {
    try {
      const response = await fetch(`/api/emails/${email.id}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedEmail(data.email)
        // Update email in list to reflect read status
        setEmails(emails.map(e =>
          e.id === email.id ? { ...e, is_read: true } : e
        ))
        setCounts(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - (email.is_read ? 0 : 1))
        }))
      }
    } catch (error) {
      console.error('Error opening email:', error)
    }
  }

  async function toggleReadStatus(emailId: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !currentStatus })
      })

      if (response.ok) {
        setEmails(emails.map(e =>
          e.id === emailId ? { ...e, is_read: !currentStatus } : e
        ))
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, is_read: !currentStatus })
        }
        setCounts(prev => ({
          ...prev,
          unread: prev.unread + (currentStatus ? 1 : -1)
        }))
      }
    } catch (error) {
      console.error('Error toggling read status:', error)
    }
  }

  async function archiveEmail(emailId: string) {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true })
      })

      if (response.ok) {
        setEmails(emails.filter(e => e.id !== emailId))
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null)
        }
      }
    } catch (error) {
      console.error('Error archiving email:', error)
    }
  }

  async function deleteEmail(emailId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet email définitivement ?')) {
      return
    }

    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEmails(emails.filter(e => e.id !== emailId))
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null)
        }
      }
    } catch (error) {
      console.error('Error deleting email:', error)
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'parrainage':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'support':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'spam':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  return (
    <AuthLayout>
    <div className="min-h-screen -m-6 md:-m-8">
      {/* Dark header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6 overflow-hidden">
        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute top-0 right-1/4 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
          <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
        </div>

        {/* Glow lines */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent" />

        {/* Glass panel */}
        <div className="relative z-10 bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-purple-300" />
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Admin — Emails
              </span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
              Emails Reçus
            </h1>
            <p className="mt-1 text-blue-300/70 text-sm">
              Gérez et consultez tous les emails entrants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-400/30 text-purple-200">
              {counts.unread} non lus
            </span>
            <button
              onClick={loadEmails}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Light body */}
      <div className="relative bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 overflow-hidden">
        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-3">
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none text-sm"
                  />
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCategoryFilter(null)
                      setIsReadFilter(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !categoryFilter && isReadFilter === null
                        ? 'bg-purple-100/80 text-purple-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Tous les emails</span>
                    <span className="text-xs">{counts.total}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategoryFilter(null)
                      setIsReadFilter(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isReadFilter === false && !categoryFilter
                        ? 'bg-purple-100/80 text-purple-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Non lus</span>
                    <span className="text-xs">{counts.unread}</span>
                  </button>

                  <div className="border-t border-blue-200/50 my-3"></div>

                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                    Catégories
                  </div>

                  <button
                    onClick={() => {
                      setCategoryFilter('parrainage')
                      setIsReadFilter(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === 'parrainage'
                        ? 'bg-yellow-100/80 text-yellow-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Parrainage</span>
                    <span className="text-xs">{counts.parrainage}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategoryFilter('support')
                      setIsReadFilter(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === 'support'
                        ? 'bg-blue-100/80 text-blue-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Support</span>
                    <span className="text-xs">{counts.support}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategoryFilter('general')
                      setIsReadFilter(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === 'general'
                        ? 'bg-slate-100/80 text-slate-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Général</span>
                    <span className="text-xs">{counts.general}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategoryFilter('spam')
                      setIsReadFilter(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === 'spam'
                        ? 'bg-red-100/80 text-red-700'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span>Spam</span>
                    <span className="text-xs">{counts.spam}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="col-span-9">
              {selectedEmail ? (
                // Email Detail View
                <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                  {/* Header */}
                  <div className="border-b border-blue-200/40 pb-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Retour
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleReadStatus(selectedEmail.id, selectedEmail.is_read)}
                          className="p-2 text-slate-600 hover:text-slate-900 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-xl transition-colors"
                          title={selectedEmail.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                        >
                          {selectedEmail.is_read ? (
                            <Mail className="h-5 w-5" />
                          ) : (
                            <MailOpen className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => archiveEmail(selectedEmail.id)}
                          className="p-2 text-slate-600 hover:text-slate-900 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-xl transition-colors"
                          title="Archiver"
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteEmail(selectedEmail.id)}
                          className="p-2 bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 hover:bg-red-500/20 rounded-xl transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                      {selectedEmail.subject}
                    </h2>

                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{selectedEmail.from_name || selectedEmail.from_email}</span>
                        {selectedEmail.from_name && (
                          <span className="ml-2 text-slate-400">&lt;{selectedEmail.from_email}&gt;</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(selectedEmail.received_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(selectedEmail.category)}`}>
                        {selectedEmail.category}
                      </span>
                      {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                        <span className="flex items-center text-xs text-slate-600">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {selectedEmail.attachments.length} pièce(s) jointe(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    {selectedEmail.html_content ? (
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-slate-700">
                        {selectedEmail.text_content || 'Aucun contenu'}
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="border-t border-blue-200/40 pt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">
                        Pièces jointes
                      </h3>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((attachment: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border border-blue-200/40 rounded-xl"
                          >
                            <div className="flex items-center">
                              <Paperclip className="h-4 w-4 text-slate-400 mr-2" />
                              <span className="text-sm font-medium text-slate-700">
                                {attachment.filename}
                              </span>
                              <span className="ml-2 text-xs text-slate-500">
                                ({Math.round(attachment.size / 1024)} KB)
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  // Fetch download URL from our API
                                  const response = await fetch(
                                    `/api/emails/${selectedEmail.resend_email_id}/attachments/${attachment.id}`
                                  )
                                  if (response.ok) {
                                    const data = await response.json()
                                    // Open download URL in new tab
                                    window.open(data.attachment.downloadUrl, '_blank')
                                  } else {
                                    alert('Erreur lors du téléchargement de la pièce jointe')
                                  }
                                } catch (error) {
                                  console.error('Error downloading attachment:', error)
                                  alert('Erreur lors du téléchargement de la pièce jointe')
                                }
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all text-xs"
                            >
                              Télécharger
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Email List View
                <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl overflow-hidden">
                  {loading ? (
                    <div className="p-12 text-center text-slate-500">
                      Chargement...
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-medium">Aucun email</p>
                      <p className="text-sm">Vous n'avez pas encore reçu d'emails.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-blue-100/60">
                      {emails.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => openEmail(email)}
                          className={`p-4 hover:bg-white/60 cursor-pointer transition-colors ${
                            !email.is_read ? 'bg-purple-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center space-x-3 mb-2">
                                {!email.is_read && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                )}
                                <span className={`text-sm font-medium text-slate-900 ${!email.is_read ? 'font-semibold' : ''}`}>
                                  {email.from_name || email.from_email}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(email.category)}`}>
                                  {email.category}
                                </span>
                                {email.attachments && email.attachments.length > 0 && (
                                  <Paperclip className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <h3 className={`text-sm mb-1 truncate ${!email.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                {email.subject}
                              </h3>
                              {email.text_content && (
                                <p className="text-sm text-slate-500 truncate">
                                  {email.text_content.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                {formatDate(email.received_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthLayout>
  )
}
