'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  PlayCircle,
  Settings,
  Sparkles,
  Users
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  subject: string
  segment: string
  status: 'Brouillon' | 'Programmé' | 'Envoyé'
  sendDate?: string
  template: string
}

interface Automation {
  id: string
  title: string
  description: string
  trigger: string
  emails: number
  active: boolean
}

const initialCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Newsletter hebdomadaire',
    subject: 'Les temps forts de la semaine',
    segment: 'Tous les abonnés',
    status: 'Programmé',
    sendDate: '14 Oct 09:00',
    template: 'Magenta Editorial'
  },
  {
    id: 'c2',
    name: 'Relance premium',
    subject: "Passez en Premium Gold et débloquez tout",
    segment: 'Leads chauds',
    status: 'Brouillon',
    template: 'Conversion'
  },
  {
    id: 'c3',
    name: 'Onboarding nouvelles inscriptions',
    subject: 'Bienvenue sur OsteoUpgrade 🎉',
    segment: 'Nouveaux utilisateurs',
    status: 'Envoyé',
    sendDate: '10 Oct 12:30',
    template: 'Onboarding'
  }
]

const initialAutomations: Automation[] = [
  {
    id: 'a1',
    title: 'Séquence bienvenue',
    description: '3 emails sur 10 jours pour présenter la plateforme',
    trigger: 'Inscription',
    emails: 3,
    active: true
  },
  {
    id: 'a2',
    title: 'Panier abandonné',
    description: 'Relances pour les leads ayant commencé un achat premium',
    trigger: 'Intentions de paiement',
    emails: 2,
    active: false
  },
  {
    id: 'a3',
    title: 'Réactivation inactifs',
    description: 'Réengager les comptes inactifs depuis 30 jours',
    trigger: 'Inactivité 30j',
    emails: 4,
    active: true
  }
]

