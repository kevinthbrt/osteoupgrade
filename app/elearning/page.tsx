'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import CourseCreationWizard from './components/CourseCreationWizard'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock3,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronRight,
  ListChecks,
  PlayCircle,
  Plus,
  Shield,
  Sparkles,
  Video,
  X
} from 'lucide-react'

type Subpart = {
  id: string
  title: string
  vimeo_url?: string
  description_html?: string
  order_index?: number
  completed?: boolean
}

type Chapter = {
  id: string
  title: string
  order_index?: number
  subparts: Subpart[]
}

type Formation = {
  id: string
  title: string
  description?: string
  is_private?: boolean
  chapters: Chapter[]
}

type Profile = {
  id: string
  role: string
  full_name?: string
}

const isValidUuid = (value?: string) => !!value && /^[0-9a-fA-F-]{36}$/.test(value)

const canAccessFormation = (role: string | undefined, isPrivate?: boolean) => {
  if (!role) return false
  if (isPrivate) return role === 'admin'
  return ['premium_silver', 'premium_gold', 'admin'].includes(role)
}

const getVimeoEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('player.vimeo.com')) return url

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const videoId = pathParts[pathParts.length - 1]
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url
  } catch (error) {
    console.warn('URL Vimeo invalide, utilisation directe', error)
    return url
  }
}

const ToolbarButton = ({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50"
  >
    {label}
  </button>
)

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    onChange(editorRef.current.innerHTML)
  }

  const handleInput = () => {
    if (!editorRef.current) return
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <ToolbarButton label="Gras" onClick={() => applyFormat('bold')} />
        <ToolbarButton label="Italique" onClick={() => applyFormat('italic')} />
        <ToolbarButton label="Liste" onClick={() => applyFormat('insertUnorderedList')} />
        <ToolbarButton label="Titre" onClick={() => applyFormat('formatBlock', 'h3')} />
        <select
          className="px-2 py-1 text-sm rounded border border-gray-200 bg-white"
          onChange={(e) => applyFormat('fontSize', e.target.value)}
          defaultValue="16"
        >
          {[12, 14, 16, 20, 24].map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <input
          type="color"
          className="w-10 h-8 border border-gray-200 rounded"
          onChange={(e) => applyFormat('foreColor', e.target.value)}
          aria-label="Choisir une couleur"
        />
      </div>
      <div
        ref={editorRef}
        className="min-h-[140px] p-4 focus:outline-none"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  )
}

