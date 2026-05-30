'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Users,
  Shield,
  Layers,
  Mail,
  DollarSign,
  Send,
  ArrowRight,
  Inbox,
  Tag,
  LifeBuoy,
  Megaphone,
} from 'lucide-react'

type Counts = { tickets: number; emails: number; payouts: number }

export default function AdminPage() {
  const router = useRouter()
  const [counts, setCounts] = useState<Counts>({ tickets: 0, emails: 0, payouts: 0 })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }
      fetchCounts()
    } catch {
      router.push('/dashboard')
    }
  }

  const fetchCounts = async () => {
    try {
      const [ticketsRes, emailsRes, payoutsRes] = await Promise.all([
        fetch('/api/admin/support'),
        fetch('/api/emails/list?is_read=false&is_archived=false&limit=100'),
        fetch('/api/admin/referral-payouts'),
      ])

      const newCounts: Counts = { tickets: 0, emails: 0, payouts: 0 }

      if (ticketsRes.ok) {
        const d = await ticketsRes.json()
        newCounts.tickets = (d.tickets || []).filter((t: any) => t.status !== 'resolved').length
      }
      if (emailsRes.ok) {
        const d = await emailsRes.json()
        newCounts.emails = d.emails?.length ?? 0
      }
      if (payoutsRes.ok) {
        const d = await payoutsRes.json()
        const list = d.payouts ?? d ?? []
        newCounts.payouts = Array.isArray(list) ? list.filter((p: any) => p.payout_status === 'pending').length : 0
      }

      setCounts(newCounts)
    } catch {}
  }

  type Section = {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
    iconBg: string
    href: string
    badgeKey?: keyof Counts
  }

  const sections: Section[] = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Comptes, abonnements premium, newsletter et paiements parrainage',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/admin/users',
    },
    {
      title: 'Tickets Support',
      description: 'Demandes de support MyOsteoFlow et OsteoUpgrade',
      icon: LifeBuoy,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      href: '/admin/support',
      badgeKey: 'tickets',
    },
    {
      title: 'Boite mail',
      description: 'Consulter et gérer les emails reçus',
      icon: Inbox,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      href: '/admin/emails',
      badgeKey: 'emails',
    },
    {
      title: 'Diffusions',
      description: 'Envoyer un message à tous les utilisateurs',
      icon: Megaphone,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100',
      href: '/admin/broadcasts',
    },
    {
      title: 'Paiements de Parrainage',
      description: 'Valider les demandes de commission',
      icon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      href: '/admin/referral-payouts',
      badgeKey: 'payouts',
    },
    {
      title: 'Newsletter',
      description: 'Rédiger et envoyer les newsletters',
      icon: Mail,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-100',
      href: '/admin/mailing',
    },
    {
      title: 'Automatisation Email',
      description: 'Configurer les événements et emails automatiques',
      icon: Send,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      href: '/admin/automations',
    },
    {
      title: 'Codes Promo',
      description: 'Générer et gérer les codes de réduction',
      icon: Tag,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      href: '/admin/promo',
    },
  ]

  const totalAlerts = counts.tickets + counts.emails + counts.payouts

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" /> Administration
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                    Dashboard Admin
                  </h1>
                  <p className="text-blue-300/70 text-sm mt-1.5">
                    Accédez à toutes les sections de gestion d&apos;OsteoUpgrade
                  </p>
                </div>
                {totalAlerts > 0 && (
                  <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                    {totalAlerts} action{totalAlerts > 1 ? 's' : ''} en attente
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        </div>

        {/* BODY */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6">

            {/* Sections list */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Sections de gestion</h2>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
                {sections.map((section, i) => {
                  const Icon = section.icon
                  const badgeCount = section.badgeKey ? counts[section.badgeKey] : 0
                  return (
                    <button
                      key={section.href}
                      onClick={() => router.push(section.href)}
                      className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-blue-50/60 transition-colors group ${i < sections.length - 1 ? 'border-b border-slate-100/80' : ''}`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}>
                        <Icon className={`h-5 w-5 ${section.iconColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{section.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {badgeCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold bg-red-500 text-white">
                            {badgeCount}
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" /> Liens rapides
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 shadow-sm transition-all"
                >
                  Dashboard utilisateur
                </button>
                <button
                  onClick={() => router.push('/settings/subscription')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 text-sm font-medium hover:bg-white/90 shadow-sm transition-all"
                >
                  Page d&apos;abonnement
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
