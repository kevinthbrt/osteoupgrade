'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  PlayCircle,
  Users,
  XCircle,
  RefreshCw,
  Rocket
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'

type AutomationStats = {
  id: string
  name: string
  trigger_event: string
  active: boolean
  total_enrollments: number
  pending: number
  processing: number
  completed: number
  cancelled: number
  steps_count: number
}

type Enrollment = {
  id: string
  status: string
  next_step_order: number | null
  last_run_at: string | null
  created_at: string
  contact: {
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export default function AutomationsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [automations, setAutomations] = useState<AutomationStats[]>([])
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
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

        await loadAutomations()
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router])

  const loadAutomations = async () => {
    try {
      const response = await fetch('/api/automations')
      if (!response.ok) return

      const { automations: loadedAutomations } = await response.json()

      // Calculer les statistiques pour chaque automatisation
      const stats = await Promise.all(
        loadedAutomations.map(async (auto: any) => {
          const { data: enrollments } = await supabase
            .from('mail_automation_enrollments')
            .select('status')
            .eq('automation_id', auto.id)

          const total = enrollments?.length || 0
          const pending = enrollments?.filter(e => e.status === 'pending').length || 0
          const processing = enrollments?.filter(e => e.status === 'processing').length || 0
          const completed = enrollments?.filter(e => e.status === 'completed').length || 0
          const cancelled = enrollments?.filter(e => e.status === 'cancelled').length || 0

          return {
            id: auto.id,
            name: auto.name,
            trigger_event: auto.trigger_event,
            active: auto.active,
            total_enrollments: total,
            pending,
            processing,
            completed,
            cancelled,
            steps_count: auto.steps?.length || 0
          }
        })
      )

      setAutomations(stats)
    } catch (error) {
      console.error('Error loading automations:', error)
    }
  }

  const loadEnrollments = async (automationId: string) => {
    setLoadingEnrollments(true)
    try {
      const response = await fetch(`/api/automations/${automationId}/enroll`)
      if (!response.ok) return

      const { enrollments: loadedEnrollments } = await response.json()
      setEnrollments(loadedEnrollments)
    } catch (error) {
      console.error('Error loading enrollments:', error)
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const handleAutomationClick = async (automationId: string) => {
    setSelectedAutomation(automationId)
    await loadEnrollments(automationId)
  }

  const triggerProcessing = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/automations/process', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Échec du traitement')
      }

      const result = await response.json()
      alert(`✅ Traitement terminé :\n- ${result.processed} inscriptions traitées\n- ${result.sent} emails envoyés\n- ${result.errors} erreurs`)

      // Recharger les données
      await loadAutomations()
      if (selectedAutomation) {
        await loadEnrollments(selectedAutomation)
      }
    } catch (error: any) {
      alert(`❌ Erreur : ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  const selectedAutomationData = automations.find(a => a.id === selectedAutomation)

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        {/* Dark header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6 overflow-hidden">
          {/* Blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
            <div className="absolute top-0 right-1/4 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
            <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
          </div>

          {/* Glow lines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent" />

          {/* Glass panel */}
          <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/8 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="h-4 w-4 text-purple-300" />
                <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                  Admin — Automatisations
                </span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Gestion des automatisations
              </h1>
              <p className="mt-1 text-blue-300/70 text-sm">
                Suivez vos automatisations en temps réel et gérez les inscriptions
              </p>
            </div>
            <button
              onClick={triggerProcessing}
              disabled={processing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Traiter maintenant'}</span>
            </button>
          </div>
        </div>

        {/* Light body */}
        <div className="relative bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 overflow-hidden">
          {/* Blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
            <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>

          <div className="relative space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Liste des automatisations */}
              <div className="lg:col-span-1">
                <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Automatisations actives
                  </h3>

                  {automations.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      Aucune automatisation créée
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {automations.map((auto) => (
                        <button
                          key={auto.id}
                          onClick={() => handleAutomationClick(auto.id)}
                          className={`w-full text-left rounded-xl p-3 transition-colors border ${
                            selectedAutomation === auto.id
                              ? 'border-purple-400/50 bg-purple-50/80'
                              : 'border-blue-200/50 bg-white/60 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{auto.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {auto.trigger_event}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                                auto.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {auto.active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Users className="h-3 w-3" />
                              <span>{auto.total_enrollments} inscrits</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Mail className="h-3 w-3" />
                              <span>{auto.steps_count} étapes</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Détails de l'automatisation sélectionnée */}
              <div className="lg:col-span-2">
                {!selectedAutomation ? (
                  <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-12 text-center">
                    <PlayCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      Sélectionnez une automatisation pour voir les détails
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Statistiques */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-yellow-700 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">En attente</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">
                          {selectedAutomationData?.pending || 0}
                        </p>
                      </div>

                      <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                          <Activity className="h-4 w-4" />
                          <span className="text-xs font-medium">En cours</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {selectedAutomationData?.processing || 0}
                        </p>
                      </div>

                      <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-green-700 mb-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Terminés</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {selectedAutomationData?.completed || 0}
                        </p>
                      </div>

                      <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-slate-700 mb-1">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Annulés</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                          {selectedAutomationData?.cancelled || 0}
                        </p>
                      </div>
                    </div>

                    {/* Liste des inscriptions */}
                    <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                      <h3 className="font-semibold text-lg mb-4 text-slate-800">Inscriptions</h3>

                      {loadingEnrollments ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      ) : enrollments.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Aucune inscription pour le moment
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {enrollments.map((enrollment) => {
                            const contact = Array.isArray(enrollment.contact)
                              ? enrollment.contact[0]
                              : enrollment.contact

                            return (
                              <div
                                key={enrollment.id}
                                className="border border-blue-200/50 bg-white/60 rounded-xl p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-slate-800">
                                      {contact?.first_name && contact?.last_name
                                        ? `${contact.first_name} ${contact.last_name}`
                                        : contact?.email || 'Contact inconnu'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {contact?.email}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                                      enrollment.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : enrollment.status === 'processing'
                                        ? 'bg-blue-100 text-blue-700'
                                        : enrollment.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {enrollment.status === 'completed' && 'Terminé'}
                                    {enrollment.status === 'processing' && 'En cours'}
                                    {enrollment.status === 'pending' && 'En attente'}
                                    {enrollment.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </div>

                                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                  <span>
                                    Étape {enrollment.next_step_order ?? 0} /{' '}
                                    {selectedAutomationData?.steps_count || 0}
                                  </span>
                                  {enrollment.last_run_at && (
                                    <span>
                                      Dernier envoi :{' '}
                                      {new Date(enrollment.last_run_at).toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                  <span>
                                    Inscrit le :{' '}
                                    {new Date(enrollment.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
