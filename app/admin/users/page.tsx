'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Users,
  Search,
  Crown,
  Shield,
  User,
  Calendar,
  Download,
  Flame,
  Zap,
  Trophy,
  ExternalLink,
  X,
  Mail
} from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 30) return `Il y a ${days} jours`
  const months = Math.floor(days / 30)
  if (months < 12) return `Il y a ${months} mois`
  return `Il y a ${Math.floor(months / 12)} an(s)`
}

function roleBadge(role: string) {
  if (role === 'admin')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
        <Shield className="h-3 w-3" /> Admin
      </span>
    )
  if (role === 'premium')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <Crown className="h-3 w-3" /> Premium
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <User className="h-3 w-3" /> Gratuit
    </span>
  )
}

function avatarColor(role: string) {
  if (role === 'admin') return 'bg-purple-600'
  if (role === 'premium') return 'bg-yellow-500'
  return 'bg-slate-400'
}

// ── component ──────────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'users' | 'newsletter'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [newsletterContacts, setNewsletterContacts] = useState<any[]>([])
  const [filteredNewsletterContacts, setFilteredNewsletterContacts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingNewsletter, setLoadingNewsletter] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, filterRole, users])

  useEffect(() => {
    if (viewMode === 'newsletter' && newsletterContacts.length === 0 && !loadingNewsletter) {
      loadNewsletterContacts()
    }
    setSearchQuery('')
  }, [viewMode])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    loadUsers()
  }

  const loadUsers = async () => {
    try {
      // Two separate queries to avoid FK relationship dependency
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) throw profileError

      const profiles = profileData || []

      // Fetch gamification stats via server route (bypasses RLS)
      const gamifRes = await fetch('/api/admin/gamification-stats')
      const gamifJson = gamifRes.ok ? await gamifRes.json() : { stats: [] }
      const gamifMap = Object.fromEntries((gamifJson.stats || []).map((g: any) => [g.user_id, g]))

      const merged = profiles.map(p => ({
        ...p,
        gamification: gamifMap[p.id] ? [gamifMap[p.id]] : []
      }))

      setUsers(merged)
      setFilteredUsers(merged)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }

  const loadNewsletterContacts = async () => {
    setLoadingNewsletter(true)
    try {
      const res = await fetch('/api/admin/newsletter-contacts')
      const json = res.ok ? await res.json() : { contacts: [] }
      setNewsletterContacts(json.contacts || [])
      setFilteredNewsletterContacts(json.contacts || [])
    } catch {
      // ignore
    } finally {
      setLoadingNewsletter(false)
    }
  }

  const filterNewsletterContacts = (query: string) => {
    if (!query) {
      setFilteredNewsletterContacts(newsletterContacts)
      return
    }
    const q = query.toLowerCase()
    setFilteredNewsletterContacts(
      newsletterContacts.filter(c =>
        c.email?.toLowerCase().includes(q) ||
        c.first_name?.toLowerCase().includes(q) ||
        c.last_name?.toLowerCase().includes(q)
      )
    )
  }

  const openDetail = (user: any) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setShowDetailModal(true)
  }

  const closeDetail = () => {
    setShowDetailModal(false)
    setSelectedUser(null)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-user-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role: editRole })
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Erreur inconnue')
      }

      setUsers(prev =>
        prev.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u)
      )
      setSelectedUser((prev: any) => ({ ...prev, role: editRole }))
      alert('Rôle mis à jour avec succès !')
    } catch (error: any) {
      alert('Erreur : ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Nom', 'Rôle', 'Niveau', 'XP', 'Streak', 'Dernière connexion', 'Inscription'].join(','),
      ...filteredUsers.map(u => {
        const g = u.gamification?.[0]
        return [
          u.email,
          u.full_name || '',
          u.role,
          g?.level ?? 1,
          g?.total_xp ?? 0,
          g?.current_streak ?? 0,
          g?.last_login_date || u.last_sign_in_at || '',
          new Date(u.created_at).toLocaleDateString('fr-FR')
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-export.csv'
    a.click()
  }

  const stats = {
    total: users.length,
    free: users.filter(u => u.role === 'free').length,
    premium: users.filter(u => u.role === 'premium').length,
    admin: users.filter(u => u.role === 'admin').length
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── HEADER ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" /> Administration
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                  Gestion des utilisateurs
                </h1>
                <p className="text-blue-300/70 text-sm mt-1.5">{stats.total} utilisateurs inscrits</p>
              </div>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* ── BODY ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative space-y-6">

            {/* ── View Toggle ── */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('users')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${viewMode === 'users' ? 'bg-blue-600 text-white border-blue-500 shadow' : 'bg-white/70 text-slate-700 border-blue-200/60 hover:bg-white/90'}`}
              >
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Utilisateurs inscrits</span>
              </button>
              <button
                onClick={() => setViewMode('newsletter')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${viewMode === 'newsletter' ? 'bg-teal-600 text-white border-teal-500 shadow' : 'bg-white/70 text-slate-700 border-blue-200/60 hover:bg-white/90'}`}
              >
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Newsletter pré-lancement</span>
              </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total inscrits</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Gratuits</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.free}</p>
                  </div>
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Premium</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.premium}</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Newsletter pré-lancement</p>
                    <p className="text-2xl font-bold text-teal-600">{newsletterContacts.length || '—'}</p>
                  </div>
                  <Mail className="h-8 w-8 text-teal-500" />
                </div>
              </div>
            </div>

            {/* ── Filters ── */}
            {viewMode === 'users' && (
            <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par email ou nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="free">Gratuit</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            )}

            {/* ── Newsletter pre-launch view ── */}
            {viewMode === 'newsletter' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par email ou nom..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); filterNewsletterContacts(e.target.value) }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-teal-200/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b border-white/50">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-teal-500 to-teal-700" />
                  <h2 className="text-sm font-bold text-slate-800 tracking-wide">Contacts newsletter pré-lancement</h2>
                  <span className="ml-auto text-xs text-slate-400">{filteredNewsletterContacts.length} contact{filteredNewsletterContacts.length !== 1 ? 's' : ''}</span>
                </div>
                {loadingNewsletter ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-teal-50/60 border-b border-teal-100/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prénom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ajouté le</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100/40">
                      {filteredNewsletterContacts.map((c) => (
                        <tr key={c.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-teal-500">
                                {(c.first_name || c.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{c.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{c.first_name || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{c.last_name || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(c.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredNewsletterContacts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                            Aucun contact trouvé.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
            )}

            {/* ── Table ── */}
            {viewMode === 'users' && <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b border-white/50">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                  Liste des utilisateurs
                </h2>
                <span className="ml-auto text-xs text-slate-400">{filteredUsers.length} résultat{filteredUsers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50/60 border-b border-blue-100/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Niveau</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Streak</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dernière connexion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inscription</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100/40">
                    {filteredUsers.map((user) => {
                      const g = user.gamification?.[0]
                      const lastLogin = g?.last_login_date || user.last_sign_in_at || null
                      return (
                        <tr key={user.id} className="hover:bg-blue-50/40 transition-colors">

                          {/* Utilisateur */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${avatarColor(user.role)}`}>
                                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || 'Sans nom'}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Rôle */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {roleBadge(user.role)}
                          </td>

                          {/* Niveau */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-slate-700">Niv.{g?.level ?? 1}</p>
                                <p className="text-xs text-slate-400">{(g?.total_xp ?? 0).toLocaleString('fr-FR')} XP</p>
                              </div>
                            </div>
                          </td>

                          {/* Streak */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Flame className={`h-4 w-4 shrink-0 ${(g?.current_streak ?? 0) > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
                              <span className="text-sm font-medium text-slate-700">{g?.current_streak ?? 0} j</span>
                            </div>
                          </td>

                          {/* Dernière connexion */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600">{relativeDate(lastLogin)}</span>
                          </td>

                          {/* Inscription */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => openDetail(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-xs font-medium hover:bg-white/90 transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Détails
                            </button>
                          </td>
                        </tr>
                      )
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                          Aucun utilisateur trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>}

          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {showDetailModal && selectedUser && (() => {
        const g = selectedUser.gamification?.[0]
        const lastLogin = g?.last_login_date || selectedUser.last_sign_in_at || null
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 w-full max-w-lg flex flex-col max-h-[90vh]">

              {/* Modal header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${avatarColor(selectedUser.role)}`}>
                    {(selectedUser.full_name || selectedUser.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedUser.full_name || 'Sans nom'}</h3>
                    <p className="text-sm text-slate-500 mb-1">{selectedUser.email}</p>
                    {roleBadge(selectedUser.role)}
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">

                {/* Gamification stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">Niv. {g?.level ?? 1}</p>
                    <p className="text-xs text-slate-500">Niveau</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                    <Zap className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{(g?.total_xp ?? 0).toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-slate-500">XP total</p>
                  </div>
                  <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                    <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-800">{g?.current_streak ?? 0} j</p>
                    <p className="text-xs text-slate-500">Streak</p>
                  </div>
                </div>

                {/* Informations */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Informations</h4>
                  <div className="space-y-3">

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-sm"
                      >
                        <option value="free">Gratuit</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex justify-between text-sm py-1">
                      <span className="text-slate-500">Inscription</span>
                      <span className="text-slate-700 font-medium">{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div className="flex justify-between text-sm py-1">
                      <span className="text-slate-500">Dernière connexion</span>
                      <span className="text-slate-700 font-medium">{relativeDate(lastLogin)}</span>
                    </div>

                    {selectedUser.subscription_status && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-slate-500">Statut abonnement</span>
                        <span className="text-slate-700 font-medium capitalize">{selectedUser.subscription_status}</span>
                      </div>
                    )}

                    {selectedUser.subscription_end_date && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-slate-500">Fin d&apos;abonnement</span>
                        <span className="text-slate-700 font-medium">
                          {new Date(selectedUser.subscription_end_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleUpdateRole}
                      disabled={saving || editRole === selectedUser.role}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Shield className="h-4 w-4" />
                      {saving ? 'Enregistrement…' : 'Changer le rôle'}
                    </button>

                    <a
                      href={`mailto:${selectedUser.email}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 transition-all"
                    >
                      <Mail className="h-4 w-4" />
                      Envoyer un email
                    </a>
                  </div>
                </div>

              </div>

              {/* Modal footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-100">
                <button
                  onClick={closeDetail}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 transition-all"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        )
      })()}
    </AuthLayout>
  )
}
