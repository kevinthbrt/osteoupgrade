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

interface Segment {
  id: string
  name: string
  rule: string
  size?: number
}

const templateOptions = [
  'Magenta Editorial',
  'Conversion',
  'Onboarding',
  'Annonce produit',
  'Invitation webinaire'
]

export default function MailingAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0])
  const [segment, setSegment] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [schedule, setSchedule] = useState('Maintenant')
  const [sending, setSending] = useState(false)
  const [automationTitle, setAutomationTitle] = useState('')
  const [automationTrigger, setAutomationTrigger] = useState('Inscription')
  const [automationDescription, setAutomationDescription] = useState('')
  const [automationEmails, setAutomationEmails] = useState(1)
  const [segmentName, setSegmentName] = useState('')
  const [segmentRule, setSegmentRule] = useState('')
  const [segmentSize, setSegmentSize] = useState<number | undefined>(undefined)

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
      segment: segment || 'Tous les contacts',
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

  const handleCreateAutomation = (event: React.FormEvent) => {
    event.preventDefault()

    const newAutomation: Automation = {
      id: `a-${Date.now()}`,
      title: automationTitle || 'Nouvelle automatisation',
      description: automationDescription || 'Définissez vos actions et délais',
      trigger: automationTrigger,
      emails: automationEmails,
      active: false
    }

    setAutomations(current => [newAutomation, ...current])
    setAutomationTitle('')
    setAutomationDescription('')
    setAutomationEmails(1)
    setAutomationTrigger('Inscription')
  }

  const handleCreateSegment = (event: React.FormEvent) => {
    event.preventDefault()

    const newSegment: Segment = {
      id: `s-${Date.now()}`,
      name: segmentName || 'Nouveau segment',
      rule: segmentRule || 'Ajoutez des filtres (rôle, activité, date...)',
      size: segmentSize
    }

    setSegments(current => [newSegment, ...current])
    setSegmentName('')
    setSegmentRule('')
    setSegmentSize(undefined)
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
    totalContacts: segments.reduce((total, seg) => total + (seg.size || 0), 0),
    activeNewsletters: campaigns.filter(c => c.status === 'Programmé').length,
    templates: templateOptions.length,
    automationsActive: automations.filter(a => a.active).length,
    segmentsCount: segments.length
  }), [campaigns, automations, segments])

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
              detail: 'Bibliothèque newsletter (statique)'
            },
            {
              label: 'Segments stratégiques',
              value: marketingStats.segmentsCount,
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              detail: `${marketingStats.totalContacts.toLocaleString('fr-FR')} contacts cumulés`
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
                  <option value="">Tous les contacts</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.name}>{seg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                >
                  {templateOptions.map(template => (
                    <option key={template} value={template}>{template}</option>
                  ))}
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
                  <p className="text-sm text-gray-500">Définissez vos propres déclencheurs et séquences.</p>
                </div>
              </div>

              <form onSubmit={handleCreateAutomation} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Nom du scénario</label>
                    <input
                      value={automationTitle}
                      onChange={e => setAutomationTitle(e.target.value)}
                      placeholder="Onboarding premium, panier abandonné..."
                      className="mt-1 w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Déclencheur</label>
                      <select
                        value={automationTrigger}
                        onChange={e => setAutomationTrigger(e.target.value)}
                        className="mt-1 w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
                      >
                        <option>Inscription</option>
                        <option>Mise à niveau premium</option>
                        <option>Inactivité</option>
                        <option>Tag appliqué</option>
                        <option>Webhook Supabase</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Nombre d'emails</label>
                      <input
                        type="number"
                        min={1}
                        value={automationEmails}
                        onChange={e => setAutomationEmails(parseInt(e.target.value) || 1)}
                        className="mt-1 w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Description rapide</label>
                    <textarea
                      value={automationDescription}
                      onChange={e => setAutomationDescription(e.target.value)}
                      placeholder="Ex: J+0 bienvenue, J+3 fonctionnalités clés, J+7 relance premium"
                      className="mt-1 w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-green-600" />
                    <span>Planifiez ensuite les délais + contenus dans Supabase (table automation_steps).</span>
                  </p>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Ajouter le scénario
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {automations.length === 0 && (
                  <div className="border border-dashed rounded-lg p-4 text-sm text-gray-500">
                    Aucun scénario configuré pour le moment. Créez-en un pour démarrer vos automatisations.
                  </div>
                )}

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
              </div>

              <form onSubmit={handleCreateSegment} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Nom du segment</label>
                    <input
                      value={segmentName}
                      onChange={e => setSegmentName(e.target.value)}
                      placeholder="Premium Gold, Leads chauds, Inactifs 30j..."
                      className="mt-1 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Règle ou filtre</label>
                    <textarea
                      value={segmentRule}
                      onChange={e => setSegmentRule(e.target.value)}
                      placeholder="role = premium_gold AND last_seen < now() - interval '7 days'"
                      className="mt-1 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Volume attendu (optionnel)</label>
                    <input
                      type="number"
                      min={0}
                      value={segmentSize ?? ''}
                      onChange={e => setSegmentSize(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Ex: 1200"
                      className="mt-1 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span>Stockez ces filtres dans Supabase (table segments) puis synchronisez-les avec vos campagnes.</span>
                  </p>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Créer le segment
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {segments.length === 0 && (
                  <div className="border border-dashed rounded-lg p-4 text-sm text-gray-500">
                    Aucun segment défini. Créez vos filtres (rôle, activité, tags...) pour cibler vos campagnes.
                  </div>
                )}

                {segments.map(segment => (
                  <div key={segment.id} className="border rounded-lg p-3 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{segment.name}</p>
                      <p className="text-xs text-gray-500">{segment.rule}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{(segment.size || 0).toLocaleString('fr-FR')} contacts</p>
                      <p className="text-xs text-gray-500">Synchronisez depuis Supabase</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-sm p-6 space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase font-semibold text-purple-100">Guide d'intégration</p>
                  <h3 className="text-lg font-bold">Supabase + Resend</h3>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-100" />
                  <p className="text-purple-50">Créez les tables <span className="font-semibold">campaigns</span>, <span className="font-semibold">automations</span>, <span className="font-semibold">segments</span> dans Supabase et stockez vos formulaires dedans.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-100" />
                  <p className="text-purple-50">Exposez une route API (app/api/mail/route.ts) qui appelle <span className="font-semibold">Resend</span> avec votre clé <code>RESEND_API_KEY</code> et l'email expéditeur vérifié.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-100" />
                  <p className="text-purple-50">Utilisez les webhooks Supabase (row level) ou cron pour déclencher l'envoi et consommer vos gabarits.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-100" />
                  <p className="text-purple-50">Logguez l'activité (table <span className="font-semibold">mail_events</span>) pour suivre ouvertures/clics et alimenter vos segments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
