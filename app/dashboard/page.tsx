'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  Clipboard,
  Activity,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  PlayCircle,
  FileText,
  Users,
  Crown,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    availableTrees: 0,
    totalTests: 0,
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
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

      // Get statistics
      const [sessionsResponse, treesResponse, testsResponse] = await Promise.all([
        // User sessions
        supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id),
        
        // Available trees based on role
        profileData?.role === 'admin' || profileData?.role === 'premium'
          ? supabase.from('decision_trees').select('*')
          : supabase.from('decision_trees').select('*').eq('is_free', true),
        
        // All tests (everyone can see them)
        supabase.from('orthopedic_tests').select('*')
      ])

      const completedCount = sessionsResponse.data?.filter(s => s.completed).length || 0
      
      setStats({
        totalSessions: sessionsResponse.data?.length || 0,
        completedSessions: completedCount,
        availableTrees: treesResponse.data?.length || 0,
        totalTests: testsResponse.data?.length || 0,
      })

      // Get recent sessions with tree names
      const recentSessionsData = sessionsResponse.data?.slice(0, 5) || []
      const sessionsWithTrees = await Promise.all(
        recentSessionsData.map(async (session) => {
          const { data: tree } = await supabase
            .from('decision_trees')
            .select('name')
            .eq('id', session.tree_id)
            .single()
          
          return {
            ...session,
            tree_name: tree?.name || 'Arbre inconnu'
          }
        })
      )
      
      setRecentSessions(sessionsWithTrees)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Nouveau diagnostic',
      description: 'Démarrer un arbre décisionnel',
      icon: PlayCircle,
      href: '/trees',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Tests orthopédiques',
      description: 'Consulter la base de tests',
      icon: Clipboard,
      href: '/tests',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Historique',
      description: 'Voir vos sessions passées',
      icon: Clock,
      href: '/history',
      color: 'from-purple-500 to-purple-600',
    },
  ]

  const statsCards = [
    {
      label: 'Sessions totales',
      value: stats.totalSessions,
      icon: Activity,
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Diagnostics terminés',
      value: stats.completedSessions,
      icon: Award,
      change: '+8%',
      trend: 'up',
    },
    {
      label: 'Arbres disponibles',
      value: stats.availableTrees,
      icon: TreePine,
      info: profile?.role === 'free' ? 'Version gratuite' : null,
    },
    {
      label: 'Tests disponibles',
      value: stats.totalTests,
      icon: FileText,
    },
  ]

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
                Bonjour, {profile?.full_name || 'Docteur'} 👋
              </h1>
              <p className="mt-1 text-gray-600">
                Voici un aperçu de votre activité sur OsteoUpgrade
              </p>
            </div>
            {profile?.role === 'free' && (
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 max-w-sm">
                <div className="flex items-start space-x-3">
                  <Crown className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Passez à Premium
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Accédez à tous les arbres décisionnels
                    </p>
                    <button
                      onClick={() => router.push('/settings')}
                      className="mt-2 text-xs font-medium text-yellow-700 hover:text-yellow-800"
                    >
                      En savoir plus →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    {stat.info && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {stat.info}
                      </p>
                    )}
                    {stat.change && (
                      <div className="flex items-center mt-2">
                        <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-xs ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} ce mois
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`bg-gradient-to-br ${action.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sessions récentes
                </h2>
                <button
                  onClick={() => router.push('/history')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Voir tout →
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentSessions.map((session, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        session.completed ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <TreePine className={`h-4 w-4 ${
                          session.completed ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.tree_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.completed ? 'Terminé' : 'En cours'}
                      </span>
                      {session.completed && session.diagnosis && (
                        <button className="text-primary-600 hover:text-primary-700">
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Quick Stats - Only for admins */}
        {profile?.role === 'admin' && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Zone Administration</h3>
                <p className="text-purple-100 text-sm mt-1">
                  Gérez les utilisateurs et le contenu
                </p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Accéder</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
