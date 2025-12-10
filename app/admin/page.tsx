'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Users,
  Clipboard,
  Activity,
  Shield,
  Crown,
  Layers,
  Filter,
  Map,
  Box,
  TestTube,
  Mail
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalAnatomicalZones: 0, // Pour Testing 3D
    totalPathologies: 0,
    totalTests: 0,
    totalClusters: 0,
    totalTopographicZones: 0,
    totalDecisionTrees: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
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

      loadAdminData()
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    }
  }

  const loadAdminData = async () => {
    try {
      // Get users statistics
      const { data: profiles } = await supabase.from('profiles').select('*')
      const freeCount = profiles?.filter(p => p.role === 'free').length || 0
      const premiumCount = profiles?.filter(p => p.role === 'premium').length || 0

      // Get system statistics
      const [
        anatomicalZonesResponse, // Pour Testing 3D
        pathologiesResponse, 
        testsResponse, 
        clustersResponse,
        topographicZonesResponse,
        decisionTreesResponse
      ] = await Promise.all([
        supabase.from('anatomical_zones').select('*'),
        supabase.from('pathologies').select('*'),
        supabase.from('orthopedic_tests').select('*'),
        supabase.from('orthopedic_test_clusters').select('*'),
        supabase.from('topographic_zones').select('*'),
        supabase.from('decision_trees').select('*')
      ])

      setStats({
        totalUsers: profiles?.length || 0,
        freeUsers: freeCount,
        premiumUsers: premiumCount,
        totalAnatomicalZones: anatomicalZonesResponse.data?.length || 0,
        totalPathologies: pathologiesResponse.data?.length || 0,
        totalTests: testsResponse.data?.length || 0,
        totalClusters: clustersResponse.data?.length || 0,
        totalTopographicZones: topographicZonesResponse.data?.length || 0,
        totalDecisionTrees: decisionTreesResponse.data?.length || 0,
        monthlyRevenue: premiumCount * 29.99,
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      label: 'Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      detail: `${stats.freeUsers} gratuits, ${stats.premiumUsers} premium`,
      href: '/admin/users'
    },
    {
      label: 'Zones Topographiques',
      value: stats.totalTopographicZones,
      icon: Map,
      color: 'from-purple-500 to-purple-600',
      detail: 'Pour Consultation V3',
      href: '/admin/topographic-zones'
    },
    {
      label: 'Arbres Décisionnels',
      value: stats.totalDecisionTrees,
      icon: Filter,
      color: 'from-indigo-500 to-indigo-600',
      detail: 'Pour Consultation V3',
      href: '/admin/decision-trees'
    },
    {
      label: 'Pathologies',
      value: stats.totalPathologies,
      icon: Activity,
      color: 'from-red-500 to-red-600',
      detail: 'Diagnostics simples',
      href: '/admin/pathologies'
    },
    {
      label: 'Tests Orthopédiques',
      value: stats.totalTests,
      icon: Clipboard,
      color: 'from-orange-500 to-orange-600',
      detail: 'Tests par zone',
      href: '/tests'
    },
    {
      label: 'Mailing & Newsletter',
      value: 'Nouveau',
      icon: Mail,
      color: 'from-pink-500 to-pink-600',
      detail: 'Campagnes, automatisations',
      href: '/admin/mailing'
    },
  ]

  const managementActions = [
    {
      title: '🎯 Tests Orthopédiques',
      description: 'Gérer les tests organisés par zones anatomiques',
      icon: Clipboard,
      href: '/tests',
      color: 'from-orange-500 to-orange-600',
      stats: `${stats.totalTests} tests, ${stats.totalClusters} clusters`
    },
    {
      title: '📁 Diagnostics (Testing 3D)',
      description: 'Créer des dossiers de diagnostics avec photos, signes cliniques et tests',
      icon: Layers,
      href: '/admin/diagnostics',
      color: 'from-violet-500 to-violet-600',
      stats: 'Module Testing 3D amélioré'
    },
    {
      title: '🩺 Pathologies',
      description: 'Gérer les pathologies pour les diagnostics (Consultation V3)',
      icon: Activity,
      href: '/admin/pathologies',
      color: 'from-red-500 to-red-600',
      stats: `${stats.totalPathologies} pathologies`
    },
    {
      title: '🗺️ Zones Topographiques',
      description: 'Créer des zones avec images cliquables (Consultation V3)',
      icon: Map,
      href: '/admin/topographic-zones',
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.totalTopographicZones} zones créées`
    },
    {
      title: '🌳 Arbres Décisionnels',
      description: 'Configurer les arbres de questions/réponses (Consultation V3)',
      icon: Filter,
      href: '/admin/decision-trees',
      color: 'from-indigo-500 to-indigo-600',
      stats: `${stats.totalDecisionTrees} arbres configurés`
    },
    {
      title: '🧍 Anatomy Builder',
      description: 'Positionner les zones 3D pour le module Testing 3D',
      icon: Box,
      href: '/admin/anatomy-builder',
      color: 'from-green-500 to-green-600',
      stats: `${stats.totalAnatomicalZones} zones 3D`
    },
    {
      title: '📧 Mailing & Newsletter',
      description: 'Campagnes, automation, relances et onboarding',
      icon: Mail,
      href: '/admin/mailing',
      color: 'from-pink-500 to-pink-600',
      stats: 'Pilotage marketing complet'
    },
  ]

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
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Administration</h1>
              </div>
              <p className="text-purple-100">
                OsteoUpgrade - Architecture Simplifiée V2
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)}€</p>
              <p className="text-purple-100 text-sm">Revenus mensuels</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-sm p-6 ${stat.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => stat.href && router.push(stat.href)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {stat.detail}
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Management Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {managementActions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${action.color}`} />
                <div className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`bg-gradient-to-br ${action.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-2">
                        {action.stats}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(action.href)}
                    className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    Gérer
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* System Stats - Nouvelle architecture simplifiée */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Architecture Simplifiée
            </h2>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">MODULE CONSULTATION V3</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Map className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Zones topographiques</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalTopographicZones}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-gray-600">Arbres décisionnels</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalDecisionTrees}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-gray-600">Pathologies (diagnostics)</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalPathologies}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">MODULE TESTING 3D</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Box className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Zones anatomiques 3D</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalAnatomicalZones}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clipboard className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Tests orthopédiques</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalTests}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-600">Taux de conversion</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.totalUsers > 0 
                    ? Math.round((stats.premiumUsers / stats.totalUsers) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">
              🚀 Workflow Administrateur
            </h2>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold mb-2">1️⃣ Configuration Consultation V3</p>
                <div className="space-y-1 text-sm text-purple-100">
                  <button
                    onClick={() => router.push('/admin/topographic-zones')}
                    className="block w-full text-left hover:text-white transition-colors"
                  >
                    → Créer zones topographiques
                  </button>
                  <button
                    onClick={() => router.push('/admin/decision-trees')}
                    className="block w-full text-left hover:text-white transition-colors"
                  >
                    → Configurer arbres décisionnels
                  </button>
                  <button
                    onClick={() => router.push('/admin/pathologies')}
                    className="block w-full text-left hover:text-white transition-colors"
                  >
                    → Créer pathologies (diagnostics)
                  </button>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold mb-2">2️⃣ Configuration Testing 3D</p>
                <div className="space-y-1 text-sm text-purple-100">
                  <button
                    onClick={() => router.push('/admin/anatomy-builder')}
                    className="block w-full text-left hover:text-white transition-colors"
                  >
                    → Positionner zones 3D
                  </button>
                  <button
                  onClick={() => router.push('/tests')}
                    className="block w-full text-left hover:text-white transition-colors"
                  >
                    → Gérer tests orthopédiques
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/testing')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors mt-4"
              >
                <p className="font-medium">🧪 Tester Testing 3D</p>
                <p className="text-sm text-purple-100">Module de testing interactif</p>
              </button>
              
              <button
                onClick={() => router.push('/consultation-v3')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors"
              >
                <p className="font-medium">🎯 Tester Consultation V3</p>
                <p className="text-sm text-purple-100">Consultation guidée par zones</p>
              </button>
            </div>
          </div>
        </div>

        {/* Architecture Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <TestTube className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                ✨ Architecture Simplifiée V2
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Pathologies ⊥ Tests</strong> : Pathologies et tests sont maintenant indépendants</p>
                <p>• <strong>2 Modules distincts</strong> : Consultation V3 (zones topo + arbres) et Testing 3D (zones 3D + tests)</p>
                <p>• <strong>Tables supprimées</strong> : structures, pathology_tests, pathology_clusters</p>
                <p>• <strong>Simplicité</strong> : Configuration rapide, maintenance facile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}