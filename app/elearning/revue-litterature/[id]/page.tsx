'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  Loader2,
  Tag,
  User
} from 'lucide-react'

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
          content_html: data.content_html,
          image_url: data.image_url,
          study_url: data.study_url,
          published_date: data.published_date,
          is_featured: data.is_featured,
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium shadow-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux articles
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
            <BookOpen className="h-16 w-16 text-red-300 mx-auto mb-4" />
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

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/elearning/revue-litterature')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux articles
        </button>

        {/* Article Container */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Hero Image */}
          {review.image_url && (
            <div className="relative w-full h-96 bg-gradient-to-br from-emerald-100 to-teal-100">
              <img
                src={review.image_url}
                alt={review.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12 space-y-6">
            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={review.published_date}>
                  {formatDate(review.published_date)}
                </time>
              </div>

              {review.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              {review.title}
            </h1>

            {/* Summary */}
            <p className="text-xl text-slate-700 leading-relaxed border-l-4 border-emerald-500 pl-6 py-2 bg-emerald-50/50">
              {review.summary}
            </p>

            {/* Study link */}
            {review.study_url && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Étude originale
                    </p>
                    <a
                      href={review.study_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-900 underline break-words"
                    >
                      {review.study_url}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <hr className="border-slate-200" />

            {/* Main content */}
            <div
              className="prose prose-slate prose-lg max-w-none
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-ul:my-4 prose-ol:my-4
                prose-li:text-slate-700
                prose-blockquote:border-l-4 prose-blockquote:border-emerald-500
                prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1
                prose-code:text-emerald-700 prose-code:bg-emerald-50
                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: review.content_html }}
            />
          </div>
        </article>

        {/* Back button at bottom */}
        <div className="text-center pb-8">
          <button
            onClick={() => router.push('/elearning/revue-litterature')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux articles
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
