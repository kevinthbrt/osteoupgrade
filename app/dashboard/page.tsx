'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { formatCycleWindow, getCurrentSubscriptionCycle, isDateWithinCycle } from '@/utils/subscriptionCycle'
import {
  TreePine,
  Clipboard,
  ChevronRight,
  FileText,
  Users,
  Settings,
  Crown,
  AlertCircle,
  BookOpen,
  Calendar,
  Map,
  MapPin,
  TestTube,
  TrendingUp,
  Activity,
  Award,
  Target,
  Clock,
  BarChart3,
  Zap,
  Star,
  Brain,
  CheckCircle2
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Seminar {
  id: string
  title: string
  date: string
  location: string
  theme: string | null
  facilitator: string | null
}

interface ActivityData {
  day: string
  sessions: number
  tests: number
}

interface ModuleUsage {
  name: string
  count: number
  color: string
}

interface Stats {
  totalSessions: number
  totalTests: number
  weekSessions: number
  avgDuration: number
  completionRate: number
  streak: number
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [registrations, setRegistrations] = useState<{ id: string; seminar_id: string; registeredAt: string }[]>([])
  const [seminarLoadError, setSeminarLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalTests: 0,
    weekSessions: 0,
    avgDuration: 0,
    completionRate: 0,
    streak: 0
  })
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [moduleUsage, setModuleUsage] = useState<ModuleUsage[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const isFree = profile?.role === 'free'

  const loadDashboardData = async () => {
    const fallbackSeminars: Seminar[] = [
      {
        id: 'fallback-1',
        title: 'Séminaire clinique - Membres supérieurs',
        date: '2025-04-18',
        location: 'Lyon',
        theme: 'Épaule & coude : trajectoires décisionnelles',
        facilitator: 'Gérald Stoppini'
      },
      {
        id: 'fallback-2',
        title: 'Rachis et chaînes fasciales',
        date: '2025-06-12',
        location: 'Bordeaux',
        theme: 'Rachis lombaire et thoracique - cas complexes',
        facilitator: 'Kevin Thubert'
      }
    ]

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Mode démo : permettre d'accéder au tableau de bord sans session active
        setProfile({ role: 'free', full_name: 'Invité' })
      }

      // Get user profile
      const { data: profileData } = user
        ? await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        : { data: null }

      if (profileData) {
        setProfile(profileData)
      }

      // Get statistics + catalogue
      const [sessionsResponse, seminarsResponse] = await Promise.all([
        user
          ? supabase
              .from('user_sessions')
              .select('*')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [], error: null }),

        supabase
          .from('seminars')
          .select('*')
          .order('date', { ascending: true })
      ])

      // Get seminar calendar
      if (seminarsResponse.error) {
        setSeminarLoadError('Affichage en mode démo : la table des séminaires est absente ou inaccessible.')
        setSeminars(fallbackSeminars)
      } else {
        setSeminars((seminarsResponse.data as Seminar[]) || fallbackSeminars)
      }

      if (user) {
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('seminar_registrations')
          .select('*')
          .eq('user_id', user.id)

        if (!registrationsError && registrationsData) {
          setRegistrations(
            registrationsData.map((registration: any) => ({
              id: registration.id,
              seminar_id: registration.seminar_id,
              registeredAt: registration.registered_at || registration.created_at
            }))
          )
        }
      }

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

      // Calculate statistics
      if (user && sessionsResponse.data) {
        const allSessions = sessionsResponse.data
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Week sessions
        const weekSessions = allSessions.filter((s: any) =>
          new Date(s.created_at) >= weekAgo
        ).length

        // Completion rate
        const completedSessions = allSessions.filter((s: any) => s.completed).length
        const completionRate = allSessions.length > 0
          ? Math.round((completedSessions / allSessions.length) * 100)
          : 0

        // Calculate streak (consecutive days with activity)
        const sessionDates = allSessions
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
          totalSessions: allSessions.length,
          totalTests: allSessions.reduce((acc: number, s: any) => acc + (s.tests_count || 0), 0),
          weekSessions,
          avgDuration: 0,
          completionRate,
          streak
        })

        // Activity data for last 7 days
        const activityMap = new Map<string, { sessions: number; tests: number }>()
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayKey = days[date.getDay()]
          activityMap.set(dayKey, { sessions: 0, tests: 0 })
        }

        allSessions.forEach((session: any) => {
          const sessionDate = new Date(session.created_at)
          if (sessionDate >= weekAgo) {
            const dayKey = days[sessionDate.getDay()]
            const current = activityMap.get(dayKey)
            if (current) {
              current.sessions++
              current.tests += session.tests_count || 0
            }
          }
        })

        const activityArray: ActivityData[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayKey = days[date.getDay()]
          const data = activityMap.get(dayKey) || { sessions: 0, tests: 0 }
          activityArray.push({
            day: dayKey,
            sessions: data.sessions,
            tests: data.tests
          })
        }
        setActivityData(activityArray)

        // Module usage
        const treeUsage = new Map<string, number>()
        for (const session of sessionsWithTrees) {
          const treeName = session.tree_name
          treeUsage.set(treeName, (treeUsage.get(treeName) || 0) + 1)
        }

        const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
        const moduleArray: ModuleUsage[] = Array.from(treeUsage.entries())
          .map(([name, count], index) => ({
            name,
            count,
            color: colors[index % colors.length]
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setModuleUsage(moduleArray)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentCycle = useMemo(
    () => getCurrentSubscriptionCycle(profile?.subscription_start_date || profile?.created_at),
    [profile?.subscription_start_date, profile?.created_at]
  )
  const cycleRegistrations = registrations.filter((registration) =>
    isDateWithinCycle(registration.registeredAt, currentCycle)
  )
  const remainingSeminars = Math.max(0, 1 - cycleRegistrations.length)
  const isPremiumOrAdmin = profile?.role === 'premium' || profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'
  const isPremiumGoldOrAdmin = profile?.role === 'premium' || profile?.role === 'premium_gold' || profile?.role === 'admin'

  const handleRegister = async (id: string) => {
    if (!isPremiumGoldOrAdmin) {
      alert('Inscription réservée aux membres Premium Gold')
      return
    }

    if (remainingSeminars <= 0) {
      alert("Vous avez atteint la limite d'un séminaire (2 jours) pour votre cycle en cours")
      return
    }

    if (!profile?.id) {
      alert('Connectez-vous pour vous inscrire')
      return
    }

    const payload = {
      seminar_id: id,
      user_id: profile.id,
      registered_at: new Date().toISOString()
    }

    const { error } = await supabase.from('seminar_registrations').insert(payload)

    if (error) {
      console.warn('Inscription enregistrée en local faute de table Supabase :', error.message)
    }

    setRegistrations((prev) => [...prev, { id: `${Date.now()}`, seminar_id: id, registeredAt: payload.registered_at }])
    alert('Inscription confirmée !')
  }

  const featureBlocks = [
    {
      title: 'Topographie — Guides topographiques',
      description: "Simplifiez votre raisonnement grâce à l'aide topographique",
      icon: BookOpen,
      href: '/topographie',
      color: 'from-green-500 to-emerald-600',
      roles: ['premium_silver', 'premium_gold', 'admin'] as const,
    },
    {
      title: 'Démarrer le Testing 3D',
      description: 'Exploration biomécanique avancée en 3D (Premium).',
      icon: TestTube,
      href: '/testing',
      color: 'from-purple-500 to-indigo-600',
      roles: ['premium_silver', 'premium_gold', 'admin'] as const,
    },
    {
      title: 'E-learning System.io',
      description: 'Accédez à toutes nos formations professionnelles en ligne.',
      icon: BookOpen,
      href: '/elearning',
      color: 'from-blue-500 to-cyan-600',
      roles: ['premium_silver', 'premium_gold', 'admin'] as const,
      badge: 'Nouveau',
    },
    {
      title: 'Consultation guidée',
      description: 'Teaser de la version V3 réservée aux administrateurs.',
      icon: Map,
      href: '/consultation-v3',
      color: 'from-orange-500 to-red-500',
      roles: ['admin'] as const,
      badge: 'Bientôt',
    },
  ];

  // Loading state with consistent layout wrapper
  // Ensures JSX stays scoped correctly for SWC parsing
  const loadingView = (
    <AuthLayout>
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    </AuthLayout>
  );

  if (loading) {
    return loadingView;
  }

  return (
    <AuthLayout>
      <div className="relative">
        <div className="absolute inset-x-0 -top-10 h-48 bg-gradient-to-b from-sky-50 to-transparent" aria-hidden />
        <div className="absolute right-10 top-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" aria-hidden />
        <div className="absolute left-6 top-32 h-28 w-28 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />

        <div className="space-y-8 relative z-10">
          {/* Header */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-xl border border-white/10">
            <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] items-center">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Vue d'ensemble
                </p>
                <h1 className="text-3xl font-bold leading-tight">
                  Bonjour, {profile?.full_name || 'Docteur'} 👋
                </h1>
                <p className="text-slate-200 text-sm md:text-base">
                  Continuez vos explorations cliniques et vos formations. Les accès clés sont à portée de clic.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => router.push('/testing')}
                    className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
                  >
                    <TestTube className="h-4 w-4" />
                    Tester en 3D
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </button>
                </div>
              </div>

              {profile?.role === 'free' ? (
                <div className="relative h-full w-full rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500/90 p-4 text-slate-900 shadow-lg">
                  <div className="absolute inset-0 rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden />
                  <div className="relative space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Crown className="h-4 w-4" /> Premium
                    </div>
                    <h3 className="text-xl font-bold">Passez à Premium</h3>
                    <p className="text-sm text-slate-800">
                      Accédez à tous les arbres décisionnels, au testing 3D et à votre séminaire présentiel inclus.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-amber-900">
                      <span className="rounded-full bg-white/80 px-3 py-1">Arbres illimités</span>
                      <span className="rounded-full bg-white/80 px-3 py-1">1 séminaire / cycle</span>
                    </div>
                    <button
                      onClick={() => router.push('/settings/subscription')}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                    >
                      Découvrir l'offre
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-200">Statut</p>
                      <p className="text-lg font-semibold">
                        {profile?.role === 'admin'
                          ? 'Administrateur'
                          : profile?.role === 'premium_gold'
                            ? 'Premium Gold'
                            : profile?.role === 'premium_silver'
                              ? 'Premium Silver'
                              : 'Gratuit'}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">Actif</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    {profile?.role === 'premium_gold' || profile?.role === 'admin'
                      ? 'Profitez des ressources complètes : topographie, testing 3D, e-learning et séminaires présentiels.'
                      : profile?.role === 'premium_silver'
                        ? 'Profitez de tout le contenu en ligne : topographie, testing 3D et e-learning.'
                        : 'Profitez des ressources complètes en passant Premium.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

        {!profile?.full_name && (
          <div className="flex items-start space-x-3 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-4 shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 text-sky-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Complétez votre profil</p>
              <p className="mt-1 text-xs text-slate-700">Ajoutez votre nom pour personnaliser vos documents et vos certificats de formation.</p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              Renseigner mon nom →
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        {stats.totalSessions > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition group-hover:opacity-20">
                <Activity className="h-16 w-16 text-sky-500" />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-600">Sessions cette semaine</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.weekSessions}</p>
                <div className="mt-2 flex items-center text-xs">
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-600" />
                  <span className="font-semibold text-emerald-600">+{Math.round((stats.weekSessions / Math.max(stats.totalSessions, 1)) * 100)}%</span>
                  <span className="ml-1 text-slate-500">du total</span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition group-hover:opacity-20">
                <Target className="h-16 w-16 text-purple-500" />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-600">Taux de complétion</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.completionRate}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition group-hover:opacity-20">
                <Zap className="h-16 w-16 text-amber-500" />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-600">Série de jours actifs</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.streak}</p>
                <div className="mt-2 flex items-center text-xs">
                  <Star className="mr-1 h-3 w-3 text-amber-600" />
                  <span className="font-semibold text-amber-600">
                    {stats.streak >= 7 ? 'Excellent !' : stats.streak >= 3 ? 'Bon rythme' : 'Continuez !'}
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition group-hover:opacity-20">
                <Award className="h-16 w-16 text-emerald-500" />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-600">Tests réalisés</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalTests}</p>
                <div className="mt-2 flex items-center text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                  <span className="font-semibold text-emerald-600">
                    {stats.totalSessions} sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Chart & Module Usage */}
        {(activityData.length > 0 || moduleUsage.length > 0) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Activity Chart */}
            {activityData.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Activité de la semaine</h3>
                    <p className="text-sm text-slate-600">Sessions et tests des 7 derniers jours</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 p-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#colorSessions)"
                      name="Sessions"
                    />
                    <Area
                      type="monotone"
                      dataKey="tests"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorTests)"
                      name="Tests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Module Usage */}
            {moduleUsage.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Modules les plus utilisés</h3>
                    <p className="text-sm text-slate-600">Répartition de vos sessions par module</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-3">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={moduleUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {moduleUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {moduleUsage.map((module, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: module.color }}
                      />
                      <span className="text-xs text-slate-600 truncate">{module.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {stats.totalSessions > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recommandations personnalisées</h3>
                <p className="text-sm text-slate-600">Basées sur votre activité récente</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stats.weekSessions < 3 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Restez régulier</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Essayez de faire au moins 3 sessions par semaine pour progresser efficacement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {stats.completionRate < 70 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Terminez vos sessions</p>
                      <p className="mt-1 text-xs text-purple-700">
                        Complétez vos sessions pour maximiser votre apprentissage et traçabilité.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {moduleUsage.length < 3 && isPremiumOrAdmin && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-sky-900">Explorez d'autres modules</p>
                      <p className="mt-1 text-xs text-sky-700">
                        Diversifiez votre pratique en explorant les différents modules anatomiques.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {stats.streak >= 7 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Bravo pour votre régularité !</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        Vous avez une série de {stats.streak} jours. Continuez comme ça !
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isFree && remainingSeminars > 0 && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Séminaire disponible</p>
                      <p className="mt-1 text-xs text-indigo-700">
                        Vous pouvez encore vous inscrire à un séminaire pour ce cycle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {profile?.role === 'free' && (
                <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Passez Premium</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Débloquez tous les modules et accédez aux séminaires présentiels.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isFree && (
          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Accès Premium</p>
                <h2 className="text-2xl font-bold text-slate-900">50€/mois — facturation annuelle</h2>
                <p className="text-sm text-slate-700 max-w-3xl">
                  Passez au niveau supérieur avec l'ensemble des arbres décisionnels, l'e-learning topographique et un séminaire présentiel de 2 jours inclus par cycle annuel depuis votre souscription.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-amber-800">
                  <span className="rounded-full bg-amber-100 px-3 py-1">Testing 3D illimité</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1">Arbres décisionnels complets</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1">Séminaire offert</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-white px-4 py-3 text-left text-sm shadow-sm">
                  <div className="font-semibold text-slate-900">Formations incluses</div>
                  <div className="text-slate-600">1 séminaire (2 jours) par cycle</div>
                </div>
                <button
                  onClick={() => router.push('/settings/subscription')}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                  Je passe Premium
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Séminaires présentiels */}
        <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
                <Calendar className="h-5 w-5" />
                Séminaires présentiels
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Calendrier visible par tous</h2>
              <p className="text-sm text-slate-600">Les inscriptions sont réservées aux membres Premium disposant encore de leur séminaire annuel en cours de validité.</p>
            </div>
            <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              {cycleRegistrations.length}/1 inscription — cycle {formatCycleWindow(currentCycle)}
            </div>
          </div>

          {seminarLoadError && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4" />
              {seminarLoadError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {seminars.map((seminar) => {
              const alreadyRegistered = registrations.some((registration) => registration.seminar_id === seminar.id)
              const isPast = new Date(seminar.date) < new Date()
              const locked = !isPremiumOrAdmin
              const disabled = locked || alreadyRegistered || remainingSeminars <= 0 || isPast

              return (
                <div key={seminar.id} className="relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200">
                  <div className="absolute right-2 top-2 h-16 w-16 rounded-full bg-sky-200/30 blur-3xl" aria-hidden />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">{new Date(seminar.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <h3 className="font-semibold text-slate-900">{seminar.title}</h3>
                      <p className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-sky-600" />
                        {seminar.location}
                      </p>
                      {seminar.theme && <p className="text-xs text-slate-600">{seminar.theme}</p>}
                      {seminar.facilitator && <p className="text-xs text-slate-500">Animé par {seminar.facilitator}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isPast ? 'bg-slate-200 text-slate-700' : 'bg-sky-50 text-sky-700'}`}>
                      {isPast ? 'Clôturé' : 'Ouvert'}
                    </span>
                  </div>
                  <div className="relative mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {alreadyRegistered
                        ? 'Vous êtes inscrit(e)'
                        : locked
                          ? 'Réservé aux abonnés Premium'
                          : remainingSeminars > 0
                            ? `${remainingSeminars} inscription restante sur ce cycle`
                            : 'Limite du cycle atteinte'}
                    </span>
                    <button
                      disabled={disabled}
                      onClick={() => !disabled && handleRegister(seminar.id)}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition ${
                        disabled
                          ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                          : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {alreadyRegistered
                        ? 'Inscrit'
                        : locked
                          ? 'Réservé Premium'
                          : remainingSeminars > 0
                            ? 'S\'inscrire'
                            : 'Limite atteinte'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Accès rapides */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureBlocks.map((feature) => {
            const Icon = feature.icon
            const isRestricted = feature.roles && (!profile?.role || !feature.roles.includes(profile.role))

            return (
              <button
                key={feature.title}
                onClick={() => {
                  if (isRestricted) {
                    alert('Accès réservé selon votre rôle')
                    return
                  }
                  router.push(feature.href)
                }}
                className={`group text-left overflow-hidden rounded-xl border bg-white/80 p-6 shadow-sm backdrop-blur transition-all ${
                  isRestricted ? 'cursor-not-allowed border-dashed opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`rounded-lg bg-gradient-to-br ${feature.color} p-3 shadow-inner shadow-black/10`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-sky-600">
                        {feature.title}
                      </h3>
                      {feature.badge && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{feature.badge}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-sky-600" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Sessions récentes
              </h2>
              <button
                onClick={() => router.push('/history')}
                className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
              >
                Voir tout →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSessions.map((session, index) => (
                <div key={index} className="px-6 py-4 transition hover:bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-lg p-2 ${
                        session.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <TreePine className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {session.tree_name}
                        </p>
                        <p className="text-sm text-slate-600">
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
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        session.completed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {session.completed ? 'Terminé' : 'En cours'}
                      </span>
                      {session.completed && session.diagnosis && (
                        <button className="text-sky-600 transition hover:text-sky-700">
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
          <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shadow-lg">
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
    </div>
  </AuthLayout>
)
}
