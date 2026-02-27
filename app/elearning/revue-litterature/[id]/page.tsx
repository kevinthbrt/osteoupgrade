'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  Tag,
  Share2
} from 'lucide-react'

type ReviewTag = {
  id: string
  name: string
  slug: string
  color: string
}

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
  content_structured?: StructuredContent
  images?: ReviewImage[]
  study_url?: string
  published_date: string
  created_at: string
  tags: ReviewTag[]
}

export default function LiteratureReviewDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reviewId = params?.id as string

  const [review, setReview] = useState<LiteratureReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReview()
  }, [reviewId])

  const loadReview = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('literature_reviews')
        .select(
          `
          *,
          tags:literature_review_tag_associations(
            tag:literature_review_tags(id, name, slug, color)
          )
        `
        )
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Article non trouvé')
        } else {
          throw fetchError
        }
        return
      }

      if (data) {
        const parsed: LiteratureReview = {
          id: data.id,
          title: data.title,
          summary: data.summary,
          content_structured: data.content_structured,
          images: data.images || [],
          study_url: data.study_url,
          published_date: data.published_date,
          created_at: data.created_at,
          tags: (data.tags || []).map((t: any) => t.tag).filter(Boolean)
        }

        setReview(parsed)
      }
    } catch (err) {
      console.error('Erreur de chargement de l\'article:', err)
      setError('Erreur de chargement de l\'article')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getImagesByPosition = (position: ReviewImage['position']) => {
    return review?.images?.filter(img => img.position === position) || []
  }

  const ImageBlock = ({ images }: { images: ReviewImage[] }) => {
    if (images.length === 0) return null

    return (
      <div className="my-8 space-y-4">
        {images.map((img, idx) => (
          <figure key={idx} className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src={img.url}
              alt={img.caption || ''}
              className="w-full h-auto object-cover"
            />
            {img.caption && (
              <figcaption className="px-4 py-3 bg-slate-50 text-sm text-slate-600 italic border-t border-slate-200">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    )
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

  if (error || !review) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/elearning/revue-litterature')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux articles
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              {error || 'Article non trouvé'}
            </h2>
            <p className="text-red-700">
              Cet article n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  const heroImages = getImagesByPosition('hero')
  const content = review.content_structured

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/elearning/revue-litterature')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        {/* Magazine Container */}
        <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Magazine Header - Brand Identity */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-8 py-6 border-b-4 border-emerald-700">
            <div className="flex items-center gap-4">
              <img
                src="/favicon.svg"
                alt="Ostéo-Upgrade"
                className="h-12 w-12 rounded-lg bg-white p-1.5"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  LA REVUE OSTEOUPGRADE
                </h1>
                <p className="text-emerald-100 text-sm font-medium">
                  Ostéo-Upgrade • Recherche & Evidence-Based Practice
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          {heroImages.length > 0 && (
            <div className="relative h-[500px] bg-gradient-to-br from-emerald-100 to-teal-100">
              <img
                src={heroImages[0].url}
                alt={review.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Floating Title on Image */}
              <div className="absolute bottom-0 left-0 right-0 p-12">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                    {review.title}
                  </h2>
                  <p className="text-xl text-white/90 leading-relaxed drop-shadow-md whitespace-pre-line">
                    {review.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Article without Hero Image */}
          {heroImages.length === 0 && (
            <div className="px-12 pt-12 pb-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-b border-slate-200">
              <div className="max-w-4xl">
                <div className="flex flex-wrap gap-2 mb-6">
                  {review.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  {review.title}
                </h2>
                <p className="text-xl text-slate-700 leading-relaxed border-l-4 border-emerald-500 pl-6 py-2 bg-emerald-50/50 whitespace-pre-line">
                  {review.summary}
                </p>
              </div>
            </div>
          )}

          {/* Article Meta */}
          <div className="px-12 py-6 bg-slate-50 border-b border-slate-200">
            <div className="max-w-4xl flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={review.published_date}>
                  {formatDate(review.published_date)}
                </time>
              </div>

              {review.study_url && (
                <a
                  href={review.study_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lire l'étude originale
                </a>
              )}
            </div>
          </div>

          {/* Main Content - Magazine Layout */}
          <div className="px-12 py-12">
            <div className="max-w-4xl space-y-12">
              {/* Introduction */}
              {content?.introduction && (
                <section>
                  <p className="text-xl leading-relaxed text-slate-800 font-serif whitespace-pre-line first-letter:text-6xl first-letter:font-bold first-letter:text-emerald-600 first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:mt-1">
                    {content.introduction}
                  </p>
                  <ImageBlock images={getImagesByPosition('introduction')} />
                </section>
              )}

              {/* Contexte */}
              {content?.contexte && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-500">
                    Contexte
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
                    {content.contexte}
                  </p>
                  <ImageBlock images={getImagesByPosition('contexte')} />
                </section>
              )}

              {/* Méthodologie */}
              {content?.methodologie && (
                <section className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-blue-600 rounded-full" />
                    <h3 className="text-2xl font-bold text-blue-900">
                      Méthodologie
                    </h3>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
                    {content.methodologie}
                  </p>
                  <ImageBlock images={getImagesByPosition('methodologie')} />
                </section>
              )}

              {/* Résultats */}
              {content?.resultats && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-500">
                    Résultats
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
                    {content.resultats}
                  </p>
                  <ImageBlock images={getImagesByPosition('resultats')} />
                </section>
              )}

              {/* Implications Cliniques - Highlighted */}
              {content?.implications && (
                <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
                    <h3 className="text-2xl font-bold text-emerald-900">
                      💡 Implications Cliniques
                    </h3>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-800 font-medium whitespace-pre-line">
                    {content.implications}
                  </p>
                </section>
              )}

              {/* Points Clés - Styled Box */}
              {content?.points_cles && content.points_cles.length > 0 && (
                <section className="bg-white rounded-2xl p-8 border-2 border-emerald-300 shadow-xl">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white text-lg">
                      ✓
                    </span>
                    Points Clés à Retenir
                  </h3>
                  <ul className="space-y-4">
                    {content.points_cles.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                          {idx + 1}
                        </span>
                        <span className="text-lg text-slate-700 leading-relaxed pt-0.5">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Conclusion */}
              {content?.conclusion && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-500">
                    Conclusion
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
                    {content.conclusion}
                  </p>
                  <ImageBlock images={getImagesByPosition('conclusion')} />
                </section>
              )}

              {/* Study Link CTA */}
              {review.study_url && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
                  <h4 className="text-xl font-bold mb-3">
                    Envie d'approfondir ?
                  </h4>
                  <p className="text-blue-100 mb-4">
                    Consultez l'étude scientifique complète publiée dans la revue scientifique.
                  </p>
                  <a
                    href={review.study_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition shadow-lg"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Accéder à l'étude originale
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Magazine Footer - Brand Identity */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-12 py-8 border-t-4 border-emerald-500">
            <div className="max-w-4xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/favicon.svg"
                  alt="Ostéo-Upgrade"
                  className="h-10 w-10 rounded-lg bg-white p-1.5"
                />
                <div>
                  <p className="text-white font-bold">
                    La revue OsteoUpgrade
                  </p>
                  <p className="text-slate-400 text-sm">
                    Recherche scientifique pour praticiens
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/elearning/revue-litterature')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Tous les articles
              </button>
            </div>
          </div>
        </article>
      </div>
    </AuthLayout>
  )
}
