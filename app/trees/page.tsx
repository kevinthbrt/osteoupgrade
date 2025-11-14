'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  Search,
  Filter,
  PlayCircle,
  Lock,
  Clock,
  ChevronRight,
  Crown,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

export default function TreesPage() {
  const router = useRouter()
  const [trees, setTrees] = useState<any[]>([])
  const [filteredTrees, setFilteredTrees] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrees()
  }, [])

  useEffect(() => {
    filterTrees()
  }, [searchQuery, selectedCategory, trees])

  const loadTrees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      // Get trees based on user role
      let treesQuery = supabase.from('decision_trees').select('*')
      
      if (profileData?.role === 'free') {
        treesQuery = treesQuery.eq('is_free', true)
      }

      const { data: treesData } = await treesQuery.order('created_at', { ascending: false })
      
      setTrees(treesData || [])
      setFilteredTrees(treesData || [])

      // Extract unique categories
      const uniqueCategories = [...new Set(treesData?.map(t => t.category).filter(Boolean))]
      setCategories(uniqueCategories)

    } catch (error) {
      console.error('Error loading trees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTrees = () => {
    let filtered = [...trees]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tree =>
        tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tree => tree.category === selectedCategory)
    }

    setFilteredTrees(filtered)
  }

  const handleStartTree = (treeId: string) => {
    router.push(`/trees/${treeId}`)
  }

  const handleDeleteTree = async (treeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet arbre ?')) {
      await supabase.from('decision_trees').delete().eq('id', treeId)
      loadTrees()
    }
  }

  const categoryIcons: { [key: string]: string } = {
    'Cervical': '🦴',
    'Lombaire': '🔙',
    'Épaule': '💪',
    'Genou': '🦵',
    'Cheville': '🦶',
    'Poignet': '✋',
    'Hanche': '🚶',
    'Thoracique': '🫁',
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Arbres décisionnels
              </h1>
              <p className="mt-1 text-gray-600">
                Sélectionnez un arbre pour démarrer un diagnostic
              </p>
            </div>
            {profile?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/trees/new')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvel arbre</span>
              </button>
            )}
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
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{categoryIcons[category] || '📋'}</span>
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trees Grid */}
        {filteredTrees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun arbre trouvé
            </h3>
            <p className="text-gray-600">
              {profile?.role === 'free' 
                ? "Passez à Premium pour accéder à plus d'arbres décisionnels"
                : "Modifiez vos critères de recherche"}
            </p>
            {profile?.role === 'free' && (
              <button
                onClick={() => router.push('/settings')}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <Crown className="h-4 w-4" />
                <span>Passer à Premium</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrees.map((tree) => {
              const isLocked = profile?.role === 'free' && !tree.is_free
              
              return (
                <div
                  key={tree.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all ${
                    isLocked ? 'opacity-75' : ''
                  }`}
                >
                  <div className={`h-2 bg-gradient-to-r ${
                    tree.is_free 
                      ? 'from-green-400 to-green-500' 
                      : 'from-yellow-400 to-yellow-500'
                  }`} />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <TreePine className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {tree.name}
                          </h3>
                          {tree.category && (
                            <span className="text-sm text-gray-500">
                              {categoryIcons[tree.category]} {tree.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {isLocked && (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {tree.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {tree.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>~5-10 min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {profile?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => router.push(`/admin/trees/${tree.id}/edit`)}
                              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTree(tree.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleStartTree(tree.id)}
                          disabled={isLocked}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                            isLocked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary-600 hover:bg-primary-700 text-white'
                          }`}
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>Démarrer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
