'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Users,
  TreePine,
  Clipboard,
  TrendingUp,
  Crown,
  Activity,
  Settings,
  Plus,
  ChevronRight,
  DollarSign,
  Calendar,
  Shield,
  Eye,
  Edit,
  BarChart,
  FileText
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalTrees: 0,
    totalTests: 0,
    totalSessions: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
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
      
      // Get recent users
      const recentProfiles = profiles?.slice(0, 3).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || []

      // Get other statistics
      const [treesResponse, testsResponse, sessionsResponse] = await Promise.all([
        supabase.from('decision_trees').select('*'),
        supabase.from('orthopedic_tests').select('*'),
        supabase.from('user_sessions').select('*')
      ])

      // Get recent sessions with details
      const recentSessionsData = sessionsResponse.data?.slice(0, 3).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || []

      // Calculate monthly active users
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const activeUserIds = new Set(
        sessionsResponse.data?.filter(s => 
          new Date(s.created_at) > thirtyDaysAgo
        ).map(s => s.user_id)
      )

      setStats({
        totalUsers: profiles?.length || 0,
        freeUsers: freeCount,
        premiumUsers: premiumCount,
        totalTrees: treesResponse.data?.length || 0,
        totalTests: testsResponse.data?.length || 0,
        totalSessions: sessionsResponse.data?.length || 0,
        monthlyRevenue: premiumCount * 29.99,
        activeUsers: activeUserIds.size,
      })
      
      setRecentUsers(recentProfiles)
      setRecentSessions(recentSessionsData)
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
      label: 'Arbres',
      value: stats.totalTrees,
      icon: TreePine,
      color: 'from-purple-500 to-purple-600',
      detail: 'Arbres décisionnels',
      href: '/admin/trees'
    },
    {
      label: 'Tests',
      value: stats.totalTests,
      icon: Clipboard,
      color: 'from-green-500 to-green-600',
      detail: 'Tests orthopédiques',
      href: '/admin/tests'
    },
    {
      label: 'Sessions',
      value: stats.totalSessions,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      detail: `${stats.activeUsers} utilisateurs actifs`,
      href: null
    },
  ]

  const managementActions = [
    {
      title: 'Arbres décisionnels',
      description: 'Gérer tous les arbres',
      icon: TreePine,
      href: '/admin/trees',
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.totalTrees} arbres`,
      actions: [
        { label: 'Voir tous', href: '/admin/trees' },
        { label: 'Créer', href: '/admin/trees/new' }
      ]
    },
    {
      title: 'Tests orthopédiques',
      description: 'Gérer la base de tests',
      icon: Clipboard,
      href: '/admin/tests',
      color: 'from-green-500 to-green-600',
      stats: `${stats.totalTests} tests`,
      actions: [
        { label: 'Voir tous', href: '/admin/tests' },
        { label: 'Créer', href: '/admin/tests/new' }
      ]
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer les comptes',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600',
      stats: `${stats.totalUsers} utilisateurs`,
      actions: [
        { label: 'Voir tous', href: '/admin/users' },
        { label: 'Export CSV', href: '#' }
      ]
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex items-start space-x-4">
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
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {action.stats}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    {action.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => act.href !== '#' && router.push(act.href)}
                        className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
                      >
                        {i === 0 ? <Eye className="h-3 w-3" /> : i === 1 ? <Plus className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Utilisateurs récents
                </h2>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Voir tous →
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentUsers.map((user, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        user.role === 'admin' ? 'bg-purple-600' :
                        user.role === 'premium' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}>
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'premium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Statistiques système
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Utilisateurs actifs (30j)</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.activeUsers}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Sessions totales</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalSessions}</span>
              </div>
              
              <div className="flex items-center justify-between">
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Revenu par utilisateur</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.totalUsers > 0 
                    ? (stats.monthlyRevenue / stats.totalUsers).toFixed(2)
                    : '0.00'}€
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
