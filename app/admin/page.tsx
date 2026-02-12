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
  LayoutGrid,
  Send,
  FileText,
  ArrowRight,
  Inbox
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
      title: 'Anatomy Builder',
      description: 'Constructeur anatomique pour les formations',
      icon: LayoutGrid,
      color: 'from-cyan-500 to-cyan-600',
      href: '/admin/anatomy-builder'
    },
    {
      title: 'Communication',
      description: 'Modèles de courriers et documents premium',
      icon: FileText,
      color: 'from-gray-500 to-gray-600',
      href: '/outils/communication'
    }
  ]

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          </div>
          <p className="text-purple-100">Accédez à toutes les sections de gestion d'OsteoUpgrade</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section, index) => {
            const Icon = section.icon
            return (
              <div
                key={index}
                onClick={() => router.push(section.href)}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${section.color} rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Liens rapides
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white border border-blue-300 rounded-lg p-3 text-left hover:bg-blue-100 transition-colors"
            >
              <p className="font-medium text-blue-900 text-sm">Dashboard utilisateur</p>
              <p className="text-xs text-blue-600">Voir l'interface utilisateur</p>
            </button>
            <button
              onClick={() => router.push('/settings/subscription')}
              className="bg-white border border-blue-300 rounded-lg p-3 text-left hover:bg-blue-100 transition-colors"
            >
              <p className="font-medium text-blue-900 text-sm">Page d'abonnement</p>
              <p className="text-xs text-blue-600">Tester les offres</p>
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
