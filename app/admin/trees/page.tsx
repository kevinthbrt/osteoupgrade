'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  Lock,
  Unlock,
  Calendar,
  User,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react'

export default function AdminTreesPage() {
  const router = useRouter()
  const [trees, setTrees] = useState<any[]>([])
  const [filteredTrees, setFilteredTrees] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    premium: 0,
    totalSessions: 0
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterTrees()
  }, [searchQuery, filterCategory, trees])

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

    loadTrees()
  }

  const loadTrees = async () => {
    try {
      // Charger tous les arbres avec leurs créateurs
      const { data: treesData } = await supabase
        .from('decision_trees')
        .select(`
          *,
          profiles:created_by (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      // Charger les statistiques d'utilisation
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('tree_id, completed')

      // Calculer les stats pour chaque arbre
      const treesWithStats = treesData?.map(tree => {
        const treeSessions = sessionsData?.filter(s => s.tree_id === tree.id) || []
        const completedSessions = treeSessions.filter(s => s.completed).length
        
        return {
          ...tree,
          totalSessions: treeSessions.length,
          completedSessions,
          completionRate: treeSessions.length > 0 
            ? Math.round((completedSessions / treeSessions.length) * 100)
            : 0
        }
      }) || []

      setTrees(treesWithStats)
      setFilteredTrees(treesWithStats)

      // Calculer les statistiques globales
      setStats({
        total: treesWithStats.length,
        free: treesWithStats.filter(t => t.is_free).length,
        premium: treesWithStats.filter(t => !t.is_free).length,
        totalSessions: sessionsData?.length || 0
      })

    } catch (error) {
      console.error('Error loading trees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTrees = () => {
    let filtered = [...trees]

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(tree =>
        tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (filterCategory !== 'all') {
      if (filterCategory === 'free') {
        filtered = filtered.filter(tree => tree.is_free)
      } else if (filterCategory === 'premium') {
        filtered = filtered.filter(tree => !tree.is_free)
      } else {
        filtered = filtered.filter(tree => tree.category === filterCategory)
      }
    }

    setFilteredTrees(filtered)
  }

  const handleDeleteTree = async (treeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arbre ? Cette action est irréversible.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('decision_trees')
        .delete()
        .eq('id', treeId)

      if (error) throw error

      alert('Arbre supprimé avec succès')
      loadTrees()
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  const toggleFreeStatus = async (treeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('decision_trees')
        .update({ is_free: !currentStatus })
        .eq('id', treeId)

      if (error) throw error

      loadTrees()
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Nom', 'Catégorie', 'Type', 'Sessions', 'Taux complétion', 'Créé le', 'Créateur'].join(','),
      ...filteredTrees.map(t => [
        t.name,
        t.category || '',
        t.is_free ? 'Gratuit' : 'Premium',
        t.totalSessions,
        `${t.completionRate}%`,
        new Date(t.created_at).toLocaleDateString('fr-FR'),
        t.profiles?.email || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'arbres-decisionnels-export.csv'
    a.click()
  }

  const categories = ['Cervical', 'Lombaire', 'Épaule', 'Genou', 'Cheville', 'Poignet', 'Hanche', 'Thoracique']

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TreePine className="h-6 w-6" />
                Gestion des arbres décisionnels
              </h1>
              <p className="mt-1 text-purple-100">
                Administrez tous les arbres de diagnostic
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => router.push('/admin/trees/new')}
                className="bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvel arbre
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total arbres</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TreePine className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Arbres gratuits</p>
                <p className="text-2xl font-bold text-green-600">{stats.free}</p>
              </div>
              <Unlock className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Arbres premium</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.premium}</p>
              </div>
              <Lock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions totales</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un arbre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="free">Gratuits uniquement</option>
              <option value="premium">Premium uniquement</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trees Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arbre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucun arbre trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTrees.map((tree) => (
                    <tr key={tree.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tree.name}
                          </p>
                          {tree.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {tree.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {tree.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFreeStatus(tree.id, tree.is_free)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            tree.is_free 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {tree.is_free ? (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Gratuit
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Premium
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{tree.totalSessions} sessions</p>
                          {tree.totalSessions > 0 && (
                            <p className="text-xs text-gray-500">
                              {tree.completionRate}% complétées
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <p>{new Date(tree.created_at).toLocaleDateString('fr-FR')}</p>
                          {tree.profiles && (
                            <p className="text-xs text-gray-500 mt-1">
                              {tree.profiles.full_name || tree.profiles.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/trees/${tree.id}`)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Visualiser"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/trees/${tree.id}/edit`)}
                            className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                            title="Éditer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTree(tree.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
