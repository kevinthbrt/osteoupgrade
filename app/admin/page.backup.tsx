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
  BarChart,
  Crown,
  Box,
  Layers
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalZones: 0,
    totalPathologies: 0,
    totalTests: 0,
    totalClusters: 0,
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

      // Get anatomy system statistics
      const [zonesResponse, pathologiesResponse, testsResponse, clustersResponse] = await Promise.all([
        supabase.from('anatomical_zones').select('*'),
        supabase.from('pathologies').select('*'),
        supabase.from('orthopedic_tests').select('*'),
        supabase.from('orthopedic_test_clusters').select('*')
      ])

      setStats({
        totalUsers: profiles?.length || 0,
        freeUsers: freeCount,
        premiumUsers: premiumCount,
        totalZones: zonesResponse.data?.length || 0,
        totalPathologies: pathologiesResponse.data?.length || 0,
        totalTests: testsResponse.data?.length || 0,
        totalClusters: clustersResponse.data?.length || 0,
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
      label: 'Zones Anatomiques',
      value: stats.totalZones,
      icon: Box,
      color: 'from-purple-500 to-purple-600',
      detail: 'Régions cliquables',
      href: '/admin/anatomy-builder'
    },
    {
      label: 'Pathologies',
      value: stats.totalPathologies,
      icon: Activity,
      color: 'from-red-500 to-red-600',
      detail: 'Pathologies configurées',
      href: '/admin/pathologies'
    },
    {
      label: 'Tests',
      value: stats.totalTests,
      icon: Clipboard,
      color: 'from-orange-500 to-orange-600',
      detail: 'Tests orthopédiques',
      href: '/tests'
    },
    {
      label: 'Clusters',
      value: stats.totalClusters,
      icon: Layers,
      color: 'from-indigo-500 to-indigo-600',
      detail: 'Groupes de tests',
      href: '/admin/clusters'
    },
  ]

  const managementActions = [
    {
      title: 'Zones anatomiques',
      description: 'Créer et placer les zones anatomiques sur le modèle 3D',
      icon: Box,
      href: '/admin/anatomy-builder',
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.totalZones} zones configurées`
    },
    {
      title: 'Pathologies',
      description: 'Gérer les pathologies et leurs associations aux tests',
      icon: Activity,
      href: '/admin/pathologies',
      color: 'from-red-500 to-red-600',
      stats: `${stats.totalPathologies} pathologies`
    },
    {
      title: 'Tests et Clusters',
      description: 'Gérer les tests individuels et les groupes de tests',
      icon: Clipboard,
      href: '/tests',
      color: 'from-orange-500 to-orange-600',
      stats: `${stats.totalTests} tests, ${stats.totalClusters} clusters`
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
                Centre de contrôle OsteoUpgrade
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* System Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Statistiques du système
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Box className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Zones anatomiques</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalZones}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Pathologies</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalPathologies}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clipboard className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Tests orthopédiques</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalTests}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Clusters de tests</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalClusters}</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-gray-400" />
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
              Accès rapide
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/anatomy-builder')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors"
              >
                <p className="font-medium">Zones anatomiques</p>
                <p className="text-sm text-purple-100">Placer sur le modèle 3D</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/pathologies')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors"
              >
                <p className="font-medium">Pathologies</p>
                <p className="text-sm text-purple-100">Lier aux tests et clusters</p>
              </button>
              
              <button
                onClick={() => router.push('/tests')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors"
              >
                <p className="font-medium">Tests et Clusters</p>
                <p className="text-sm text-purple-100">Gérer la bibliothèque</p>
              </button>
              
              <button
                onClick={() => router.push('/testing')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors"
              >
                <p className="font-medium">Prévisualiser</p>
                <p className="text-sm text-purple-100">Tester l'interface utilisateur</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
