'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TestTube,
  BookOpen,
  Settings,
  Crown,
  AlertCircle,
  Calendar,
  Map,
  Dumbbell,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  Users,
  Shield,
  Mail,
  Clipboard,
  FolderOpen,
  Box,
  Activity,
  Filter,
  GraduationCap,
  TrendingUp,
  Target,
  Star
} from 'lucide-react'

interface ModuleCard {
  title: string
  description: string
  icon: any
  href: string
  gradient: string
  badge?: string
  badgeColor?: string
  roles?: string[]
  category: 'main' | 'premium' | 'gold' | 'admin'
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    completionRate: 0,
    streak: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfile({ role: 'free', full_name: 'Invité' })
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Get simple stats
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)

      if (sessionsData) {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const weekSessions = sessionsData.filter((s: any) =>
          new Date(s.created_at) >= weekAgo
        ).length

        const completedSessions = sessionsData.filter((s: any) => s.completed).length
        const completionRate = sessionsData.length > 0
          ? Math.round((completedSessions / sessionsData.length) * 100)
          : 0

        // Calculate streak
        const sessionDates = sessionsData
          .map((s: any) => new Date(s.created_at).toDateString())
          .sort()
        const uniqueDates = [...new Set(sessionDates)].reverse()
        let streak = 0
        let currentDate = new Date()
        for (const dateStr of uniqueDates) {
          const sessionDate = new Date(dateStr)
          const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff <= streak + 1) {
            streak++
            currentDate = sessionDate
          } else {
            break
          }
        }

        setStats({
          totalSessions: weekSessions,
          completionRate,
          streak
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFree = profile?.role === 'free'
  const isPremiumOrAdmin = ['premium', 'premium_silver', 'premium_gold', 'admin'].includes(profile?.role)
  const isPremiumGoldOrAdmin = ['premium', 'premium_gold', 'admin'].includes(profile?.role)
  const isAdmin = profile?.role === 'admin'

  const modules: ModuleCard[] = [
    // Main modules
    {
      title: 'Testing 3D',
      description: 'Explorez l\'anatomie en 3D et réalisez des tests orthopédiques interactifs sur un modèle anatomique complet.',
      icon: TestTube,
      href: '/testing',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      badge: 'Premium',
      badgeColor: 'bg-purple-100 text-purple-700',
      roles: ['premium_silver', 'premium_gold', 'admin'],
      category: 'premium'
    },
    {
      title: 'Topographie',
      description: 'Accédez aux guides topographiques pour simplifier votre raisonnement clinique région par région.',
      icon: Map,
      href: '/topographie',
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      badge: 'Premium',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      roles: ['premium_silver', 'premium_gold', 'admin'],
      category: 'premium'
    },
    {
      title: 'Exercices',
      description: 'Bibliothèque complète d\'exercices thérapeutiques pour vos patients, organisée par région anatomique.',
      icon: Dumbbell,
      href: '/exercices',
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      badge: 'Premium',
      badgeColor: 'bg-orange-100 text-orange-700',
      roles: ['premium_silver', 'premium_gold', 'admin'],
      category: 'premium'
    },
    {
      title: 'E-learning',
      description: 'Formations professionnelles en ligne via System.io : développez vos compétences à votre rythme.',
      icon: GraduationCap,
      href: '/elearning',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      badge: 'Premium',
      badgeColor: 'bg-blue-100 text-blue-700',
      roles: ['premium_silver', 'premium_gold', 'admin'],
      category: 'premium'
    },
    {
      title: 'Pratique',
      description: 'Module de pratique clinique pour affiner vos techniques et votre raisonnement thérapeutique.',
      icon: Stethoscope,
      href: '/pratique',
      gradient: 'from-pink-500 via-pink-600 to-rose-600',
      badge: 'Premium',
      badgeColor: 'bg-pink-100 text-pink-700',
      roles: ['premium_silver', 'premium_gold', 'admin'],
      category: 'premium'
    },
    {
      title: 'Séminaires présentiels',
      description: 'Inscrivez-vous aux séminaires en présentiel (2 jours) inclus dans votre abonnement Premium Gold.',
      icon: Calendar,
      href: '/seminaires',
      gradient: 'from-amber-500 via-amber-600 to-yellow-600',
      badge: 'Premium Gold',
      badgeColor: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
      roles: ['premium_gold', 'admin'],
      category: 'gold'
    },
    {
      title: 'Tests Orthopédiques',
      description: 'Base de données complète des tests orthopédiques organisés par régions anatomiques avec vidéos.',
      icon: Clipboard,
      href: '/tests',
      gradient: 'from-slate-500 via-slate-600 to-gray-600',
      badge: 'Admin',
      badgeColor: 'bg-slate-100 text-slate-700',
      roles: ['admin'],
      category: 'admin'
    },
    {
      title: 'Consultation guidée V3',
      description: 'Système de consultation guidée avec arbres décisionnels pour un raisonnement clinique optimal.',
      icon: Map,
      href: '/consultation-v3',
      gradient: 'from-indigo-500 via-indigo-600 to-purple-600',
      badge: 'Bientôt',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      roles: ['admin'],
      category: 'admin'
    }
  ]

  const adminModules: ModuleCard[] = [
    {
      title: 'Vue d\'ensemble Admin',
      description: 'Tableau de bord administrateur avec statistiques système et gestion globale.',
      icon: Shield,
      href: '/admin',
      gradient: 'from-purple-500 via-purple-600 to-violet-600',
      category: 'admin'
    },
    {
      title: 'Gestion Utilisateurs',
      description: 'Gérez les utilisateurs, leurs rôles et leurs abonnements.',
      icon: Users,
      href: '/admin/users',
      gradient: 'from-violet-500 via-violet-600 to-purple-600',
      category: 'admin'
    },
    {
      title: 'Diagnostics',
      description: 'Gestion des dossiers diagnostics avec tests, photos et signes cliniques.',
      icon: FolderOpen,
      href: '/admin/diagnostics',
      gradient: 'from-sky-500 via-sky-600 to-blue-600',
      badge: 'Nouveau',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      category: 'admin'
    },
    {
      title: 'Anatomy Builder',
      description: 'Positionnement des zones 3D pour le module Testing 3D.',
      icon: Box,
      href: '/admin/anatomy-builder',
      gradient: 'from-cyan-500 via-cyan-600 to-teal-600',
      badge: '3D',
      badgeColor: 'bg-cyan-100 text-cyan-700',
      category: 'admin'
    },
    {
      title: 'Pathologies',
      description: 'Gestion des pathologies et diagnostics simples.',
      icon: Activity,
      href: '/admin/pathologies',
      gradient: 'from-red-500 via-red-600 to-rose-600',
      category: 'admin'
    },
    {
      title: 'Zones Topographiques',
      description: 'Configuration des zones topographiques pour la Consultation V3.',
      icon: Map,
      href: '/admin/topographic-zones',
      gradient: 'from-teal-500 via-teal-600 to-emerald-600',
      badge: 'V3',
      badgeColor: 'bg-teal-100 text-teal-700',
      category: 'admin'
    },
    {
      title: 'Arbres Décisionnels',
      description: 'Création et gestion des arbres décisionnels pour la Consultation V3.',
      icon: Filter,
      href: '/admin/decision-trees',
      gradient: 'from-lime-500 via-lime-600 to-green-600',
      badge: 'V3',
      badgeColor: 'bg-lime-100 text-lime-700',
      category: 'admin'
    },
    {
      title: 'Mailing & Newsletter',
      description: 'Gestion des campagnes email, automation et relances utilisateurs.',
      icon: Mail,
      href: '/admin/mailing',
      gradient: 'from-fuchsia-500 via-fuchsia-600 to-pink-600',
      badge: 'Nouveau',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      category: 'admin'
    }
  ]

  const canAccessModule = (module: ModuleCard) => {
    if (!module.roles) return true
    if (!profile?.role) return false
    return module.roles.includes(profile.role)
  }

  const getVisibleModules = () => {
    return modules.filter(m => m.category !== 'admin')
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl mb-8">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative px-8 py-12 md:px-12 md:py-16">
            <div className="max-w-4xl">
              {/* Welcome badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 mb-6 border border-white/20">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <span className="text-sm font-semibold text-sky-100">
                  Bienvenue sur OsteoUpgrade
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-100">
                Bonjour, {profile?.full_name || 'Docteur'} 👋
              </h1>

              <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
                Votre plateforme de raisonnement clinique nouvelle génération.
                Explorez nos modules pour développer vos compétences et optimiser votre pratique.
              </p>

              {/* Quick stats */}
              {stats.totalSessions > 0 && (
                <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 text-sky-300 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Cette semaine</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalSessions}</p>
                    <p className="text-sm text-slate-300 mt-1">Sessions</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <Target className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Complétion</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.completionRate}%</p>
                    <p className="text-sm text-slate-300 mt-1">Taux</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 text-amber-300 mb-2">
                      <Star className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Série</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.streak}</p>
                    <p className="text-sm text-slate-300 mt-1">Jours actifs</p>
                  </div>
                </div>
              )}

              {/* User status */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Statut :</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
                    profile?.role === 'admin'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                      : profile?.role === 'premium_gold'
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                        : profile?.role === 'premium_silver'
                          ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-slate-800'
                          : 'bg-white/20'
                  }`}>
                    {(profile?.role === 'premium_gold' || profile?.role === 'premium_silver') && <Crown className="h-4 w-4" />}
                    {profile?.role === 'admin' && <Shield className="h-4 w-4" />}
                    {profile?.role === 'admin'
                      ? 'Administrateur'
                      : profile?.role === 'premium_gold'
                        ? 'Premium Gold'
                        : profile?.role === 'premium_silver'
                          ? 'Premium Silver'
                          : 'Gratuit'}
                  </span>
                </div>

                <button
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm font-semibold"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile completion alert */}
        {!profile?.full_name && (
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-5 shadow-sm mb-8">
            <AlertCircle className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Complétez votre profil</p>
              <p className="mt-1 text-xs text-slate-700">
                Ajoutez votre nom pour personnaliser vos documents et certificats de formation.
              </p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              Compléter
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Premium CTA for free users */}
        {isFree && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 p-8 mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:30px_30px]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/30 backdrop-blur-sm px-3 py-1 mb-4">
                    <Crown className="h-4 w-4 text-white" />
                    <span className="text-sm font-bold text-white">Offre Premium</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Débloquez tout le potentiel d'OsteoUpgrade
                  </h2>

                  <p className="text-lg text-white/90 mb-6 max-w-2xl">
                    Accédez à tous les modules, au Testing 3D, à l'e-learning et aux séminaires présentiels.
                    À partir de 29,99€/mois.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Testing 3D illimité</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Tous les modules</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">E-learning complet</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">1 séminaire/an (Gold)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/settings/subscription')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl transition-all transform hover:scale-105"
                  >
                    Passer Premium maintenant
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules Section */}
        <div className="space-y-10">
          {/* Main Modules */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Modules principaux
              </h2>
              <p className="text-slate-600">
                Explorez nos outils cliniques pour optimiser votre pratique quotidienne
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getVisibleModules().map((module) => {
                const hasAccess = canAccessModule(module)
                const Icon = module.icon

                return (
                  <button
                    key={module.href}
                    onClick={() => {
                      if (!hasAccess) {
                        if (isFree) {
                          router.push('/settings/subscription')
                        } else {
                          alert('Accès réservé aux membres Premium Gold')
                        }
                        return
                      }
                      router.push(module.href)
                    }}
                    className={`group relative overflow-hidden rounded-2xl bg-white border-2 p-6 text-left shadow-lg transition-all duration-300 ${
                      hasAccess
                        ? 'border-transparent hover:shadow-2xl hover:-translate-y-1'
                        : 'border-dashed border-slate-300 opacity-75'
                    }`}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                    {/* Lock overlay for restricted modules */}
                    {!hasAccess && (
                      <div className="absolute top-4 right-4 bg-slate-100 rounded-full p-2">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                    )}

                    {/* Badge */}
                    {module.badge && (
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${module.badgeColor}`}>
                          {module.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} mb-4 shadow-lg transform transition-transform group-hover:scale-110`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 transition-all">
                      {module.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {module.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-900 transition-colors">
                      <span className="text-sm font-semibold">
                        {hasAccess ? 'Accéder au module' : 'Passer Premium'}
                      </span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Admin Modules */}
          {isAdmin && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Administration
                  </h2>
                </div>
                <p className="text-slate-600">
                  Gérez le contenu, les utilisateurs et les paramètres de la plateforme
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {adminModules.map((module) => {
                  const Icon = module.icon

                  return (
                    <button
                      key={module.href}
                      onClick={() => router.push(module.href)}
                      className="group relative overflow-hidden rounded-2xl bg-white border-2 border-transparent hover:border-purple-200 p-6 text-left shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                      {/* Badge */}
                      {module.badge && (
                        <div className="absolute top-4 right-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${module.badgeColor}`}>
                            {module.badge}
                          </span>
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} mb-4 shadow-lg transform transition-transform group-hover:scale-110`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {module.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {module.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips Section */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Conseils pour bien démarrer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-100">
                    <TestTube className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Testing 3D</p>
                    <p className="text-xs text-slate-600">Commencez par explorer le modèle 3D pour vous familiariser avec les zones anatomiques</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Map className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Topographie</p>
                    <p className="text-xs text-slate-600">Utilisez les guides topographiques pour structurer votre raisonnement clinique</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">E-learning</p>
                    <p className="text-xs text-slate-600">Suivez les formations en ligne pour approfondir vos connaissances théoriques</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Séminaires</p>
                    <p className="text-xs text-slate-600">Réservez votre place pour les séminaires présentiels (Premium Gold)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
