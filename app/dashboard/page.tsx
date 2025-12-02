'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  Clipboard,
  ChevronRight,
  FileText,
  Users,
  Crown,
  AlertCircle,
  BookOpen,
  Calendar,
  Map,
  MapPin,
  TestTube
} from 'lucide-react'

interface Seminar {
  id: string
  title: string
  date: string
  location: string
  theme: string | null
  facilitator: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [registrations, setRegistrations] = useState<{ id: string; seminar_id: string; registeredAt: string }[]>([])
  const [seminarLoadError, setSeminarLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const yearlyRegistrations = registrations.filter(
    (registration) => new Date(registration.registeredAt).getFullYear() === currentYear
  )
  const remainingSeminars = Math.max(0, 2 - yearlyRegistrations.length)
  const isPremiumOrAdmin = profile?.role === 'premium' || profile?.role === 'admin'

  const handleRegister = async (id: string) => {
    if (!isPremiumOrAdmin) {
      alert('Inscription réservée aux membres Premium')
      return
    }

    if (remainingSeminars <= 0) {
      alert('Vous avez atteint la limite de 2 séminaires pour cette année')
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
      title: 'Visualiser les tests orthopédiques',
      description: 'Répertoire complet des tests par zone. Réservé aux Premium.',
      icon: Clipboard,
      href: '/tests',
      color: 'from-blue-500 to-blue-600',
      roles: ['premium', 'admin'] as const,
    },
    {
      title: 'E-learning — Guides topographiques',
      description: "Simplifiez votre raisonnement grâce à l'aide topographique",
      icon: BookOpen,
      href: '/elearning',
      color: 'from-green-500 to-emerald-600',
      roles: ['premium', 'admin'] as const,
    },
    {
      title: 'Démarrer le Testing 3D',
      description: 'Exploration biomécanique avancée en 3D (Premium).',
      icon: TestTube,
      href: '/testing',
      color: 'from-purple-500 to-indigo-600',
      roles: ['premium', 'admin'] as const,
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

        {/* Séminaires présentiels */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold">
                <Calendar className="h-5 w-5" />
                Séminaires présentiels
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-1">Calendrier visible par tous</h2>
              <p className="text-sm text-gray-600">Les inscriptions sont réservées aux membres Premium disposant encore de sessions cette année.</p>
            </div>
            <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold">
              {yearlyRegistrations.length}/2 inscriptions {currentYear}
            </div>
          </div>

          {seminarLoadError && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4" />
              {seminarLoadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {seminars.map((seminar) => {
              const alreadyRegistered = registrations.some((registration) => registration.seminar_id === seminar.id)
              const isPast = new Date(seminar.date) < new Date()
              const locked = !isPremiumOrAdmin
              const disabled = locked || alreadyRegistered || remainingSeminars <= 0 || isPast

              return (
                <div key={seminar.id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-200 transition-colors bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{new Date(seminar.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <h3 className="font-semibold text-gray-900">{seminar.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        {seminar.location}
                      </p>
                      {seminar.theme && <p className="text-xs text-gray-600">{seminar.theme}</p>}
                      {seminar.facilitator && <p className="text-xs text-gray-500">Animé par {seminar.facilitator}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-primary-50 text-primary-700'}`}>
                      {isPast ? 'Clôturé' : 'Ouvert'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {alreadyRegistered
                        ? 'Vous êtes inscrit(e)'
                        : locked
                          ? 'Réservé aux abonnés Premium'
                          : remainingSeminars > 0
                            ? `${remainingSeminars} place(s) restante(s) pour vous cette année`
                            : 'Limite annuelle atteinte'}
                    </span>
                    <button
                      disabled={disabled}
                      onClick={() => !disabled && handleRegister(seminar.id)}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition ${
                        disabled
                          ? 'border-gray-200 text-gray-400 bg-white cursor-not-allowed'
                          : 'border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100'
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                className={`bg-white rounded-xl shadow-sm p-6 transition-all group text-left border ${
                  isRestricted ? 'opacity-60 cursor-not-allowed border-dashed' : 'hover:shadow-md border-transparent'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`bg-gradient-to-br ${feature.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {feature.title}
                      </h3>
                      {feature.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{feature.badge}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {feature.description}
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
