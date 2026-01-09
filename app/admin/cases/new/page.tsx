'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Target,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react'
import { createCase } from '@/lib/clinical-cases-api'

const REGIONS = [
  'cervical', 'atm', 'crane', 'thoracique', 'lombaire', 'sacro-iliaque',
  'cotes', 'epaule', 'coude', 'poignet', 'main', 'hanche', 'genou',
  'cheville', 'pied', 'neurologique', 'vasculaire', 'systemique'
]

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
  const [uploading, setUploading] = useState(false)

  const [caseData, setCaseData] = useState({
    title: '',
    description: '',
    region: 'cervical',
    difficulty: 'débutant' as 'débutant' | 'intermédiaire' | 'avancé',
    duration_minutes: 30,
    photo_url: '',
    is_free_access: false
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `cases/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      setCaseData(prev => ({ ...prev, photo_url: publicUrl }))
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!caseData.title || !caseData.description) {
      setError('Le titre et la description sont obligatoires')
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

      const newCase = await createCase({
        ...caseData,
        is_active: true,
        display_order: 0,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (!newCase) {
        throw new Error('Erreur lors de la création du cas')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/cases/${newCase.id}/edit`)
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
              <h1 className="text-3xl font-bold mb-2">Créer un nouveau cas clinique</h1>
              <p className="text-amber-100">Créez un cas, puis ajoutez des chapitres et modules</p>
            </div>
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
            <p className="text-sm font-medium text-green-900">
              Cas créé avec succès ! Redirection vers l'éditeur...
            </p>
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
                  Description *
                </label>
                <textarea
                  value={caseData.description}
                  onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  rows={4}
                  placeholder="Description du cas clinique..."
                  required
                />
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
                      <option key={region} value={region}>
                        {region.charAt(0).toUpperCase() + region.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Niveau de difficulté *
                  </label>
                  <select
                    value={caseData.difficulty}
                    onChange={(e) => setCaseData({ ...caseData, difficulty: e.target.value as any })}
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
                    max="180"
                    value={caseData.duration_minutes}
                    onChange={(e) => setCaseData({ ...caseData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image de couverture
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`px-4 py-2 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading ? 'Upload en cours...' : 'Choisir une image'}
                    </span>
                  </label>
                  {caseData.photo_url && (
                    <img
                      src={caseData.photo_url}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseData.is_free_access}
                    onChange={(e) => setCaseData({ ...caseData, is_free_access: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-400"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Accès gratuit (accessible aux utilisateurs free)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-blue-900">
              <strong>📝 Prochaine étape :</strong> Après création du cas, vous serez redirigé vers l'éditeur où vous pourrez ajouter des chapitres, des modules (vidéo/image/texte) et des quiz.
            </p>
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
                  Créer le cas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
