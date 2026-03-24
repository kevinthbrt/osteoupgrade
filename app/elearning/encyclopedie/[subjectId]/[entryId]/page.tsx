'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import FreeContentGate from '@/components/FreeContentGate'
import { extractVimeoId } from '@/lib/vimeo'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Play,
} from 'lucide-react'

type EntryImage = { url: string; caption?: string }

type Entry = {
  id: string
  subject_id: string
  parent_id: string | null
  title: string
  content_html: string | null
  vimeo_url: string | null
  images: EntryImage[] | null
  order_index: number
  is_free_access: boolean
}

type Subject = {
  id: string
  title: string
  color: string | null
  is_free_access: boolean
}

type BreadcrumbItem = {
  id: string
  title: string
}

export default function EntryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params?.subjectId as string
  const entryId = params?.entryId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [siblings, setSiblings] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('free')

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileData) setUserRole(profileData.role)

      // Load subject
      const { data: subjectData } = await supabase
        .from('encyclopedia_subjects')
        .select('id, title, color, is_free_access')
        .eq('id', subjectId)
        .single()

      if (!subjectData) { router.push('/elearning/encyclopedie'); return }
      setSubject(subjectData)

      // Load entry
      const { data: entryData } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (!entryData) { router.push(`/elearning/encyclopedie/${subjectId}`); return }
      setEntry(entryData)

      // Build breadcrumb by walking up parent_id chain
      const crumbs: BreadcrumbItem[] = []
      let currentParentId = entryData.parent_id

      while (currentParentId) {
        const { data: parentData } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, parent_id')
          .eq('id', currentParentId)
          .single()

        if (parentData) {
          crumbs.unshift({ id: parentData.id, title: parentData.title })
          currentParentId = parentData.parent_id
        } else {
          break
        }
      }

      setBreadcrumb(crumbs)

      // Load siblings for prev/next navigation
      const { data: siblingsData } = await supabase
        .from('encyclopedia_entries')
        .select('id, title, order_index, parent_id')
        .eq('subject_id', subjectId)
        .eq('parent_id', entryData.parent_id ?? '')
        .order('order_index', { ascending: true })

      // If parent_id is null, we need a different query
      if (entryData.parent_id === null) {
        const { data: rootSiblings } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, order_index, parent_id')
          .eq('subject_id', subjectId)
          .is('parent_id', null)
          .order('order_index', { ascending: true })
        setSiblings((rootSiblings || []) as Entry[])
      } else {
        setSiblings((siblingsData || []) as Entry[])
      }
    } catch (err) {
      console.error('Erreur chargement fiche:', err)
    } finally {
      setLoading(false)
    }
  }, [subjectId, entryId, router])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!subject || !entry) return null

  const gradient = subject.color || 'from-purple-500 to-indigo-600'
  const vimeoId = extractVimeoId(entry.vimeo_url)
  const isFreeUser = userRole === 'free'
  const locked = isFreeUser && !entry.is_free_access

  // Prev/next navigation
  const currentIndex = siblings.findIndex(s => s.id === entry.id)
  const prevEntry = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextEntry = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {subject.title}
        </button>

        <FreeContentGate isLocked={locked}>
          {/* Fiche Card */}
          <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6 border-b-4 border-black/10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookMarked className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
                    Encyclopédie OsteoUpgrade
                  </h1>
                  <p className="text-white/80 text-sm font-medium">
                    {subject.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
              <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="hover:text-purple-600 transition font-medium"
                >
                  {subject.title}
                </button>
                {breadcrumb.map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-400">{crumb.title}</span>
                  </span>
                ))}
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-800">{entry.title}</span>
              </nav>
            </div>

            {/* Title section */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {entry.title}
              </h2>
            </div>

            {/* Vimeo Video */}
            {vimeoId && (
              <div className="px-8 py-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900 aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={entry.title}
                  />
                </div>
              </div>
            )}

            {/* Rich text content */}
            {entry.content_html && (
              <div className="px-8 py-6">
                <div
                  className="prose prose-lg prose-slate max-w-none
                    prose-headings:text-slate-900 prose-headings:font-bold
                    prose-h2:text-2xl prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-purple-500 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:text-purple-900
                    prose-p:text-slate-700 prose-p:leading-relaxed
                    prose-strong:text-slate-900
                    prose-ul:space-y-1 prose-li:text-slate-700
                    prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:rounded-xl prose-blockquote:py-1 prose-blockquote:px-4
                    prose-table:rounded-xl prose-table:overflow-hidden
                    prose-th:bg-purple-100 prose-th:text-purple-900
                    prose-td:border-slate-200"
                  dangerouslySetInnerHTML={{ __html: entry.content_html }}
                />
              </div>
            )}

            {/* Images */}
            {entry.images && entry.images.length > 0 && (
              <div className="px-8 py-4">
                <div className="space-y-6">
                  {entry.images.map((img, idx) => (
                    <figure key={idx} className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
                      <img
                        src={img.url}
                        alt={img.caption || entry.title}
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
              </div>
            )}

            {/* Prev/Next Navigation */}
            {(prevEntry || nextEntry) && (
              <div className="px-8 py-6 border-t border-slate-200">
                <div className="flex justify-between gap-4">
                  {prevEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${prevEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-left flex-1 max-w-xs"
                    >
                      <ArrowLeft className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">Précédent</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{prevEntry.title}</div>
                      </div>
                    </button>
                  ) : <div />}

                  {nextEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${nextEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-right flex-1 max-w-xs ml-auto"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500">Suivant</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{nextEntry.title}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.svg"
                    alt="Ostéo-Upgrade"
                    className="h-10 w-10 rounded-lg bg-white p-1.5"
                  />
                  <div>
                    <p className="text-white font-bold">Encyclopédie OsteoUpgrade</p>
                    <p className="text-white/70 text-sm">{subject.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition border border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </div>
            </div>
          </article>
        </FreeContentGate>
      </div>
    </AuthLayout>
  )
}
