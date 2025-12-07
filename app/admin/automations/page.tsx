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
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Rocket className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Gestion des automatisations</h1>
              </div>
              <p className="text-purple-100">
                Suivez vos automatisations en temps réel et gérez les inscriptions
              </p>
            </div>
            <button
              onClick={triggerProcessing}
              disabled={processing}
              className="inline-flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition shadow-sm disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>{processing ? 'Traitement...' : 'Traiter maintenant'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des automatisations */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Automatisations actives
              </h3>

              {automations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucune automatisation créée
                </p>
              ) : (
                <div className="space-y-2">
                  {automations.map((auto) => (
                    <button
                      key={auto.id}
                      onClick={() => handleAutomationClick(auto.id)}
                      className={`w-full text-left border rounded-lg p-3 transition ${
                        selectedAutomation === auto.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{auto.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {auto.trigger_event}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            auto.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {auto.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{auto.total_enrollments} inscrits</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <PlayCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Sélectionnez une automatisation pour voir les détails
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">En attente</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">
                      {selectedAutomationData?.pending || 0}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium">En cours</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedAutomationData?.processing || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Terminés</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedAutomationData?.completed || 0}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-700 mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Annulés</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedAutomationData?.cancelled || 0}
                    </p>
                  </div>
                </div>

                {/* Liste des inscriptions */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                  <h3 className="font-semibold text-lg mb-4">Inscriptions</h3>

                  {loadingEnrollments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : enrollments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
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
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {contact?.first_name && contact?.last_name
                                    ? `${contact.first_name} ${contact.last_name}`
                                    : contact?.email || 'Contact inconnu'}
                                </p>
                                <p className="text-xs text-gray-500">
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
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {enrollment.status === 'completed' && 'Terminé'}
                                {enrollment.status === 'processing' && 'En cours'}
                                {enrollment.status === 'pending' && 'En attente'}
                                {enrollment.status === 'cancelled' && 'Annulé'}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
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
    </AuthLayout>
  )
}
