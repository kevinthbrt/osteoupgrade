'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, Loader2, Save, AlertCircle, Star, Plus, Trash2 } from 'lucide-react'

type ReviewTag = {
  id: string
  name: string
  slug: string
  color: string
}

type StructuredContent = {
  introduction: string
  contexte: string
  methodologie: string
  resultats: string
  implications: string
  conclusion: string
  points_cles: string[]
}

type LiteratureReview = {
  id: string
  title: string
  summary: string
  content_html: string
  content_structured?: StructuredContent
  image_url?: string
  study_url?: string
  published_date: string
  is_featured: boolean
  tags: ReviewTag[]
}

type Props = {
  existingReview?: LiteratureReview
  allTags: ReviewTag[]
  onClose: () => void
  onSuccess: () => void
}

// Fonction pour générer le HTML depuis le contenu structuré
const generateHTMLFromStructured = (content: StructuredContent): string => {
  let html = ''

  if (content.introduction) {
    html += `<p class="lead">${content.introduction.replace(/\n/g, '</p><p class="lead">')}</p>\n\n`
  }

  if (content.contexte) {
    html += `<h3>Contexte</h3>\n`
    html += `<p>${content.contexte.replace(/\n/g, '</p><p>')}</p>\n\n`
  }

  if (content.methodologie) {
    html += `<h3>Méthodologie</h3>\n`
    html += `<p>${content.methodologie.replace(/\n/g, '</p><p>')}</p>\n\n`
  }

  if (content.resultats) {
    html += `<h3>Résultats</h3>\n`
    html += `<p>${content.resultats.replace(/\n/g, '</p><p>')}</p>\n\n`
  }

  if (content.implications) {
    html += `<h3>Implications Cliniques</h3>\n`
    html += `<p>${content.implications.replace(/\n/g, '</p><p>')}</p>\n\n`
  }

  if (content.points_cles && content.points_cles.length > 0) {
    html += `<h3>Points Clés à Retenir</h3>\n`
    html += `<ul>\n`
    content.points_cles.forEach(point => {
      if (point.trim()) {
        html += `  <li>${point}</li>\n`
      }
    })
    html += `</ul>\n\n`
  }

  if (content.conclusion) {
    html += `<h3>Conclusion</h3>\n`
    html += `<p>${content.conclusion.replace(/\n/g, '</p><p>')}</p>`
  }

  return html
}