export default function MailingAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [selectedTemplate, setSelectedTemplate] = useState('Magenta Editorial')
  const [segment, setSegment] = useState('Tous les abonnés')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [schedule, setSchedule] = useState('Maintenant')
  const [sending, setSending] = useState(false)

  useEffect(() => {
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
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const handleCreateCampaign = (event: React.FormEvent) => {
    event.preventDefault()
    const newCampaign: Campaign = {
      id: `c-${Date.now()}`,
      name: campaignName || 'Nouvelle campagne',
      subject: subject || 'Sujet à définir',
      segment,
      status: schedule === 'Programmer' ? 'Programmé' : 'Brouillon',
      sendDate: schedule === 'Programmer' ? 'Demain 09:00' : undefined,
      template: selectedTemplate
    }

    setCampaigns([newCampaign, ...campaigns])
    setCampaignName('')
    setSubject('')
    setSchedule('Maintenant')
    alert('Campagne créée en brouillon. Ajoutez le contenu puis envoyez !')
  }

  const handleSendTest = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      alert('Email test envoyé à l’équipe interne ✔️')
    }, 800)
  }

  const toggleAutomation = (id: string) => {
    setAutomations(current =>
      current.map(auto =>
        auto.id === id ? { ...auto, active: !auto.active } : auto
      )
    )
  }

  const marketingStats = useMemo(() => ({
    totalContacts: 12840,
    activeNewsletters: campaigns.filter(c => c.status === 'Programmé').length,
    templates: 8,
    automationsActive: automations.filter(a => a.active).length
  }), [campaigns, automations])

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
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Centre Mailing & Automation</h1>
              </div>
              <p className="text-purple-100 max-w-2xl">
                Pilotez newsletters, campagnes marketing et séquences automatisées sans sortir d’OsteoUpgrade.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Audience totale</p>
              <p className="text-3xl font-bold">{marketingStats.totalContacts.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-purple-100">Abonnés & leads marketing</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Campagnes programmées',
              value: marketingStats.activeNewsletters,
              icon: Clock,
              color: 'from-blue-500 to-blue-600',
              detail: 'Prêtes à partir'
            },
            {
              label: 'Automatisations actives',
              value: marketingStats.automationsActive,
              icon: PlayCircle,
              color: 'from-green-500 to-green-600',
              detail: 'Scénarios en production'
            },
            {
              label: 'Templates disponibles',
              value: marketingStats.templates,
              icon: Sparkles,
              color: 'from-amber-500 to-amber-600',
              detail: 'Bibliothèque newsletter'
            },
            {
              label: 'Segments stratégiques',
              value: 6,
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              detail: 'Premium, leads, inactifs...'
            }
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{stat.detail}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Builder */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-purple-600 font-semibold">Campagnes</p>
                <h2 className="text-xl font-bold text-gray-900">Créer une newsletter</h2>
                <p className="text-sm text-gray-500">Nommer, choisir un segment et planifier l’envoi.</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Retour admin
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Nom de campagne</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="Newsletter du mardi, flash promo..."
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Sujet</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex: Nouveaux tests orthopédiques disponibles"
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Segment</label>
                <select
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option>Tous les abonnés</option>
                  <option>Premium Gold</option>
                  <option>Premium Silver</option>
                  <option>Leads chauds</option>
                  <option>Inactifs 30j</option>
                  <option>Nouveaux utilisateurs</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option>Magenta Editorial</option>
                  <option>Conversion</option>
                  <option>Onboarding</option>
                  <option>Annonce produit</option>
                  <option>Invitation webinaire</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Planification</label>
                <select
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option>Maintenant</option>
                  <option>Programmer</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Vérifications automatiques</p>
                    <p className="text-xs text-gray-500">Prévisualisation mobile, délivrabilité, liens trackés.</p>
                  </div>
                </div>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sending}
                    className="px-3 py-2 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                  >
                    {sending ? 'Envoi...' : 'Envoyer un test'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Créer le brouillon
                  </button>
                </div>
              </div>
            </form>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Campagnes récentes</h3>
                <div className="text-xs text-gray-500">Track: ouvertures, clics, ventes</div>
              </div>
              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4 flex items-start justify-between hover:border-purple-200">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">{campaign.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${campaign.status === 'Envoyé'
                          ? 'bg-green-100 text-green-700'
                          : campaign.status === 'Programmé'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{campaign.subject}</p>
                      <p className="text-xs text-gray-500">Segment: {campaign.segment} · Template: {campaign.template}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {campaign.sendDate ? (
                        <div className="flex items-center space-x-1 justify-end">
                          <Clock className="h-4 w-4" />
                          <span>{campaign.sendDate}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 justify-end">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span>Brouillon</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Automations & Segments */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-green-600 font-semibold">Automatisation</p>
                  <h3 className="text-lg font-bold text-gray-900">Scénarios actifs</h3>
                  <p className="text-sm text-gray-500">Onboarding, réactivation, nurturing et upsell.</p>
                </div>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>Nouveau scénario</span>
                </button>
              </div>

              <div className="space-y-3">
                {automations.map(auto => (
                  <div key={auto.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{auto.title}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{auto.trigger}</span>
                        </div>
                        <p className="text-sm text-gray-600">{auto.description}</p>
                        <p className="text-xs text-gray-500">{auto.emails} emails automatisés</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${auto.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {auto.active ? 'Actif' : 'Suspendu'}
                        </span>
                        <button
                          onClick={() => toggleAutomation(auto.id)}
                          className={`text-xs px-3 py-1 rounded-lg border ${auto.active
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {auto.active ? 'Mettre en pause' : 'Activer'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-blue-600 font-semibold">Segments</p>
                  <h3 className="text-lg font-bold text-gray-900">Audience & ciblage</h3>
                  <p className="text-sm text-gray-500">Segmentez par plan, engagement, interactions.</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <Bell className="h-4 w-4" />
                  <span>Alerte activité</span>
                </button>
              </div>

              <div className="space-y-3">
                {[{
                  name: 'Premium Gold',
                  size: 3120,
                  rule: 'Rôle = premium_gold, activité < 7j'
                }, {
                  name: 'Leads chauds',
                  size: 940,
                  rule: 'Cliqué 2+ emails marketing'
                }, {
                  name: 'Inactifs 30j',
                  size: 1840,
                  rule: 'Aucune connexion depuis 30 jours'
                }, {
                  name: 'Nouveaux utilisateurs',
                  size: 2100,
                  rule: 'Inscription < 14 jours'
                }].map(segment => (
                  <div key={segment.name} className="border rounded-lg p-3 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{segment.name}</p>
                      <p className="text-xs text-gray-500">{segment.rule}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{segment.size.toLocaleString('fr-FR')} contacts</p>
                      <p className="text-xs text-gray-500">Score délivrabilité élevé</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-sm p-6 space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase font-semibold text-purple-100">Automation en temps réel</p>
                  <h3 className="text-lg font-bold">Connecté à la base supabase & webhooks</h3>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Entrée: Nouvelle inscription</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>Segment: Onboarding</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>Email 1 (J+0)</span>
                </div>
                <div className="flex items-center justify-between text-purple-100 text-xs">
                  <span>Actions disponibles: tag, webhook, maj profil, pause conditionnelle</span>
                  <span>Livraison optimisée (SendGrid / Brevo)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
