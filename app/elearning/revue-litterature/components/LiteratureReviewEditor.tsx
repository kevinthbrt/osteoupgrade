'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, Loader2, Save, AlertCircle, Star } from 'lucide-react'

type ReviewTag = {
  id: string
  name: string
  slug: string
  color: string
}

type LiteratureReview = {
  id: string
  title: string
  summary: string
  content_html: string
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

export default function LiteratureReviewEditor({ existingReview, allTags, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(existingReview?.title || '')
  const [summary, setSummary] = useState(existingReview?.summary || '')
  const [content, setContent] = useState(existingReview?.content_html || '')
  const [studyUrl, setStudyUrl] = useState(existingReview?.study_url || '')
  const [publishedDate, setPublishedDate] = useState(
    existingReview?.published_date || new Date().toISOString().split('T')[0]
  )
  const [isFeatured, setIsFeatured] = useState(existingReview?.is_featured || false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    existingReview?.tags.map((t) => t.id) || []
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
    if (!content.trim()) {
      setError('Le contenu est obligatoire')
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

      // Upsert the review
      const reviewData = {
        title: title.trim(),
        summary: summary.trim(),
        content_html: content.trim(),
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {existingReview ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
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
              Résumé *
              <span className="text-xs text-slate-500 font-normal ml-2">
                (150-300 caractères recommandés)
              </span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Résumé court qui apparaîtra sur la page principale..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">{summary.length} caractères</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contenu de l'article *
              <span className="text-xs text-slate-500 font-normal ml-2">
                (HTML supporté)
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Contenu détaillé de l'article avec analyse de l'étude...</p>
<h3>Méthodologie</h3>
<p>...</p>
<h3>Résultats</h3>
<p>...</p>"
              rows={12}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-mono text-sm"
            />
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
              Mettre en article vedette (grand format sur la page principale)
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
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'text-white shadow-md ring-2 ring-offset-2'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: tag.color, ringColor: tag.color }
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
