'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import CourseCreationWizard from '../components/CourseCreationWizard'
import QuizComponent from '../components/QuizComponent'
import QuizManager from '../components/QuizManager'
import type { Quiz } from '../types/quiz'
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
  PlayCircle,
  Plus,
  Search,
  Shield,
  Sparkles,
  Video,
  X,
  Loader2,
  ClipboardCheck,
  Lock,
  Trophy
} from 'lucide-react'

type Subpart = {
  id: string
  title: string
  vimeo_url?: string
  description_html?: string
  order_index?: number
  completed?: boolean
  quiz?: Quiz
  quiz_passed?: boolean
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
  photo_url?: string
  is_free_access?: boolean
  chapters: Chapter[]
}

type Profile = {
  id: string
  role: string
  full_name?: string
}

const canAccessFormation = (role: string | undefined, isPrivate?: boolean, isFreeAccess?: boolean) => {
  if (!role) return false
  if (isPrivate) return role === 'admin'
  // Free users can access courses marked as free access
  if (isFreeAccess && role === 'free') return true
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

export default function CoursPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormationId, setSelectedFormationId] = useState<string>('')
  const subpartRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [loading, setLoading] = useState(true)
  const [showFormationModal, setShowFormationModal] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [expandedSubparts, setExpandedSubparts] = useState<Record<string, boolean>>({})
  const [showWizard, setShowWizard] = useState(false)
  const [formationToEdit, setFormationToEdit] = useState<Formation | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; subpartId: string } | null>(null)
  const [quizManager, setQuizManager] = useState<{ subpartId: string; subpartTitle: string; quiz?: Quiz } | null>(null)

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

  const loadFormationsFromSupabase = async (userId: string, role?: string, preserveFormationId?: string) => {
    const roleToUse = role ?? profile?.role

    try {
      const { data, error } = await supabase
        .from('elearning_formations')
        .select(
          `id, title, description, is_private, photo_url, is_free_access,
          chapters:elearning_chapters(id, title, order_index,
            subparts:elearning_subparts(id, title, vimeo_url, description_html, order_index,
              progress:elearning_subpart_progress(user_id, completed_at),
              quiz:elearning_quizzes(id, title, description, passing_score,
                questions:elearning_quiz_questions(id, question_text, question_type, points, order_index, explanation,
                  answers:elearning_quiz_answers(id, answer_text, is_correct, order_index)
                )
              )
            )
          )`
        )
        .order('title', { ascending: true })

      if (error) throw error

      if (data) {
        // Fetch quiz attempts for the user
        const { data: quizAttempts } = await supabase
          .from('elearning_quiz_attempts')
          .select('quiz_id, passed')
          .eq('user_id', userId)
          .eq('passed', true)

        const passedQuizIds = new Set((quizAttempts || []).map((a: any) => a.quiz_id))

        const parsed: Formation[] = data.map((formation: any) => ({
          id: formation.id,
          title: formation.title,
          description: formation.description,
          is_private: formation.is_private,
          photo_url: formation.photo_url,
          is_free_access: formation.is_free_access,
          chapters:
            formation.chapters?.map((chapter: any) => ({
              id: chapter.id,
              title: chapter.title,
              order_index: chapter.order_index,
              subparts:
                chapter.subparts?.map((sub: any) => {
                  const quizData = sub.quiz && sub.quiz.length > 0 ? sub.quiz[0] : null
                  const quiz = quizData ? {
                    id: quizData.id,
                    title: quizData.title,
                    description: quizData.description,
                    passing_score: quizData.passing_score,
                    questions: (quizData.questions || []).map((q: any) => ({
                      id: q.id,
                      question_text: q.question_text,
                      question_type: q.question_type,
                      points: q.points,
                      order_index: q.order_index,
                      explanation: q.explanation,
                      answers: (q.answers || []).map((a: any) => ({
                        id: a.id,
                        answer_text: a.answer_text,
                        is_correct: a.is_correct,
                        order_index: a.order_index
                      }))
                    }))
                  } : undefined

                  return {
                    id: sub.id,
                    title: sub.title,
                    vimeo_url: sub.vimeo_url,
                    description_html: sub.description_html,
                    order_index: sub.order_index,
                    completed: (sub.progress || []).some((p: any) => p.user_id === userId),
                    quiz,
                    quiz_passed: quiz ? passedQuizIds.has(quiz.id) : true
                  }
                }).sort((a: Subpart, b: Subpart) => (a.order_index ?? 0) - (b.order_index ?? 0)) || []
            })).sort((a: Chapter, b: Chapter) => (a.order_index ?? 0) - (b.order_index ?? 0)) || []
        }))

        const accessible = parsed.filter((formation) => canAccessFormation(roleToUse, formation.is_private, formation.is_free_access))

        if (accessible.length) {
          setFormations(accessible)
          // Preserve the selected formation if it's provided and still exists
          if (preserveFormationId && accessible.some((f) => f.id === preserveFormationId)) {
            setSelectedFormationId(preserveFormationId)
          } else {
            setSelectedFormationId(accessible[0].id)
          }
        } else {
          setFormations([])
          setSelectedFormationId('')
        }
      }
    } catch (error) {
      console.error('Erreur de chargement des formations', error)
      setFormations([])
      setSelectedFormationId('')
    }
  }

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId) ?? formations[0],
    [formations, selectedFormationId]
  )

  const filteredFormations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return formations
    return formations.filter((formation) => {
      const haystack = `${formation.title} ${formation.description ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [formations, searchTerm])

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

  const handleDeleteFormation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.')) {
      return
    }

    try {
      await supabase.from('elearning_formations').delete().eq('id', id)
      setFormations((prev) => prev.filter((formation) => formation.id !== id))
      if (selectedFormationId === id) {
        setSelectedFormationId('')
        setShowFormationModal(false)
      }
    } catch (error) {
      console.error('Impossible de supprimer la formation', error)
      alert('Erreur lors de la suppression de la formation')
    }
  }

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }))
  }

  const toggleSubpartExpansion = (subpartId: string) => {
    setExpandedSubparts((prev) => ({ ...prev, [subpartId]: !prev[subpartId] }))
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

  const handleQuizPassed = async () => {
    // Reload data to refresh quiz_passed status, preserving the current formation
    if (profile) {
      await loadFormationsFromSupabase(profile.id, profile.role, selectedFormationId)
    }
  }

  const isSubpartAccessible = (formation: Formation, chapter: Chapter, subpartIndex: number) => {
    // Check if this is the very first subpart of the entire formation
    const isFirstChapter = formation.chapters[0]?.id === chapter.id
    if (subpartIndex === 0 && isFirstChapter) return true // Only the first subpart of the first chapter is always accessible

    // Find previous subpart
    let previousSubpart: Subpart | null = null
    for (const ch of formation.chapters) {
      const idx = ch.subparts.findIndex((s) => s.id === chapter.subparts[subpartIndex].id)
      if (idx > 0) {
        previousSubpart = ch.subparts[idx - 1]
        break
      } else if (idx === 0) {
        // Check previous chapter's last subpart
        const chapterIdx = formation.chapters.findIndex((c) => c.id === ch.id)
        if (chapterIdx > 0) {
          const prevChapter = formation.chapters[chapterIdx - 1]
          if (prevChapter.subparts.length > 0) {
            previousSubpart = prevChapter.subparts[prevChapter.subparts.length - 1]
          }
        }
        break
      }
    }

    // If there's a previous subpart with a quiz, it must be passed
    if (previousSubpart && previousSubpart.quiz) {
      return previousSubpart.quiz_passed === true
    }

    return true
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

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
              <GraduationCap className="h-5 w-5" />
              Cours
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
            <p className="text-gray-600">
              Accès réservé aux membres Premium. Parcours complets avec vidéos et suivi de progression.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 shadow-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                <AlertCircle className="h-4 w-4" />
                Accès Premium requis
              </div>
              <h2 className="text-3xl font-bold mb-4">Passez Premium pour débloquer les cours</h2>
              <p className="text-white/90 text-lg mb-6">
                Accédez à des formations complètes avec vidéos Vimeo, descriptions enrichies et suivi de progression.
              </p>
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
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
                  <span className="text-xs font-semibold text-blue-100">
                    Cours Premium
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Formations vidéo
                </h1>

                <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                  Développez vos compétences avec nos parcours de formation structurés. Vidéos, exercices et suivi de progression inclus.
                </p>

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

              {isAdmin && (
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une formation
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-blue-600" />
                Mes formations
              </h2>
              <p className="text-slate-600">
                Sélectionnez une formation pour commencer votre parcours d'apprentissage
              </p>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher une formation"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredFormations.map((formation) => {
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

                    {formation.photo_url && (
                      <div className="w-full h-48 overflow-hidden bg-gray-100">
                        <img
                          src={formation.photo_url}
                          alt={`Illustration de ${formation.title}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      {formation.description ? (
                        <div
                          className="text-sm text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: formation.description }}
                        />
                      ) : (
                        <p className="text-sm text-gray-500">Description à venir.</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span>{formation.chapters.length} chapitres</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {stats.done}/{stats.total} terminées
                        </div>
                      </div>

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

            {formations.length > 0 && filteredFormations.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                Aucune formation ne correspond à votre recherche.
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
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setFormationToEdit(selectedFormation)
                          setShowWizard(true)
                          setShowFormationModal(false)
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Modifier
                      </button>
                    )}
                    <button
                      onClick={() => setShowFormationModal(false)}
                      className="text-gray-600 hover:text-gray-800 rounded-full p-2 bg-white/70 border border-gray-200"
                      aria-label="Fermer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-[260px]">
                      {selectedFormation.description && (
                        <div
                          className="text-gray-700 text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedFormation.description }}
                        />
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
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${progress.percent}%` }}
                          aria-label={`Progression ${progress.percent}%`}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{progress.percent}%</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteFormation(selectedFormation.id)}
                          className="px-3 py-1 text-xs font-semibold border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                        >
                          Supprimer
                        </button>
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
                          <span className="text-xs text-gray-500">{chapter.subparts.length} sous-parties</span>
                        </div>
                        {expandedChapters[chapter.id] && (
                          <div className="divide-y divide-gray-100">
                            {chapter.subparts.map((subpart, subpartIdx) => {
                              const subpartOpen = expandedSubparts[subpart.id]
                              const isAccessible = isSubpartAccessible(selectedFormation, chapter, subpartIdx)

                              return (
                                <div
                                  key={subpart.id}
                                  ref={(ref) => {
                                    subpartRefs.current[subpart.id] = ref
                                  }}
                                  className={`p-4 space-y-3 ${!isAccessible ? 'bg-gray-50/50' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => isAccessible && toggleSubpartExpansion(subpart.id)}
                                          disabled={!isAccessible}
                                          className={`flex items-center gap-2 font-semibold focus:outline-none ${
                                            isAccessible
                                              ? 'text-gray-900 hover:text-primary-700'
                                              : 'text-gray-400 cursor-not-allowed'
                                          }`}
                                          aria-label={`Basculer l'affichage de la sous-partie ${subpart.title}`}
                                        >
                                          {!isAccessible ? (
                                            <Lock className="h-4 w-4 text-gray-400" />
                                          ) : (
                                            <ChevronDown
                                              className={`h-4 w-4 text-primary-500 transition-transform ${
                                                subpartOpen ? 'rotate-180' : ''
                                              }`}
                                            />
                                          )}
                                          <Video
                                            className={`h-4 w-4 ${isAccessible ? 'text-primary-500' : 'text-gray-400'}`}
                                          />
                                          {subpart.title}
                                        </button>

                                        {subpart.quiz && (
                                          <div className="flex items-center gap-2">
                                            {subpart.quiz_passed ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 font-semibold">
                                                <Trophy className="h-3 w-3" />
                                                Quiz validé
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">
                                                <ClipboardCheck className="h-3 w-3" />
                                                Quiz requis
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {!isAccessible && (
                                        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                                          <AlertCircle className="h-4 w-4 shrink-0" />
                                          <span>Terminez le quiz précédent pour débloquer cette vidéo</span>
                                        </div>
                                      )}

                                      {subpartOpen && isAccessible && (
                                        <>
                                          {subpart.description_html && (
                                            <div
                                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                                              dangerouslySetInnerHTML={{ __html: subpart.description_html }}
                                            />
                                          )}
                                          <div className="space-y-3">
                                            {subpart.vimeo_url ? (
                                              <div className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-black aspect-video shadow-lg">
                                                <iframe
                                                  src={getVimeoEmbedUrl(subpart.vimeo_url)}
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                  className="absolute inset-0 h-full w-full"
                                                  title={`Vimeo - ${subpart.title}`}
                                                />
                                              </div>
                                            ) : (
                                              <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 bg-gray-50 text-center">
                                                <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                Vidéo à venir
                                              </div>
                                            )}

                                            {subpart.quiz && (
                                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                                <div className="flex items-start justify-between gap-4">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                                                      <h4 className="font-bold text-blue-900">{subpart.quiz.title}</h4>
                                                    </div>
                                                    {subpart.quiz.description && (
                                                      <p className="text-sm text-blue-700 mb-3">{subpart.quiz.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-blue-600">
                                                      <span>{subpart.quiz.questions.length} questions</span>
                                                      <span>•</span>
                                                      <span>Score requis : {subpart.quiz.passing_score}%</span>
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      setActiveQuiz({ quiz: subpart.quiz!, subpartId: subpart.id })
                                                    }
                                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                                      subpart.quiz_passed
                                                        ? 'bg-white text-blue-600 border-2 border-blue-300 hover:bg-blue-50'
                                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg'
                                                    }`}
                                                  >
                                                    {subpart.quiz_passed ? 'Refaire le quiz' : 'Commencer le quiz'}
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    {isAccessible && (
                                      <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Clock3 className="h-4 w-4" />
                                          Suivi
                                        </span>
                                        <button
                                          onClick={() => toggleCompletion(subpart.id, !subpart.completed)}
                                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                                            subpart.completed
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                          }`}
                                        >
                                          <CheckSquare className="h-4 w-4" />
                                          {subpart.completed ? 'Terminé' : 'Marquer terminé'}
                                        </button>
                                        {isAdmin && (
                                          <button
                                            onClick={() =>
                                              setQuizManager({
                                                subpartId: subpart.id,
                                                subpartTitle: subpart.title,
                                                quiz: subpart.quiz
                                              })
                                            }
                                            className="w-full px-3 py-2 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                          >
                                            <ClipboardCheck className="h-4 w-4" />
                                            {subpart.quiz ? 'Modifier quiz' : 'Créer quiz'}
                                          </button>
                                        )}
                                      </div>
                                    )}
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
      </div>

      {showWizard && (
        <CourseCreationWizard
          onClose={() => {
            setShowWizard(false)
            setFormationToEdit(null)
          }}
          onSuccess={() => {
            setShowWizard(false)
            setFormationToEdit(null)
            loadData()
          }}
          existingFormation={formationToEdit || undefined}
        />
      )}

      {activeQuiz && profile && (
        <QuizComponent
          quiz={activeQuiz.quiz}
          subpartId={activeQuiz.subpartId}
          userId={profile.id}
          onQuizPassed={handleQuizPassed}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {quizManager && (
        <QuizManager
          subpartId={quizManager.subpartId}
          subpartTitle={quizManager.subpartTitle}
          existingQuiz={quizManager.quiz}
          onClose={() => setQuizManager(null)}
          onSave={() => {
            setQuizManager(null)
            loadData()
          }}
        />
      )}
    </AuthLayout>
  )
}
