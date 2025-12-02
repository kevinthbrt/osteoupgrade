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
  AlertCircle,
  BookOpen,
  Calendar,
  Map
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

  const isFree = profile?.role === 'free'

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
        supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id),

        profileData?.role === 'admin' || profileData?.role === 'premium'
          ? supabase.from('decision_trees').select('*').eq('is_active', true)
          : Promise.resolve({ data: [], error: null }),

        supabase.from('orthopedic_tests').select('*')
      ])

      const completedCount = sessionsResponse.data?.filter(s => s.completed).length || 0
      
      setStats({
        totalSessions: sessionsResponse.data?.length || 0,
        completedSessions: completedCount,
        availableTrees: treesResponse?.data?.length || 0,
        totalTests: testsResponse.data?.length || 0,
      })

      // Get recent sessions with tree names
      const recentSessionsData = sessionsResponse.data?.slice(0, 5) || []
      const sessionsWithTrees = await Promise.all(
        recentSessionsData.map(async (session) => {
          if (!session.tree_id) {
            return {
              ...session,
              tree_name: 'Arbre non spécifié'
            }
          }

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

  const quickActions = isFree
    ? [
        {
          title: 'Découvrir le mode Premium',
          description: 'Accès complet pour 50€/mois (facturé annuellement)',
          icon: Crown,
          href: '/settings',
          color: 'from-yellow-500 to-amber-500'
        },
        {
          title: 'Consultation guidée',
          description: 'En pré-lancement — réservé aux administrateurs',
          icon: Map,
          href: '/consultation-v3',
          color: 'from-blue-500 to-blue-600',
          disabled: true
        },
        {
          title: 'Guides topographiques',
          description: 'Accès E-learning Premium avec diag par zones',
          icon: BookOpen,
          href: '/elearning',
          color: 'from-green-500 to-emerald-600',
          disabled: true
        }
      ]
    : [
        {
          title: 'Nouveau diagnostic',
          description: 'Démarrer un arbre décisionnel',
          icon: PlayCircle,
          href: '/trees',
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'E-learning topographique',
          description: 'Guides premium par zones anatomiques',
          icon: BookOpen,
          href: '/elearning',
          color: 'from-green-500 to-emerald-600',
        },
        {
          title: 'Séminaires présentiels',
          description: '2 formations/an incluses avec votre abonnement',
          icon: Calendar,
          href: '/seminaires',
          color: 'from-purple-500 to-indigo-600',
        }
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
      info: profile?.role === 'free' ? 'Réservé aux membres Premium' : null,
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

        {!profile?.full_name && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Complétez votre profil</p>
              <p className="text-xs text-gray-700 mt-1">Ajoutez votre nom pour personnaliser vos documents et vos certificats de formation.</p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Renseigner mon nom →
            </button>
          </div>
        )}

        {isFree && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/80">Accès Premium</p>
                <h2 className="text-2xl font-bold mt-1">50€/mois — facturation annuelle</h2>
                <p className="text-white/90 mt-2 max-w-2xl">
                  Passez au niveau supérieur avec l'ensemble des arbres décisionnels, l'e-learning topographique et 2 formations en présentiel par an avec Gérald Stoppini et Kevin Thubert incluses.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="bg-white/10 px-4 py-3 rounded-lg text-sm">
                  <div className="font-semibold">Formations incluses</div>
                  <div className="text-white/90">2 séminaires par an en présentiel</div>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="bg-white text-amber-600 px-5 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
                >
                  Je passe Premium
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-dashed border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Consultation guidée</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">Bientôt</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Navigation interactive pour structurer vos décisions cliniques. Disponible en avant-première pour les administrateurs.</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Accès actuel</span>
              <span className={`font-semibold ${profile?.role === 'admin' ? 'text-green-600' : 'text-gray-400'}`}>
                {profile?.role === 'admin' ? 'Administrateur' : 'En attente de lancement'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Guides topographiques</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">E-learning</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Accès aux guides de diagnostic topographique, structurés par zones pour vos révisions cliniques.</p>
            <button
              onClick={() => profile?.role === 'free' ? alert('Les guides sont réservés aux abonnés Premium') : router.push('/elearning')}
              className={`text-sm font-semibold ${profile?.role === 'free' ? 'text-emerald-400' : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              {profile?.role === 'free' ? 'Réservé Premium' : 'Ouvrir les guides →'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Séminaires présentiels</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">2/an</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Rencontrez Gérald Stoppini et Kevin Thubert lors des sessions exclusives réservées aux membres Premium.</p>
            <button
              onClick={() => profile?.role === 'free' ? alert('Les séminaires sont inclus dans l’offre Premium') : router.push('/seminaires')}
              className={`text-sm font-semibold ${profile?.role === 'free' ? 'text-purple-400' : 'text-purple-700 hover:text-purple-800'}`}
            >
              {profile?.role === 'free' ? 'Inclus avec Premium' : 'Voir le calendrier →'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => {
                  if (action.disabled) {
                    alert('Cette action sera disponible avec l\'offre Premium ou lors du lancement officiel')
                    return
                  }
                  router.push(action.href)
                }}
                className={`bg-white rounded-xl shadow-sm p-6 transition-all group ${
                  action.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'
                }`}
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
