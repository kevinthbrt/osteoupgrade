'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Clipboard,
  Save,
  ArrowLeft,
  PlayCircle,
  Info,
  Loader2,
  MapPin,
  Activity
} from 'lucide-react'

// Catégories de régions anatomiques
const BODY_REGIONS = {
  'Tête et Cou': ['Cervical', 'ATM', 'Crâne'],
  'Membre Supérieur': ['Épaule', 'Coude', 'Poignet', 'Main'],
  'Tronc': ['Thoracique', 'Lombaire', 'Sacro-iliaque', 'Côtes'],
  'Membre Inférieur': ['Hanche', 'Genou', 'Cheville', 'Pied'],
  'Général': ['Neurologique', 'Vasculaire', 'Systémique']
}

export default function NewTestPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    video_url: '',
    sensitivity: '',
    specificity: '',
    rv_positive: '',
    rv_negative: '',
    interest: '',
    indications: '' // <- nouveau champ
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description || !formData.category) {
      alert('Le nom, la description et la région sont obligatoires')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('orthopedic_tests').insert({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        video_url: formData.video_url || null,
        sensitivity: formData.sensitivity ? parseFloat(formData.sensitivity) : null,
        specificity: formData.specificity ? parseFloat(formData.specificity) : null,
        rv_positive: formData.rv_positive ? parseFloat(formData.rv_positive) : null,
        rv_negative: formData.rv_negative ? parseFloat(formData.rv_negative) : null,
        interest: formData.interest || null,
        indications: formData.indications || null, // <- envoyé à Supabase
        created_by: user?.id
      })

      if (error) throw error

      alert('Test créé avec succès !')
      router.push('/tests')
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]*)/)
    return match ? match[1] : null
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Nouveau test orthopédique
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Ajoutez un test à la base de données
                  </p>
                </div>
              </div>
              <Clipboard className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                <Info className="h-5 w-5 text-primary-600" />
                Informations générales
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du test *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Test de Lachman"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Région anatomique *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Sélectionner une région...</option>
                    {Object.entries(BODY_REGIONS).map(([mainCategory, subCategories]) => (
                      <optgroup key={mainCategory} label={mainCategory}>
                        {subCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Cette catégorie permettra d'organiser les tests par région
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Description détaillée du test et de sa réalisation..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PlayCircle className="h-4 w-4 inline mr-1" />
                  URL de la vidéo YouTube
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                {formData.video_url && extractYoutubeId(formData.video_url) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                    <div className="aspect-video max-w-md rounded-lg overflow-hidden bg-gray-100">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYoutubeId(formData.video_url)}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" />
                Statistiques du test
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sensibilité (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.sensitivity}
                    onChange={(e) => setFormData({ ...formData, sensitivity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: 85.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Capacité à détecter les vrais positifs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécificité (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.specificity}
                    onChange={(e) => setFormData({ ...formData, specificity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: 92.3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Capacité à détecter les vrais négatifs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RV+ (Rapport de vraisemblance positif)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rv_positive}
                    onChange={(e) => setFormData({ ...formData, rv_positive: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: 5.2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Augmentation de probabilité si test positif
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RV- (Rapport de vraisemblance négatif)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rv_negative}
                    onChange={(e) => setFormData({ ...formData, rv_negative: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: 0.15"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Diminution de probabilité si test négatif
                  </p>
                </div>
              </div>
            </div>

            {/* Intérêt clinique & Indications */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b">
                Intérêt clinique & Indications
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intérêt clinique
                  </label>
                  <textarea
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Précisez l'intérêt clinique du test..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indications principales
                  </label>
                  <textarea
                    value={formData.indications}
                    onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Situations cliniques où le test est particulièrement utile..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {saving && <Loader2 className="animate-spin h-4 w-4" />}
                <Save className="h-4 w-4" />
                <span>{saving ? 'Création...' : 'Créer le test'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