export default function ElearningPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [selectedFormationId, setSelectedFormationId] = useState<string>('')
  const subpartRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [formationForm, setFormationForm] = useState({ title: '', description: '', is_private: false })
  const [chapterForm, setChapterForm] = useState({ title: '', order_index: 1, formationId: '' })
  const [subpartForm, setSubpartForm] = useState({
    title: '',
    vimeo_url: '',
    order_index: 1,
    chapterId: '',
    description_html: ''
  })
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingSubpartId, setEditingSubpartId] = useState<string | null>(null)
  const [editFormationForm, setEditFormationForm] = useState({ title: '', description: '', is_private: false })
  const [editChapterForm, setEditChapterForm] = useState({ title: '', order_index: 1 })
  const [editSubpartForm, setEditSubpartForm] = useState({
    title: '',
    vimeo_url: '',
    description_html: '',
    order_index: 1
  })
  const [showFormationModal, setShowFormationModal] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [expandedSubparts, setExpandedSubparts] = useState<Record<string, boolean>>({})
  const [showWizard, setShowWizard] = useState(false)

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

      await loadFormationsFromSupabase(user.id, (profileData as Profile | null)?.role)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFormationsFromSupabase = async (userId: string, role?: string) => {
    const roleToUse = role ?? profile?.role

    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .select(
          `id, title, description, is_private,
          chapters:elearning_chapters(id, title, order_index,
            subparts:elearning_subparts(id, title, vimeo_url, description_html, order_index,
              progress:elearning_subpart_progress(user_id, completed_at)
            )
          )`
        )
        .order('title', { ascending: true })

      if (error) throw error

      if (data) {
        const parsed: Formation[] = data.map((formation: any) => ({
          id: formation.id,
          title: formation.title,
          description: formation.description,
          is_private: formation.is_private,
          chapters:
            formation.chapters?.map((chapter: any) => ({
              id: chapter.id,
              title: chapter.title,
              order_index: chapter.order_index,
              subparts:
                chapter.subparts?.map((sub: any) => ({
                  id: sub.id,
                  title: sub.title,
                  vimeo_url: sub.vimeo_url,
                  description_html: sub.description_html,
                  order_index: sub.order_index,
                  completed: (sub.progress || []).some((p: any) => p.user_id === userId)
                })) || []
            })) || []
        }))

        const accessible = parsed.filter((formation) => canAccessFormation(roleToUse, formation.is_private))

        if (accessible.length) {
          setFormations(accessible)
          setSelectedFormationId(accessible[0].id)
          setChapterForm((prev) => ({ ...prev, formationId: accessible[0].id }))
          if (accessible[0].chapters[0]) {
            setSubpartForm((prev) => ({ ...prev, chapterId: accessible[0].chapters[0].id }))
          }
        } else {
          setFormations([])
          setSelectedFormationId('')
          setChapterForm((prev) => ({ ...prev, formationId: '' }))
          setSubpartForm((prev) => ({ ...prev, chapterId: '' }))
        }
      }
    } catch (error) {
      console.error('Erreur de chargement des formations', error)
      setFormations([])
      setSelectedFormationId('')
      setChapterForm((prev) => ({ ...prev, formationId: '' }))
      setSubpartForm((prev) => ({ ...prev, chapterId: '' }))
    }
  }

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId) ?? formations[0],
    [formations, selectedFormationId]
  )

  useEffect(() => {
    if (!selectedFormation || !showFormationModal) return

    const flatSubparts = selectedFormation.chapters.flatMap((chapter) => chapter.subparts)
    const nextSubpart =
      flatSubparts.find((subpart) => !subpart.completed) || flatSubparts[flatSubparts.length - 1]

    const initialChapters: Record<string, boolean> = {}
    const initialSubparts: Record<string, boolean> = {}

    selectedFormation.chapters.forEach((chapter) => {
      initialChapters[chapter.id] = false
      chapter.subparts.forEach((subpart) => {
        initialSubparts[subpart.id] = false
      })
    })

    if (nextSubpart) {
      initialSubparts[nextSubpart.id] = true
      const parentChapter = selectedFormation.chapters.find((chapter) =>
        chapter.subparts.some((sub) => sub.id === nextSubpart.id)
      )
      if (parentChapter) {
        initialChapters[parentChapter.id] = true
      }
    }

    setExpandedChapters(initialChapters)
    setExpandedSubparts(initialSubparts)

    if (nextSubpart?.id && subpartRefs.current[nextSubpart.id]) {
      setTimeout(() => {
        subpartRefs.current[nextSubpart.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }, [selectedFormationId, showFormationModal])

  const computeProgress = (formation?: Formation) => {
    if (!formation) return { total: 0, done: 0, percent: 0 }
    const total = formation.chapters.reduce((acc, chapter) => acc + chapter.subparts.length, 0)
    const done = formation.chapters.reduce(
      (acc, chapter) => acc + chapter.subparts.filter((s) => s.completed).length,
      0
    )
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 }
  }

  const progress = useMemo(() => computeProgress(selectedFormation), [selectedFormation])

  const handleCreateFormation = async () => {
    if (!formationForm.title.trim()) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .insert({
          title: formationForm.title,
          description: formationForm.description,
          is_private: formationForm.is_private
        })
        .select()
        .single()

      if (error) throw error

      const newFormation: Formation = {
        id: data.id,
        title: data.title,
        description: data.description,
        is_private: data.is_private,
        chapters: []
      }

      setFormations((prev) => [...prev, newFormation])
      setSelectedFormationId(newFormation.id)
      setChapterForm((prev) => ({ ...prev, formationId: newFormation.id }))
      setSubpartForm((prev) => ({ ...prev, chapterId: '' }))
      setFormationForm({ title: '', description: '', is_private: false })
    } catch (error) {
      console.error('Impossible de créer la formation', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateChapter = async () => {
    if (!chapterForm.title.trim() || !isValidUuid(chapterForm.formationId)) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_chapters')
        .insert({
          title: chapterForm.title,
          order_index: chapterForm.order_index,
          formation_id: chapterForm.formationId
        })
        .select()
        .single()

      if (error) throw error

      const newChapter: Chapter = { id: data.id, title: data.title, order_index: data.order_index, subparts: [] }

      setFormations((prev) =>
        prev.map((formation) =>
          formation.id === chapterForm.formationId
            ? { ...formation, chapters: [...formation.chapters, newChapter] }
            : formation
        )
      )

      setChapterForm({ title: '', order_index: 1, formationId: chapterForm.formationId })
      setSubpartForm((prev) => ({ ...prev, chapterId: newChapter.id }))
    } catch (error) {
      console.error('Impossible de créer le chapitre', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateSubpart = async () => {
    if (!subpartForm.title.trim() || !isValidUuid(subpartForm.chapterId)) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_subparts')
        .insert({
          title: subpartForm.title,
          vimeo_url: subpartForm.vimeo_url || null,
          description_html: subpartForm.description_html,
          order_index: subpartForm.order_index,
          chapter_id: subpartForm.chapterId
        })
        .select()
        .single()

      if (error) throw error

      const newSubpart: Subpart = {
        id: data.id,
        title: data.title,
        vimeo_url: data.vimeo_url,
        description_html: data.description_html,
        order_index: data.order_index
      }

      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.map((chapter) =>
            chapter.id === subpartForm.chapterId
              ? { ...chapter, subparts: [...chapter.subparts, newSubpart] }
              : chapter
          )
        }))
      )

      setSubpartForm({ title: '', vimeo_url: '', order_index: 1, chapterId: subpartForm.chapterId, description_html: '' })
    } catch (error) {
      console.error('Impossible de créer la sous-partie', error)
    } finally {
      setCreating(false)
    }
  }

  const startEditFormation = (formation: Formation) => {
    setEditingFormationId(formation.id)
    setEditFormationForm({
      title: formation.title,
      description: formation.description || '',
      is_private: !!formation.is_private
    })
  }

  const handleUpdateFormation = async () => {
    if (!editingFormationId || !editFormationForm.title.trim()) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .update({
          title: editFormationForm.title,
          description: editFormationForm.description,
          is_private: editFormationForm.is_private
        })
        .eq('id', editingFormationId)
        .select()
        .single()

      if (error) throw error

      setFormations((prev) =>
        prev.map((formation) =>
          formation.id === editingFormationId
            ? {
                ...formation,
                title: data.title,
                description: data.description,
                is_private: data.is_private
              }
            : formation
        )
      )
      setEditingFormationId(null)
    } catch (error) {
      console.error('Impossible de mettre à jour la formation', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteFormation = async (id: string) => {
    setCreating(true)
    try {
      await supabase.from('elearning_formations').delete().eq('id', id)
      setFormations((prev) => prev.filter((formation) => formation.id !== id))
      if (selectedFormationId === id) {
        setSelectedFormationId('')
      }
    } catch (error) {
      console.error('Impossible de supprimer la formation', error)
    } finally {
      setCreating(false)
    }
  }

  const startEditChapter = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setEditChapterForm({ title: chapter.title, order_index: chapter.order_index || 1 })
    setExpandedChapters((prev) => ({ ...prev, [chapter.id]: true }))
  }

  const handleUpdateChapter = async (chapterId: string) => {
    if (!chapterId || !editChapterForm.title.trim()) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_chapters')
        .update({ title: editChapterForm.title, order_index: editChapterForm.order_index })
        .eq('id', chapterId)
        .select()
        .single()

      if (error) throw error

      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.map((chapter) =>
            chapter.id === chapterId
              ? { ...chapter, title: data.title, order_index: data.order_index }
              : chapter
          )
        }))
      )
      setEditingChapterId(null)
    } catch (error) {
      console.error('Impossible de mettre à jour le chapitre', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    setCreating(true)
    try {
      await supabase.from('elearning_chapters').delete().eq('id', chapterId)
      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.filter((chapter) => chapter.id !== chapterId)
        }))
      )
    } catch (error) {
      console.error('Impossible de supprimer le chapitre', error)
    } finally {
      setCreating(false)
    }
  }

  const startEditSubpart = (subpart: Subpart, chapterId?: string) => {
    setEditingSubpartId(subpart.id)
    setEditSubpartForm({
      title: subpart.title,
      vimeo_url: subpart.vimeo_url || '',
      description_html: subpart.description_html || '',
      order_index: subpart.order_index || 1
    })
    if (chapterId) {
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: true }))
    }
    setExpandedSubparts((prev) => ({ ...prev, [subpart.id]: true }))
  }

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }))
  }

  const toggleSubpartExpansion = (subpartId: string) => {
    setExpandedSubparts((prev) => ({ ...prev, [subpartId]: !prev[subpartId] }))
  }

  const handleUpdateSubpart = async (subpartId: string) => {
    if (!subpartId || !editSubpartForm.title.trim()) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('elearning_subparts')
        .update({
          title: editSubpartForm.title,
          vimeo_url: editSubpartForm.vimeo_url || null,
          description_html: editSubpartForm.description_html,
          order_index: editSubpartForm.order_index
        })
        .eq('id', subpartId)
        .select()
        .single()

      if (error) throw error

      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.map((chapter) => ({
            ...chapter,
            subparts: chapter.subparts.map((subpart) =>
              subpart.id === subpartId
                ? {
                    ...subpart,
                    title: data.title,
                    vimeo_url: data.vimeo_url,
                    description_html: data.description_html,
                    order_index: data.order_index
                  }
                : subpart
            )
          }))
        }))
      )
      setEditingSubpartId(null)
    } catch (error) {
      console.error('Impossible de mettre à jour la sous-partie', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSubpart = async (subpartId: string) => {
    setCreating(true)
    try {
      await supabase.from('elearning_subparts').delete().eq('id', subpartId)
      setFormations((prev) =>
        prev.map((formation) => ({
          ...formation,
          chapters: formation.chapters.map((chapter) => ({
            ...chapter,
            subparts: chapter.subparts.filter((subpart) => subpart.id !== subpartId)
          }))
        }))
      )
    } catch (error) {
      console.error('Impossible de supprimer la sous-partie', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleCompletion = async (subpartId: string, completed: boolean) => {
    if (!profile) return

    try {
      if (completed) {
        await supabase.from('elearning_subpart_progress').upsert({
          subpart_id: subpartId,
          user_id: profile.id,
          completed_at: new Date().toISOString()
        })
      } else {
        await supabase
          .from('elearning_subpart_progress')
          .delete()
          .eq('subpart_id', subpartId)
          .eq('user_id', profile.id)
      }
    } catch (error) {
      console.error('Impossible de mettre à jour le suivi', error)
    }

    setFormations((prev) =>
      prev.map((formation) => ({
        ...formation,
        chapters: formation.chapters.map((chapter) => ({
          ...chapter,
          subparts: chapter.subparts.map((sub) =>
            sub.id === subpartId ? { ...sub, completed } : sub
          )
        }))
      }))
    )
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
              <GraduationCap className="h-5 w-5" />
              E-learning
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
            <p className="text-gray-600">
              Accès réservé aux membres Premium. Construisez vos parcours avec des vidéos Vimeo, descriptions enrichies et
              suivi de progression dès activation.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 shadow-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                <AlertCircle className="h-4 w-4" />
                Accès Premium requis
              </div>
              <h2 className="text-3xl font-bold mb-4">Passez Premium pour débloquer les parcours</h2>
              <p className="text-white/90 text-lg mb-6">
                Les administrateurs peuvent créer des formations, chapitres et sous-parties avec vidéos Vimeo. Les membres
                Premium suivent leur avancement en cochant chaque vidéo terminée.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Lecteur Vimeo intégré</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Editeur riche</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Suivi visuel</span>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                Activer Premium
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl mb-8">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-xs font-semibold text-blue-100">
                  E-learning Premium
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Formations professionnelles
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Développez vos compétences avec nos parcours de formation structurés. Vidéos, exercices et suivi de progression inclus.
              </p>

              {/* Status badge */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Accès :</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
                    isAdmin
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}>
                    {isAdmin ? <Shield className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {isAdmin ? 'Mode Administration' : 'Premium'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Section title */}
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-blue-600" />
                Mes formations
              </h2>
              <p className="text-slate-600">
                Sélectionnez une formation pour commencer votre parcours d'apprentissage
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {formations.map((formation) => {
                const stats = computeProgress(formation)
                return (
                  <button
                    key={formation.id}
                    onClick={() => {
                      setSelectedFormationId(formation.id)
                      setShowFormationModal(true)
                    }}
                    className={`group text-left border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white ${
                      selectedFormationId === formation.id
                        ? 'border-blue-500 ring-4 ring-blue-100 transform scale-[1.02]'
                        : 'border-transparent hover:border-blue-200 hover:-translate-y-1'
                    }`}
                  >
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-bold text-base">{formation.title}</span>
                      </div>
                      {formation.is_private && (
                        <span className="px-2 py-1 rounded-full text-[10px] bg-white/20 text-white font-semibold uppercase backdrop-blur-sm">
                          Privé
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      {formation.description && (
                        <div
                          className="text-sm text-gray-700 prose prose-sm max-w-none line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: formation.description }}
                        />
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span>{formation.chapters.length} chapitres</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {stats.done}/{stats.total} terminées
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{stats.percent}% complété</span>
                          {stats.percent === 100 && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Terminé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {formations.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune formation disponible</h3>
                <p className="text-gray-600 text-sm">Les formations apparaîtront ici une fois ajoutées.</p>
              </div>
            )}
          </div>

          {showFormationModal && selectedFormation && (
            <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="bg-sky-100 px-6 py-4 rounded-t-2xl border-b border-sky-200 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sky-700 font-semibold">
                      <Sparkles className="h-4 w-4" />
                      <span>Formation</span>
                    </div>
                    <h2 className="text-2xl font-bold text-sky-900">{selectedFormation.title}</h2>
                    {selectedFormation.is_private && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white text-sky-800 border border-sky-200 font-semibold uppercase">
                        Privé
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFormationModal(false)}
                    className="text-gray-600 hover:text-gray-800 rounded-full p-2 bg-white/70 border border-gray-200"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-[260px]">
                      {editingFormationId === selectedFormation.id ? (
                        <div className="space-y-2">
                          <input
                            value={editFormationForm.title}
                            onChange={(e) => setEditFormationForm({ ...editFormationForm, title: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="Titre de la formation"
                          />
                          <RichTextEditor
                            value={editFormationForm.description}
                            onChange={(html) => setEditFormationForm({ ...editFormationForm, description: html })}
                          />
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editFormationForm.is_private}
                              onChange={(e) => setEditFormationForm({ ...editFormationForm, is_private: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            Formation privée (admin uniquement)
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateFormation}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold"
                              disabled={creating}
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={() => setEditingFormationId(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {selectedFormation.description && (
                            <div
                              className="text-gray-700 text-sm prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: selectedFormation.description }}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end min-w-[220px]">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>
                          {progress.done}/{progress.total} sous-parties terminées
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                        <div className="h-full bg-primary-600" style={{ width: `${progress.percent}%` }} aria-label={`Progression ${progress.percent}%`} />
                      </div>
                      <span className="text-xs text-gray-500">{progress.percent}%</span>
                      {isAdmin && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => startEditFormation(selectedFormation)}
                            className="px-3 py-1 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-white"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteFormation(selectedFormation.id)}
                            className="px-3 py-1 text-xs font-semibold border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                <div className="space-y-3">
                  {selectedFormation.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                      ref={(ref) => {
                        subpartRefs.current[chapter.id] = ref
                      }}
                    >
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                          {editingChapterId === chapter.id ? (
                            <div className="flex items-center gap-3 text-gray-800 font-semibold">
                              <ChevronRight className="h-4 w-4 text-primary-600 opacity-50" />
                              <Layers className="h-4 w-4 text-primary-600" />
                              <input
                                value={editChapterForm.title}
                                onChange={(e) => setEditChapterForm({ ...editChapterForm, title: e.target.value })}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleChapterExpansion(chapter.id)}
                              className="flex items-center gap-3 text-gray-800 font-semibold hover:text-primary-700 focus:outline-none"
                              aria-label={`Basculer l'affichage du chapitre ${chapter.title}`}
                            >
                              <ChevronRight
                                className={`h-4 w-4 text-primary-600 transition-transform ${
                                  expandedChapters[chapter.id] ? 'rotate-90' : ''
                                }`}
                              />
                              <Layers className="h-4 w-4 text-primary-600" />
                              {chapter.title}
                            </button>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{chapter.subparts.length} sous-parties</span>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                {editingChapterId === chapter.id ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateChapter(chapter.id)}
                                      className="px-2 py-1 text-xs border border-primary-200 text-primary-700 rounded-lg"
                                      disabled={creating}
                                    >
                                      Sauvegarder
                                    </button>
                                    <button
                                      onClick={() => setEditingChapterId(null)}
                                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                                    >
                                      Annuler
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditChapter(chapter)}
                                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => handleDeleteChapter(chapter.id)}
                                      className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded-lg"
                                    >
                                      Supprimer
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {(expandedChapters[chapter.id] || editingChapterId === chapter.id) && (
                          <div className="divide-y divide-gray-100">
                            {chapter.subparts.map((subpart) => {
                              const subpartOpen = expandedSubparts[subpart.id] || editingSubpartId === subpart.id
                              return (
                                <div
                                  key={subpart.id}
                                  ref={(ref) => {
                                    subpartRefs.current[subpart.id] = ref
                                  }}
                                  className="p-4 space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                      {editingSubpartId === subpart.id ? (
                                        <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                          <ChevronDown className="h-4 w-4 text-primary-500 opacity-50" />
                                          <Video className="h-4 w-4 text-primary-500" />
                                          <input
                                            value={editSubpartForm.title}
                                            onChange={(e) => setEditSubpartForm({ ...editSubpartForm, title: e.target.value })}
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                          />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleSubpartExpansion(subpart.id)}
                                          className="flex items-center gap-2 text-gray-900 font-semibold hover:text-primary-700 focus:outline-none"
                                          aria-label={`Basculer l'affichage de la sous-partie ${subpart.title}`}
                                        >
                                          <ChevronDown
                                            className={`h-4 w-4 text-primary-500 transition-transform ${
                                              subpartOpen ? 'rotate-180' : ''
                                            }`}
                                          />
                                          <Video className="h-4 w-4 text-primary-500" />
                                          {subpart.title}
                                        </button>
                                      )}
                                      {subpartOpen && (
                                        <>
                                          {editingSubpartId === subpart.id ? (
                                            <div className="space-y-2">
                                              <input
                                                value={editSubpartForm.vimeo_url}
                                                onChange={(e) =>
                                                  setEditSubpartForm({ ...editSubpartForm, vimeo_url: e.target.value })
                                                }
                                                placeholder="URL Vimeo (optionnelle)"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                              />
                                              <input
                                                type="number"
                                                min={1}
                                                value={editSubpartForm.order_index}
                                                onChange={(e) =>
                                                  setEditSubpartForm({
                                                    ...editSubpartForm,
                                                    order_index: Number(e.target.value)
                                                  })
                                                }
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                placeholder="Ordre d'affichage"
                                              />
                                              <RichTextEditor
                                                value={editSubpartForm.description_html}
                                                onChange={(html) => setEditSubpartForm({ ...editSubpartForm, description_html: html })}
                                              />
                                            </div>
                                          ) : (
                                            subpart.description_html && (
                                              <div
                                                className="text-sm text-gray-700 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: subpart.description_html }}
                                              />
                                            )
                                          )}
                                          <div className="mt-1 space-y-2">
                                            {subpart.vimeo_url ? (
                                              <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video">
                                                <iframe
                                                  src={getVimeoEmbedUrl(subpart.vimeo_url)}
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                  className="absolute inset-0 h-full w-full"
                                                  title={`Vimeo - ${subpart.title}`}
                                                />
                                              </div>
                                            ) : (
                                              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 bg-gray-50">
                                                Vidéo à venir
                                              </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                              <PlayCircle className="h-4 w-4" />
                                              {subpart.vimeo_url ? 'Lecture intégrée' : 'Support en cours de préparation'}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock3 className="h-4 w-4" />
                                        Suivi
                                      </span>
                                      <button
                                        onClick={() => toggleCompletion(subpart.id, !subpart.completed)}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
                                          subpart.completed
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <CheckSquare className="h-4 w-4" />
                                        {subpart.completed ? 'Terminé' : 'Marquer terminé'}
                                      </button>
                                      {isAdmin && (
                                        <div className="flex flex-wrap gap-2 justify-end">
                                          {editingSubpartId === subpart.id ? (
                                            <>
                                              <button
                                                onClick={() => handleUpdateSubpart(subpart.id)}
                                                className="px-3 py-1 text-xs border border-primary-200 text-primary-700 rounded-lg"
                                                disabled={creating}
                                              >
                                                Sauvegarder
                                              </button>
                                              <button
                                                onClick={() => setEditingSubpartId(null)}
                                                className="px-3 py-1 text-xs border border-gray-200 rounded-lg"
                                              >
                                                Annuler
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => startEditSubpart(subpart, chapter.id)}
                                                className="px-3 py-1 text-xs border border-gray-200 rounded-lg"
                                              >
                                                Modifier
                                              </button>
                                              <button
                                                onClick={() => handleDeleteSubpart(subpart.id)}
                                                className="px-3 py-1 text-xs border border-red-200 text-red-700 rounded-lg"
                                              >
                                                Supprimer
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                  ))}
                </div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 border border-blue-400">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Création simplifiée
                </h3>
                <p className="text-blue-100 text-sm mb-4">
                  Créez une formation complète avec tous ses chapitres et sous-parties en une seule fois.
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full bg-white text-blue-600 font-semibold px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Créer une formation (nouveau)
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border border-primary-100">
                <div className="flex items-center gap-2 text-primary-600 font-semibold mb-3">
                  <ListChecks className="h-5 w-5" />
                  Construction des parcours (ancien mode)
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Créez la formation, ajoutez des chapitres puis des sous-parties avec liens Vimeo et description
                  enrichie. Toutes les actions sont enregistrées dans Supabase.
                </p>
                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle formation
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <input
                        value={formationForm.title}
                        onChange={(e) => setFormationForm({ ...formationForm, title: e.target.value })}
                        placeholder="Titre de la formation"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formationForm.is_private}
                          onChange={(e) => setFormationForm({ ...formationForm, is_private: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Formation privée (visible seulement par les admins)
                      </label>
                      <RichTextEditor
                        value={formationForm.description}
                        onChange={(html) => setFormationForm({ ...formationForm, description: html })}
                      />
                      <button
                        onClick={handleCreateFormation}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Enregistrer la formation
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouveau chapitre
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <select
                        value={chapterForm.formationId}
                        onChange={(e) => setChapterForm({ ...chapterForm, formationId: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Sélectionnez une formation
                        </option>
                        {formations.map((formation) => (
                          <option key={formation.id} value={formation.id}>
                            {formation.title}
                          </option>
                        ))}
                      </select>
                      <input
                        value={chapterForm.title}
                        onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                        placeholder="Titre du chapitre"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={chapterForm.order_index}
                        onChange={(e) => setChapterForm({ ...chapterForm, order_index: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ordre d'affichage"
                      />
                      <button
                        onClick={handleCreateChapter}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-semibold border border-primary-200 hover:bg-primary-100"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Ajouter le chapitre
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle sous-partie
                      </h3>
                      {creating && <span className="text-xs text-primary-600">Enregistrement...</span>}
                    </div>
                    <div className="space-y-3">
                      <select
                        value={subpartForm.chapterId}
                        onChange={(e) => setSubpartForm({ ...subpartForm, chapterId: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Sélectionnez un chapitre
                        </option>
                        {formations.flatMap((formation) =>
                          formation.chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>
                              {formation.title} — {chapter.title}
                            </option>
                          ))
                        )}
                      </select>
                      <input
                        value={subpartForm.title}
                        onChange={(e) => setSubpartForm({ ...subpartForm, title: e.target.value })}
                        placeholder="Titre de la sous-partie"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        value={subpartForm.vimeo_url}
                        onChange={(e) => setSubpartForm({ ...subpartForm, vimeo_url: e.target.value })}
                        placeholder="URL du lecteur Vimeo (optionnelle)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={subpartForm.order_index}
                        onChange={(e) => setSubpartForm({ ...subpartForm, order_index: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ordre d'affichage"
                      />
                      <RichTextEditor
                        value={subpartForm.description_html}
                        onChange={(html) => setSubpartForm({ ...subpartForm, description_html: html })}
                      />
                      <button
                        onClick={handleCreateSubpart}
                        disabled={creating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Ajouter la sous-partie
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                  <Shield className="h-4 w-4" /> Règles d'accès
                </div>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-2">
                  <li>Les formations Silver et Gold sont visibles uniquement par les membres Premium correspondants.</li>
                  <li>Les sous-parties sont considérées comme validées lorsque l'abonné clique sur "Marquer terminé".</li>
                  <li>Toutes les écritures (création, progression) sont stockées dans Supabase via les tables proposées.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {showWizard && (
        <CourseCreationWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false)
            loadData()
          }}
        />
      )}
    </AuthLayout>
  )
}
