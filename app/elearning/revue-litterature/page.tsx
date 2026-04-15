'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import LiteratureReviewEditor from './components/LiteratureReviewEditor'
import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Shield,
  Sparkles,
  Tag,
  X
} from 'lucide-react'
import FreeContentGate from '@/components/FreeContentGate'

type ReviewImage = {
  url: string
  position: 'hero' | 'introduction' | 'contexte' | 'methodologie' | 'resultats' | 'conclusion'
  caption?: string
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
  images?: ReviewImage[]
  study_url?: string
  published_date: string
  is_featured: boolean
  created_at: string
  tags: ReviewTag[]
}

type ReviewTag = {
  id: string
  name: string
  slug: string
  color: string
}

type Profile = {
  id: string
  role: string
  full_name?: string
}

export default function RevueLitteraturePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<LiteratureReview[]>([])
  const [allTags, setAllTags] = useState<ReviewTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [showEditor, setShowEditor] = useState(false)
  const [reviewToEdit, setReviewToEdit] = useState<LiteratureReview | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single()

      setProfile(profileData as Profile)

      await loadReviews()
      await loadTags()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('literature_reviews')
        .select(
          `
          *,
          tags:literature_review_tag_associations(
            tag:literature_review_tags(id, name, slug, color)
          )
        `
        )
        .order('published_date', { ascending: false })

      if (error) throw error

      if (data) {
        const parsed: LiteratureReview[] = data.map((review: any) => ({
          id: review.id,
          title: review.title,
          summary: review.summary,
          content_html: review.content_html,
          content_structured: review.content_structured,
          image_url: review.image_url,
          images: review.images,
          study_url: review.study_url,
          published_date: review.published_date,
          is_featured: review.is_featured,
          created_at: review.created_at,
          tags: (review.tags || []).map((t: any) => t.tag).filter(Boolean)
        }))

        setReviews(parsed)
      }
    } catch (error) {
      console.error('Erreur de chargement des articles', error)
      setReviews([])
    }
  }

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('literature_review_tags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setAllTags((data || []) as ReviewTag[])
    } catch (error) {
      console.error('Erreur de chargement des tags', error)
      setAllTags([])
    }
  }

  const isAdmin = profile?.role === 'admin'
  const isFree = profile?.role === 'free'

  const isEpauleReview = (review: LiteratureReview) => {
    const tagNames = review.tags.map((t) => t.name.toLowerCase())
    const tagSlugs = review.tags.map((t) => t.slug.toLowerCase())
    return [...tagNames, ...tagSlugs].some((s) => {
      const normalized = s.includes('epaule') || s.includes('épaule') || s.includes('epaul')
      return normalized
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
  }

  const getUniqueMonths = () => {
    const months = reviews.map((r) => r.published_date.slice(0, 7)) // YYYY-MM
    return Array.from(new Set(months)).sort().reverse()
  }

  const filteredReviews = reviews.filter((review) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const haystack = `${review.title} ${review.summary}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const reviewTagSlugs = review.tags.map((t) => t.slug)
      if (!selectedTags.some((slug) => reviewTagSlugs.includes(slug))) return false
    }

    // Month filter
    if (selectedMonth) {
      if (!review.published_date.startsWith(selectedMonth)) return false
    }

    return true
  })

  const featuredReview = filteredReviews.find((r) => r.is_featured)
  const otherReviews = filteredReviews.filter((r) => !r.is_featured)

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const clearFilters = () => {
    setSelectedTags([])
    setSelectedMonth('')
    setSearchTerm('')
  }

  const hasActiveFilters = selectedTags.length > 0 || selectedMonth || searchTerm

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {/* Editor Modal — outside page wrapper */}
      {showEditor && (
        <LiteratureReviewEditor
          existingReview={reviewToEdit || undefined}
          allTags={allTags}
          onClose={() => {
            setShowEditor(false)
            setReviewToEdit(null)
          }}
          onSuccess={() => {
            setShowEditor(false)
            setReviewToEdit(null)
            loadData()
          }}
        />
      )}

      {/* Full-bleed wrapper */}
      <div className="min-h-screen -m-6 md:-m-8">

        {/* Dark header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          {/* Blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Glow lines */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />

          {/* Glass panel */}
          <div className="relative bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-4xl">
                {/* Label */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-300" />
                  <span className="text-xs font-semibold text-indigo-300">
                    Recherche &amp; Publications
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-violet-200">
                  La revue OsteoUpgrade
                </h1>

                <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                  Découvrez les dernières études scientifiques en ostéopathie et thérapie manuelle. Analyses détaillées, méthodologie expliquée et applications pratiques pour votre cabinet.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <FileText className="h-4 w-4" />
                    <span>{reviews.length} {reviews.length > 1 ? 'articles' : 'article'}</span>
                  </div>
                  {isAdmin && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600">
                      <Shield className="h-4 w-4" />
                      Mode Administration
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setReviewToEdit(null)
                    setShowEditor(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 backdrop-blur-sm border border-indigo-400/30 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-600/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Nouvel article
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Light body */}
        <div className="relative bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          {/* Blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6">

            {/* Filters Section */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900">Filtres</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un article..."
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Thématiques</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.slug)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.slug)}
                        className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-500/90 border border-indigo-400/30 text-white rounded-xl shadow-md'
                            : 'bg-white/70 border border-white/60 text-slate-600 hover:bg-white/90 rounded-xl'
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

              {/* Month filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Période</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full md:w-64 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                >
                  <option value="">Tous les mois</option>
                  {getUniqueMonths().map((month) => {
                    const date = new Date(month + '-01')
                    const label = date.toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long'
                    })
                    return (
                      <option key={month} value={month}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* No results */}
            {filteredReviews.length === 0 && (
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {hasActiveFilters ? 'Aucun article trouvé' : 'Aucun article publié'}
                </h3>
                <p className="text-slate-600">
                  {hasActiveFilters
                    ? 'Essayez de modifier vos critères de recherche.'
                    : 'Les articles de revue de littérature apparaîtront ici.'}
                </p>
              </div>
            )}

            {/* Featured Article (Magazine style) */}
            {featuredReview && (
              <FreeContentGate isLocked={isFree && !isEpauleReview(featuredReview)}>
                <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-0.5">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto bg-gradient-to-br from-indigo-100 to-violet-100">
                      {featuredReview.image_url ? (
                        <img
                          src={featuredReview.image_url}
                          alt={featuredReview.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="h-24 w-24 text-indigo-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          Article vedette
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(featuredReview.published_date)}</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                          {featuredReview.title}
                        </h2>

                        <p className="text-slate-700 mb-6 leading-relaxed">
                          {featuredReview.summary}
                        </p>

                        {/* Tags */}
                        {featuredReview.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {featuredReview.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => router.push(`/elearning/revue-litterature/${featuredReview.id}`)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500/90 backdrop-blur-sm border border-indigo-400/30 text-white rounded-xl font-semibold hover:bg-indigo-600/90 shadow-sm transition-all"
                        >
                          Lire l'article
                          <FileText className="h-4 w-4" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setReviewToEdit(featuredReview)
                              setShowEditor(true)
                            }}
                            className="px-4 py-3 bg-white/70 border border-white/60 text-slate-700 rounded-xl font-semibold hover:bg-white/90 transition-all"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FreeContentGate>
            )}

            {/* Other Articles (List) */}
            {otherReviews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-indigo-500" />
                  Tous les articles
                </h2>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherReviews.map((review) => (
                    <FreeContentGate key={review.id} isLocked={isFree && !isEpauleReview(review)}>
                      <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-0.5 group">
                        {/* Image */}
                        <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-violet-50">
                          {review.image_url ? (
                            <img
                              src={review.image_url}
                              alt={review.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BookOpen className="h-16 w-16 text-indigo-200" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(review.published_date)}</span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                            {review.title}
                          </h3>

                          <p className="text-sm text-slate-600 line-clamp-3">
                            {review.summary}
                          </p>

                          {/* Tags */}
                          {review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {review.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {review.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                                  +{review.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => router.push(`/elearning/revue-litterature/${review.id}`)}
                              className="flex-1 px-4 py-2 bg-indigo-500/90 backdrop-blur-sm border border-indigo-400/30 text-white rounded-xl font-semibold hover:bg-indigo-600/90 shadow-sm transition-all text-sm"
                            >
                              Lire
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setReviewToEdit(review)
                                  setShowEditor(true)
                                }}
                                className="px-4 py-2 bg-white/70 border border-white/60 text-slate-700 rounded-xl font-semibold hover:bg-white/90 transition-all text-sm"
                              >
                                Modifier
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </FreeContentGate>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
