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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Emails Reçus
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {counts.unread} non lus
              </span>
            </div>
            <button
              onClick={loadEmails}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCategoryFilter(null)
                    setIsReadFilter(null)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    !categoryFilter && isReadFilter === null
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    isReadFilter === false && !categoryFilter
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Non lus</span>
                  <span className="text-xs">{counts.unread}</span>
                </button>

                <div className="border-t border-gray-200 my-3"></div>

                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  Catégories
                </div>

                <button
                  onClick={() => {
                    setCategoryFilter('parrainage')
                    setIsReadFilter(null)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    categoryFilter === 'parrainage'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'text-gray-700 hover:bg-gray-50'
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    categoryFilter === 'support'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    categoryFilter === 'general'
                      ? 'bg-gray-50 text-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    categoryFilter === 'spam'
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-700 hover:bg-gray-50'
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Retour
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleReadStatus(selectedEmail.id, selectedEmail.is_read)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
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
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Archiver"
                      >
                        <Archive className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteEmail(selectedEmail.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {selectedEmail.subject}
                  </h2>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{selectedEmail.from_name || selectedEmail.from_email}</span>
                      {selectedEmail.from_name && (
                        <span className="ml-2 text-gray-400">&lt;{selectedEmail.from_email}&gt;</span>
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
                      <span className="flex items-center text-xs text-gray-600">
                        <Paperclip className="h-3 w-3 mr-1" />
                        {selectedEmail.attachments.length} pièce(s) jointe(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {selectedEmail.html_content ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedEmail.text_content || 'Aucun contenu'}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="border-t border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Pièces jointes
                    </h3>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {attachment.filename}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
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
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    Chargement...
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Aucun email</p>
                    <p className="text-sm">Vous n'avez pas encore reçu d'emails.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => openEmail(email)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !email.is_read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center space-x-3 mb-2">
                              {!email.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <span className={`text-sm font-medium text-gray-900 ${!email.is_read ? 'font-semibold' : ''}`}>
                                {email.from_name || email.from_email}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(email.category)}`}>
                                {email.category}
                              </span>
                              {email.attachments && email.attachments.length > 0 && (
                                <Paperclip className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <h3 className={`text-sm mb-1 truncate ${!email.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {email.subject}
                            </h3>
                            {email.text_content && (
                              <p className="text-sm text-gray-500 truncate">
                                {email.text_content.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
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
  )
}
