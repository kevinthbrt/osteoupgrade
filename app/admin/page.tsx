'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Users,
  Clipboard,
  Activity,
  Shield,
  Layers,
  Mail,
  DollarSign,
  Send,
  FileText,
  ArrowRight,
  Inbox,
  Tag
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    }
  }

  const adminSections = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les comptes utilisateurs et les abonnements',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users'
    },
    {
      title: 'Paiements de Parrainage',
      description: 'Gérer les demandes de paiement des commissions',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      href: '/admin/referral-payouts'
    },
    {
      title: 'Mailing & Automations',
      description: 'Campagnes, newsletters et emails automatiques',
      icon: Mail,
      color: 'from-pink-500 to-pink-600',
      href: '/admin/mailing'
    },
    {
      title: 'Automatisations Email',
      description: 'Configurer les événements et emails automatiques',
      icon: Send,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/automations'
    },
    {
      title: 'Emails Reçus',
      description: 'Consulter et gérer les emails reçus',
      icon: Inbox,
      color: 'from-amber-500 to-amber-600',
      href: '/admin/emails'
    },
    {
      title: 'Tests Orthopédiques',
      description: 'Gérer les tests organisés par zones anatomiques',
      icon: Clipboard,
      color: 'from-orange-500 to-orange-600',
      href: '/tests'
    },
    {
      title: 'Diagnostics Cliniques',
      description: 'Créer des dossiers de diagnostics complets',
      icon: Layers,
      color: 'from-violet-500 to-violet-600',
      href: '/admin/diagnostics'
    },
    {
      title: 'Pathologies',
      description: 'Gérer les pathologies pour les diagnostics',
      icon: Activity,
      color: 'from-red-500 to-red-600',
      href: '/admin/pathologies'
    },
    {
      title: 'Communication',
      description: 'Modèles de courriers et documents premium',
      icon: FileText,
      color: 'from-gray-500 to-gray-600',
      href: '/outils/communication'
    },
    {
      title: 'Codes Promo Gold',
      description: 'Générer et gérer les codes de réduction -100€ sur le Gold annuel',
      icon: Tag,
      color: 'from-emerald-500 to-emerald-600',
      href: '/admin/promo'
    }
  ]

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/8 rounded-3xl p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" /> Administration
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Dashboard Admin
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Accédez à toutes les sections de gestion d'OsteoUpgrade
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* BODY */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-8">

            {/* Navigation Grid */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Sections de gestion</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section, index) => {
                  const Icon = section.icon
                  return (
                    <div
                      key={index}
                      onClick={() => router.push(section.href)}
                      className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
                    >
                      <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 bg-gradient-to-br ${section.color} rounded-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" /> Liens rapides
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 shadow-sm transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Dashboard utilisateur</p>
                    <p className="text-xs text-slate-500">Voir l'interface utilisateur</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/settings/subscription')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 shadow-sm transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Page d'abonnement</p>
                    <p className="text-xs text-slate-500">Tester les offres</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
