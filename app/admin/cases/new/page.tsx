'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Target,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

const REGIONS = ['Cervical', 'Thoracique', 'Lombaire', 'Épaule', 'Genou', 'Hanche', 'Multi-régions']
const DIFFICULTIES = [
  { value: 'débutant', label: '🌱 Débutant' },
  { value: 'intermédiaire', label: '🔥 Intermédiaire' },
  { value: 'avancé', label: '⚡ Avancé' }
]

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [caseData, setCaseData] = useState({
    title: '',
    description: '',
    region: 'Cervical',
    difficulty: 'débutant',
    duration_minutes: 15,
    patient_profile: ''
  })

  const [objectives, setObjectives] = useState<string[]>([''])

  const addObjective = () => {
    setObjectives([...objectives, ''])
  }

  const removeObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== index))
    }
  }

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives]
    updated[index] = value
    setObjectives(updated)
  }

  const validateForm = (): boolean => {
    if (!caseData.title || !caseData.description || !caseData.patient_profile) {
      setError('Le titre, la description et le profil patient sont obligatoires')
      return false
    }

    const filledObjectives = objectives.filter(obj => obj.trim() !== '')
    if (filledObjectives.length === 0) {
      setError('Au moins un objectif d\'apprentissage est requis')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Vous devez être connecté')
        return
      }

      // Filter out empty objectives
      const filledObjectives = objectives.filter(obj => obj.trim() !== '')

      // Insert case
      const { error: caseError } = await supabase
        .from('clinical_cases')
        .insert({
          title: caseData.title,
          description: caseData.description,
          region: caseData.region,
          difficulty: caseData.difficulty,
          duration_minutes: caseData.duration_minutes,
          patient_profile: caseData.patient_profile,
          objectives: filledObjectives,
          created_by: user.id,
          is_active: true
        })

      if (caseError) throw caseError

      const { data: createdCase } = await supabase
        .from('clinical_cases')
        .select('id')
        .eq('title', caseData.title)
        .single()

      setSuccess(true)
      setTimeout(() => {
        if (createdCase) {
          router.push(`/admin/cases/${createdCase.id}/edit`)
        } else {
          router.push('/encyclopedia/learning/cases')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Error creating case:', err)
      setError(err.message || 'Erreur lors de la création du cas')
    } finally {
      setLoading(false)
    }
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

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Créer un nouveau cas pratique</h1>
              <p className="text-amber-100">Créez un scénario clinique interactif pour l'apprentissage</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Cas pratique créé avec succès ! Redirection...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Case Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Informations du cas</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre du cas *
                </label>
                <input
                  type="text"
                  value={caseData.title}
                  onChange={(e) => setCaseData({ ...caseData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Ex: Cervicalgie post-traumatique"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description / Motif de consultation *
                </label>
                <textarea
                  value={caseData.description}
                  onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  rows={3}
                  placeholder="Décrivez le cas clinique et le motif de consultation du patient..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profil patient *
                </label>
                <input
                  type="text"
                  value={caseData.patient_profile}
                  onChange={(e) => setCaseData({ ...caseData, patient_profile: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Ex: Homme, 35 ans, actif"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Âge, sexe, profession, activités pertinentes
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Région anatomique *
                  </label>
                  <select
                    value={caseData.region}
                    onChange={(e) => setCaseData({ ...caseData, region: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  >
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Niveau de difficulté *
                  </label>
                  <select
                    value={caseData.difficulty}
                    onChange={(e) => setCaseData({ ...caseData, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Durée estimée (minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={caseData.duration_minutes}
                    onChange={(e) => setCaseData({ ...caseData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Objectifs d'apprentissage</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Définissez les compétences et connaissances que les étudiants développeront
                </p>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {objectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    placeholder="Ex: Identifier les drapeaux rouges"
                  />
                  {objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                <strong>💡 Conseil :</strong> Formulez des objectifs clairs et mesurables. Par exemple : "Réaliser un examen physique ciblé", "Établir un diagnostic différentiel", "Proposer un plan de traitement adapté".
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/encyclopedia/learning/cases')}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Créer le cas pratique
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
