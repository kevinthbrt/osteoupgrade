'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Brain,
  Stethoscope,
  Target
} from 'lucide-react'
import {
  getCaseById,
  getCaseSteps,
  getStepChoices,
  createCaseStep,
  createStepChoice,
  deleteCaseStep,
  deleteStepChoice,
  type ClinicalCase,
  type CaseStep,
  type CaseStepChoice,
  type CaseStepType
} from '@/lib/clinical-cases-api'

const STEP_TYPES: { value: CaseStepType, label: string, icon: any, color: string }[] = [
  { value: 'info', label: 'Information', icon: Info, color: 'blue' },
  { value: 'choice', label: 'Question à choix', icon: Brain, color: 'purple' },
  { value: 'clinical_exam', label: 'Examen clinique', icon: Stethoscope, color: 'orange' },
  { value: 'decision', label: 'Décision clinique', icon: Target, color: 'red' }
]

const FEEDBACK_TYPES = [
  { value: 'correct', label: 'Correct', color: 'green' },
  { value: 'partial', label: 'Partiel', color: 'amber' },
  { value: 'incorrect', label: 'Incorrect', color: 'red' },
  { value: 'info', label: 'Informatif', color: 'blue' }
]

export default function EditCasePage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null)
  const [steps, setSteps] = useState<(CaseStep & { choices: CaseStepChoice[] })[]>([])

  const [showAddStep, setShowAddStep] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)

  const [newStep, setNewStep] = useState<Partial<CaseStep>>({
    step_type: 'info',
    title: '',
    content: '',
    points_available: 10
  })

  const [newChoice, setNewChoice] = useState<Record<string, Partial<CaseStepChoice>>>({})

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [caseId])

  const loadData = async () => {
    try {
      const caseData = await getCaseById(caseId)
      if (!caseData) {
        setError('Cas introuvable')
        return
      }

      setClinicalCase(caseData)

      const stepsData = await getCaseSteps(caseId)
      const stepsWithChoices = await Promise.all(
        stepsData.map(async (step) => {
          const choices = await getStepChoices(step.id)
          return { ...step, choices }
        })
      )

      setSteps(stepsWithChoices)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStep = async () => {
    if (!newStep.title || !newStep.content) {
      setError('Titre et contenu requis')
      return
    }

    setSaving(true)
    setError('')

    try {
      const stepData = {
        case_id: caseId,
        step_order: steps.length,
        step_type: newStep.step_type as CaseStepType,
        title: newStep.title,
        content: newStep.content,
        points_available: newStep.points_available || 10,
        image_url: newStep.image_url,
        video_url: newStep.video_url,
        timer_seconds: newStep.timer_seconds
      }

      const createdStep = await createCaseStep(stepData)

      if (createdStep) {
        setSuccess('Étape créée !')
        setShowAddStep(false)
        setNewStep({
          step_type: 'info',
          title: '',
          content: '',
          points_available: 10
        })
        await loadData()
      } else {
        setError('Erreur lors de la création')
      }
    } catch (err) {
      console.error('Error creating step:', err)
      setError('Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Supprimer cette étape ?')) return

    const success = await deleteCaseStep(stepId)
    if (success) {
      setSuccess('Étape supprimée')
      await loadData()
    } else {
      setError('Erreur lors de la suppression')
    }
  }

  const handleAddChoice = async (stepId: string) => {
    const choiceData = newChoice[stepId]

    if (!choiceData?.choice_text) {
      setError('Texte du choix requis')
      return
    }

    setSaving(true)

    try {
      const step = steps.find(s => s.id === stepId)
      if (!step) return

      const created = await createStepChoice({
        step_id: stepId,
        choice_order: step.choices.length,
        choice_text: choiceData.choice_text,
        is_correct: choiceData.is_correct || false,
        points_awarded: choiceData.points_awarded || 0,
        feedback: choiceData.feedback,
        feedback_type: choiceData.feedback_type as any
      })

      if (created) {
        setSuccess('Choix ajouté !')
        setNewChoice(prev => {
          const updated = { ...prev }
          delete updated[stepId]
          return updated
        })
        await loadData()
      }
    } catch (err) {
      console.error('Error adding choice:', err)
      setError('Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChoice = async (choiceId: string) => {
    if (!confirm('Supprimer ce choix ?')) return

    const success = await deleteStepChoice(choiceId)
    if (success) {
      setSuccess('Choix supprimé')
      await loadData()
    } else {
      setError('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!clinicalCase) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cas introuvable</h2>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white rounded-3xl p-8 mb-8 shadow-2xl">
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="text-sm text-amber-100 hover:text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux cas pratiques
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Éditer les étapes</h1>
              <p className="text-amber-100 mb-4">{clinicalCase.title}</p>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-white/20 rounded-lg">
                  <span className="font-semibold">{steps.length} étapes</span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-lg">
                  <span className="font-semibold">
                    {steps.reduce((sum, s) => sum + s.points_available, 0)} points total
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/encyclopedia/learning/cases/${caseId}/take`)}
              className="px-6 py-3 bg-white text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <Eye className="h-5 w-5" />
              Tester
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-900">{success}</p>
          </div>
        )}

        {/* Add Step Button */}
        {!showAddStep && (
          <button
            onClick={() => setShowAddStep(true)}
            className="w-full px-6 py-4 bg-white border-2 border-dashed border-amber-300 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="h-5 w-5" />
            Ajouter une étape
          </button>
        )}

        {/* Add Step Form */}
        {showAddStep && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-amber-300">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nouvelle étape</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type d'étape *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STEP_TYPES.map(type => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewStep(prev => ({ ...prev, step_type: type.value }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newStep.step_type === type.value
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 text-${type.color}-600`} />
                        <span className="text-sm font-medium block">{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={newStep.title || ''}
                  onChange={(e) => setNewStep(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Ex: Anamnèse du patient"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contenu *
                </label>
                <textarea
                  value={newStep.content || ''}
                  onChange={(e) => setNewStep(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Décrivez la situation, la question ou l'information..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Points disponibles
                  </label>
                  <input
                    type="number"
                    value={newStep.points_available || 10}
                    onChange={(e) => setNewStep(prev => ({ ...prev, points_available: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timer (secondes)
                  </label>
                  <input
                    type="number"
                    value={newStep.timer_seconds || ''}
                    onChange={(e) => setNewStep(prev => ({ ...prev, timer_seconds: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddStep(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateStep}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Créer l'étape
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepType = STEP_TYPES.find(t => t.value === step.step_type)
            const Icon = stepType?.icon || Info

            return (
              <div key={step.id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 bg-${stepType?.color}-100 rounded-xl`}>
                      <Icon className={`h-6 w-6 text-${stepType?.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-600">
                          Étape {index + 1} - {stepType?.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          {step.points_available} pts
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-slate-600 text-sm mb-4">{step.content}</p>

                      {/* Choices */}
                      {step.choices.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <h5 className="text-sm font-semibold text-slate-700">Choix ({step.choices.length})</h5>
                          {step.choices.map((choice, idx) => (
                            <div
                              key={choice.id}
                              className={`p-3 rounded-lg border-2 ${
                                choice.is_correct ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{idx + 1}. {choice.choice_text}</span>
                                    {choice.is_correct && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">
                                      +{choice.points_awarded}
                                    </span>
                                  </div>
                                  {choice.feedback && (
                                    <p className="text-xs text-slate-600 mt-1">{choice.feedback}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteChoice(choice.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Choice Form */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3">Ajouter un choix</h5>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newChoice[step.id]?.choice_text || ''}
                            onChange={(e) => setNewChoice(prev => ({
                              ...prev,
                              [step.id]: { ...prev[step.id], choice_text: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Texte du choix..."
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              value={newChoice[step.id]?.points_awarded || 0}
                              onChange={(e) => setNewChoice(prev => ({
                                ...prev,
                                [step.id]: { ...prev[step.id], points_awarded: parseInt(e.target.value) }
                              }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Points"
                            />

                            <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                              <input
                                type="checkbox"
                                checked={newChoice[step.id]?.is_correct || false}
                                onChange={(e) => setNewChoice(prev => ({
                                  ...prev,
                                  [step.id]: { ...prev[step.id], is_correct: e.target.checked }
                                }))}
                              />
                              <span>Correct</span>
                            </label>

                            <select
                              value={newChoice[step.id]?.feedback_type || 'info'}
                              onChange={(e) => setNewChoice(prev => ({
                                ...prev,
                                [step.id]: { ...prev[step.id], feedback_type: e.target.value }
                              }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              {FEEDBACK_TYPES.map(ft => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            value={newChoice[step.id]?.feedback || ''}
                            onChange={(e) => setNewChoice(prev => ({
                              ...prev,
                              [step.id]: { ...prev[step.id], feedback: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            rows={2}
                            placeholder="Feedback (optionnel)..."
                          />

                          <button
                            onClick={() => handleAddChoice(step.id)}
                            disabled={saving}
                            className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {steps.length === 0 && !showAddStep && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune étape</h3>
            <p className="text-slate-600">Commencez par ajouter la première étape de votre cas clinique</p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
