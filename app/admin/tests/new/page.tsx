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
    indications: '',
    sources: '' // 🔹 nouveau champ
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

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
      const {
        data: { user }
      } = await supabase.auth.getUser()

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
        indications: formData.indications || null,
        sources: formData.sources || null, // 🔹 envoyé à Supabase
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
      <div className="min-h-screen -m-6 md:-m-8">
        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/8 rounded-3xl p-6 md:p-8">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-4 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide">
                <Clipboard className="h-4 w-4 inline mr-1" />
                Admin — Tests orthopédiques
              </p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Nouveau test orthopédique
              </h1>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>

        {/* Light glass body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30 flex items-center gap-2">
                  <Info className="h-5 w-5 text-purple-500" />
                  Informations générales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom du test *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Ex: Test de Lachman"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Région anatomique *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      required
                    >
                      <option value="">Sélectionner une région...</option>
                      {Object.entries(BODY_REGIONS).map(
                        ([mainCategory, subCategories]) => (
                          <optgroup key={mainCategory} label={mainCategory}>
                            {subCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Cette catégorie permettra d&apos;organiser les tests par région
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                    placeholder="Description détaillée du test et de sa réalisation..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <PlayCircle className="h-4 w-4 inline mr-1" />
                    URL de la vidéo YouTube
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) =>
                        setFormData({ ...formData, video_url: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  {formData.video_url && extractYoutubeId(formData.video_url) && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 mb-2">Aperçu :</p>
                      <div className="aspect-video max-w-md rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(
                            formData.video_url
                          )}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Statistiques du test
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sensibilité (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.sensitivity}
                      onChange={(e) =>
                        setFormData({ ...formData, sensitivity: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Ex: 85.5"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Capacité à détecter les vrais positifs
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Spécificité (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.specificity}
                      onChange={(e) =>
                        setFormData({ ...formData, specificity: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Ex: 92.3"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Capacité à détecter les vrais négatifs
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      RV+ (Rapport de vraisemblance positif)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rv_positive}
                      onChange={(e) =>
                        setFormData({ ...formData, rv_positive: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Ex: 5.2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Augmentation de probabilité si test positif
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      RV- (Rapport de vraisemblance négatif)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rv_negative}
                      onChange={(e) =>
                        setFormData({ ...formData, rv_negative: e.target.value })
                      }
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Ex: 0.15"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Diminution de probabilité si test négatif
                    </p>
                  </div>
                </div>
              </div>

              {/* Intérêt clinique & Indications */}
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30">
                  Intérêt clinique & Indications
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Intérêt clinique
                    </label>
                    <textarea
                      value={formData.interest}
                      onChange={(e) =>
                        setFormData({ ...formData, interest: e.target.value })
                      }
                      rows={4}
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Précisez l'intérêt clinique du test..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Indications principales
                    </label>
                    <textarea
                      value={formData.indications}
                      onChange={(e) =>
                        setFormData({ ...formData, indications: e.target.value })
                      }
                      rows={4}
                      className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                      placeholder="Situations cliniques où le test est particulièrement utile..."
                    />
                  </div>
                </div>
              </div>

              {/* Sources */}
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-white/30">
                  Sources
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Références / Sources
                  </label>
                  <textarea
                    value={formData.sources}
                    onChange={(e) =>
                      setFormData({ ...formData, sources: e.target.value })
                    }
                    rows={4}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none w-full"
                    placeholder={'Ex :\nHegedus EJ et al., 2012, J Orthop Sports Phys Ther...\nCook C et al., 2010, Manual Therapy...'}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Tu peux mettre une source par ligne (article, livre, site…)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90 font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4" />}
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Création...' : 'Créer le test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