export default function LiteratureReviewEditor({ existingReview, allTags, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(existingReview?.title || '')
  const [summary, setSummary] = useState(existingReview?.summary || '')
  const [studyUrl, setStudyUrl] = useState(existingReview?.study_url || '')
  const [publishedDate, setPublishedDate] = useState(
    existingReview?.published_date || new Date().toISOString().split('T')[0]
  )
  const [isFeatured, setIsFeatured] = useState(existingReview?.is_featured || false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    existingReview?.tags.map((t) => t.id) || []
  )

  // Contenu structuré
  const [introduction, setIntroduction] = useState(
    existingReview?.content_structured?.introduction || ''
  )
  const [contexte, setContexte] = useState(
    existingReview?.content_structured?.contexte || ''
  )
  const [methodologie, setMethodologie] = useState(
    existingReview?.content_structured?.methodologie || ''
  )
  const [resultats, setResultats] = useState(
    existingReview?.content_structured?.resultats || ''
  )
  const [implications, setImplications] = useState(
    existingReview?.content_structured?.implications || ''
  )
  const [conclusion, setConclusion] = useState(
    existingReview?.content_structured?.conclusion || ''
  )
  const [pointsCles, setPointsCles] = useState<string[]>(
    existingReview?.content_structured?.points_cles || ['']
  )

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | undefined>(existingReview?.image_url)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const addPointCle = () => {
    setPointsCles([...pointsCles, ''])
  }

  const removePointCle = (index: number) => {
    setPointsCles(pointsCles.filter((_, i) => i !== index))
  }

  const updatePointCle = (index: number, value: string) => {
    const newPoints = [...pointsCles]
    newPoints[index] = value
    setPointsCles(newPoints)
  }

  const handleSave = async () => {
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Le titre est obligatoire')
      return
    }
    if (!summary.trim()) {
      setError('Le résumé est obligatoire')
      return
    }
    if (!introduction.trim()) {
      setError('L\'introduction est obligatoire')
      return
    }
    if (!publishedDate) {
      setError('La date de publication est obligatoire')
      return
    }

    setSaving(true)

    try {
      let imageUrl = existingReview?.image_url

      // Upload image if a new one is selected
      if (imageFile) {
        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', imageFile)

        const response = await fetch('/api/literature-review-image-upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Échec du téléchargement de l\'image')
        }

        const { url } = await response.json()
        imageUrl = url
        setUploadingImage(false)
      }

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Créer le contenu structuré
      const structuredContent: StructuredContent = {
        introduction,
        contexte,
        methodologie,
        resultats,
        implications,
        conclusion,
        points_cles: pointsCles.filter(p => p.trim() !== '')
      }

      // Générer le HTML
      const contentHtml = generateHTMLFromStructured(structuredContent)

      // Upsert the review
      const reviewData = {
        title: title.trim(),
        summary: summary.trim(),
        content_html: contentHtml,
        content_structured: structuredContent,
        image_url: imageUrl,
        study_url: studyUrl.trim() || null,
        published_date: publishedDate,
        is_featured: isFeatured,
        created_by: user.id,
        ...(existingReview ? { id: existingReview.id } : {})
      }

      const { data: savedReview, error: reviewError } = await supabase
        .from('literature_reviews')
        .upsert(reviewData)
        .select()
        .single()

      if (reviewError) throw reviewError

      // Update tag associations
      const reviewId = savedReview.id

      // Delete existing associations
      await supabase
        .from('literature_review_tag_associations')
        .delete()
        .eq('review_id', reviewId)

      // Insert new associations
      if (selectedTagIds.length > 0) {
        const associations = selectedTagIds.map((tagId) => ({
          review_id: reviewId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('literature_review_tag_associations')
          .insert(associations)

        if (tagError) throw tagError
      }

      onSuccess()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingReview) return

    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.'
      )
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from('literature_reviews')
        .delete()
        .eq('id', existingReview.id)

      if (error) throw error

      onSuccess()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setError('Erreur lors de la suppression')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {existingReview ? 'Modifier l\'article' : 'Nouvel article'}
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              La revue mensuelle ostéo-upgrade
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Remplissez simplement les champs ci-dessous.</strong> Le format magazine sera automatiquement généré avec une mise en page professionnelle.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Titre de l'article *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Efficacité des manipulations vertébrales dans les lombalgies chroniques"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Résumé accrocheur *
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (150-300 caractères recommandés)
                  </span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Une accroche qui donne envie de lire l'article..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">{summary.length} caractères</p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Image d'illustration
                </label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-200 transition cursor-pointer">
                    <Upload className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {imagePreview ? 'Changer l\'image' : 'Télécharger une image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Study URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lien vers l'étude originale
                </label>
                <input
                  type="url"
                  value={studyUrl}
                  onChange={(e) => setStudyUrl(e.target.value)}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Published Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date de publication *
                </label>
                <input
                  type="date"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Is Featured */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="is-featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is-featured" className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <Star className="h-4 w-4 text-amber-500" />
                  Article vedette (grand format)
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Thématiques
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'text-white shadow-md ring-2 ring-offset-2'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: tag.color }
                            : {}
                        }
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right column - Structured content */}
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">
                  Contenu de l'article
                </h3>
                <p className="text-sm text-emerald-700">
                  Remplissez les sections ci-dessous. Le format sera automatiquement mis en page.
                </p>
              </div>

              {/* Introduction */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Introduction *
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Présentation générale de l'étude)
                  </span>
                </label>
                <textarea
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  placeholder="Une étude récente publiée dans... Cette recherche explore..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Contexte */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contexte
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Pourquoi cette étude est importante)
                  </span>
                </label>
                <textarea
                  value={contexte}
                  onChange={(e) => setContexte(e.target.value)}
                  placeholder="Les lombalgies chroniques affectent... Les approches actuelles..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Méthodologie */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Méthodologie
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Comment l'étude a été menée)
                  </span>
                </label>
                <textarea
                  value={methodologie}
                  onChange={(e) => setMethodologie(e.target.value)}
                  placeholder="L'étude a inclus 150 participants... Répartis en deux groupes..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Résultats */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Résultats principaux
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Qu'est-ce qui a été découvert)
                  </span>
                </label>
                <textarea
                  value={resultats}
                  onChange={(e) => setResultats(e.target.value)}
                  placeholder="Les résultats montrent une amélioration significative de..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Implications */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Implications cliniques
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Ce que ça change pour la pratique)
                  </span>
                </label>
                <textarea
                  value={implications}
                  onChange={(e) => setImplications(e.target.value)}
                  placeholder="Ces résultats suggèrent que... Les praticiens peuvent..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Points clés */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Points clés à retenir
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Bullet points essentiels)
                  </span>
                </label>
                <div className="space-y-2">
                  {pointsCles.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updatePointCle(index, e.target.value)}
                        placeholder="Point clé..."
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      />
                      {pointsCles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePointCle(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPointCle}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un point clé
                  </button>
                </div>
              </div>

              {/* Conclusion */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Conclusion
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Message final)
                  </span>
                </label>
                <textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Cette étude apporte des preuves solides... Il serait intéressant de..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 rounded-b-2xl flex items-center justify-between border-t border-slate-200">
          <div>
            {existingReview && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                Supprimer l'article
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving || uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadingImage ? 'Upload en cours...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {existingReview ? 'Enregistrer' : 'Publier'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
