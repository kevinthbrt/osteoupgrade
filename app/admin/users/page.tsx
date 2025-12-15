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
  Mail,
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  Filter,
  Download,
  MoreVertical
} from 'lucide-react'
import { Button, Breadcrumbs, PageSpinner } from '@/components/ui'

export default function UsersManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editRole, setEditRole] = useState('')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, filterRole, users])

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
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setShowEditModal(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editRole })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert('Rôle mis à jour avec succès !')
      setShowEditModal(false)
      loadUsers()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      // Note: In production, you might want to soft delete or handle this differently
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) throw error

      alert('Utilisateur supprimé')
      loadUsers()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Nom', 'Rôle', 'Date création'].join(','),
      ...filteredUsers.map(u => [
        u.email,
        u.full_name || '',
        u.role,
        new Date(u.created_at).toLocaleDateString('fr-FR')
      ].join(','))
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
        <PageSpinner text="Chargement..." />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Breadcrumbs items={[
        { label: 'Administration', href: '/admin' },
        { label: 'Utilisateurs' }
      ]} />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des utilisateurs
              </h1>
              <p className="mt-1 text-gray-600">
                {stats.total} utilisateurs inscrits
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gratuits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
              </div>
              <User className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.premium}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="free">Gratuit</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date inscription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.role === 'admin' ? 'bg-purple-600' :
                          user.role === 'premium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}>
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Sans nom'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                        {user.role === 'admin' ? 'Admin' :
                         user.role === 'premium' ? 'Premium' : 'Gratuit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modifier l'utilisateur
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <p className="text-gray-900">{selectedUser.full_name || 'Non renseigné'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="free">Gratuit</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
