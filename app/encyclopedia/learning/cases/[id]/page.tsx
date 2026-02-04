'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import ClinicalCaseQuizComponent from '../components/ClinicalCaseQuizComponent'
import type { Quiz } from '@/app/elearning/types/quiz'
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Play,
  Trophy,
  Video,
  Image as ImageIcon,
  FileText,
  Layers,
  Target,
  BookOpen
} from 'lucide-react'
import {
  getCaseById,
  getCaseChapters,
  getChapterModules,
  getModuleQuiz,
  getQuizQuestions,
  getQuestionAnswers,
  getUserModuleProgress,
  getOrCreateCaseProgress,
  markModuleAsCompleted,
  updateCaseProgress,
  getUserQuizAttempts,
  createQuizAttempt,
  completeQuizAttempt,
  type ClinicalCase,
  type ClinicalCaseChapter,
  type ClinicalCaseModule,
  type ClinicalCaseQuiz,
  type ClinicalCaseProgress,
  type ClinicalCaseModuleProgress
} from '@/lib/clinical-cases-api'

type ModuleWithQuiz = ClinicalCaseModule & {
  images?: string[]
  quiz?: Quiz
  quiz_passed?: boolean
  completed?: boolean
}

type ChapterWithModules = ClinicalCaseChapter & {
  modules: ModuleWithQuiz[]
}

export default function ClinicalCasePage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null)
  const [chapters, setChapters] = useState<ChapterWithModules[]>([])
  const [caseProgress, setCaseProgress] = useState<ClinicalCaseProgress | null>(null)
  const [moduleProgress, setModuleProgress] = useState<Record<string, ClinicalCaseModuleProgress>>({})
  const [profile, setProfile] = useState<any>(null)

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [showQuiz, setShowQuiz] = useState(false)

  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    loadData()
  }, [caseId])

  const loadData = async () => {
    try {
      const payload = await fetchProfilePayload()

      if (!payload?.user) {
        router.push('/')
        return
      }

      // Load profile
      const profileData = payload.profile
      const userId = payload.user.id

      setProfile(profileData)

      // Load case
      const caseData = await getCaseById(caseId)
      if (!caseData) {
        console.error('Case not found')
        setLoading(false)
        return
      }

      setClinicalCase(caseData)

      // Load chapters
      const chaptersData = await getCaseChapters(caseId)

      // Load modules for each chapter with quiz info
      const chaptersWithModules = await Promise.all(
        chaptersData.map(async (chapter) => {
          const modules = await getChapterModules(chapter.id)

          // For each module, get quiz if exists
          const modulesWithQuiz = await Promise.all(
            modules.map(async (module) => {
              const quiz = await getModuleQuiz(module.id)

              if (quiz) {
                // Get quiz questions and answers
                const questions = await getQuizQuestions(quiz.id)
                const questionsWithAnswers = await Promise.all(
                  questions.map(async (q) => {
                    const answers = await getQuestionAnswers(q.id)
                    return {
                      id: q.id,
                      question_text: q.question_text,
                      question_type: q.question_type,
                      points: q.points,
                      order_index: q.order_index,
                      explanation: q.explanation,
                      image_url: q.image_url,
                      answers: answers.map(a => ({
                        id: a.id,
                        answer_text: a.answer_text,
                        is_correct: a.is_correct,
                        feedback: a.feedback,
                        order_index: a.order_index
                      }))
                    }
                  })
                )

                // Get user attempts
                const attempts = await getUserQuizAttempts(userId, quiz.id)
                const bestAttempt = attempts.find(a => a.passed) || attempts[0]

                const quizData: Quiz = {
                  id: quiz.id,
                  subpart_id: module.id,
                  title: quiz.title,
                  description: quiz.description || '',
                  passing_score: quiz.passing_score,
                  questions: questionsWithAnswers
                }

                return {
                  ...module,
                  quiz: quizData,
                  quiz_passed: bestAttempt?.passed || false
                }
              }

              return module
            })
          )

          return {
            ...chapter,
            modules: modulesWithQuiz
          }
        })
      )

      setChapters(chaptersWithModules)

      // Load case progress
      const progress = await getOrCreateCaseProgress(userId, caseId)
      setCaseProgress(progress)

      // Load module progress
      const modProgress = await getUserModuleProgress(userId, caseId)
      setModuleProgress(modProgress)

      // Expand first chapter by default
      if (chaptersWithModules.length > 0) {
        setExpandedChapters({ [chaptersWithModules[0].id]: true })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModuleClick = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setShowQuiz(false) // Reset quiz state when changing modules
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  const handleQuizPassed = async () => {
    if (!selectedModule || !profile) return

    // Mark module as completed
    await markModuleAsCompleted(profile.id, selectedModule.id)

    // Update case progress
    await updateCaseProgressPercentage()

    // Reload data
    await loadData()
  }

  const handleMarkModuleComplete = async (moduleId: string) => {
    if (!profile) return

    await markModuleAsCompleted(profile.id, moduleId)

    // Update local state
    setModuleProgress(prev => ({
      ...prev,
      [moduleId]: {
        id: '',
        module_id: moduleId,
        user_id: profile.id,
        completed: true,
        completed_at: new Date().toISOString(),
        viewed_at: new Date().toISOString()
      }
    }))

    // Update case progress
    await updateCaseProgressPercentage()
  }

  const updateCaseProgressPercentage = async () => {
    if (!caseProgress) return

    const allModules = chapters.flatMap(c => c.modules)
    const completedModules = allModules.filter(m => moduleProgress[m.id]?.completed).length
    const percentage = allModules.length > 0
      ? Math.round((completedModules / allModules.length) * 100)
      : 0

    await updateCaseProgress(caseProgress.id, {
      completion_percentage: percentage,
      completed: percentage === 100
    })

    // Reload to get updated progress
    await loadData()
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }))
  }

  const canAccessCase = () => {
    if (!profile || !clinicalCase) return false
    if (clinicalCase.is_free_access) return true
    return ['premium_silver', 'premium_gold', 'admin'].includes(profile.role)
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'text':
        return <FileText className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
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

  if (!clinicalCase) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cas introuvable</h2>
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700"
          >
            Retour aux cas
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (!canAccessCase()) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <Lock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Premium requis</h2>
          <p className="text-slate-600 mb-6">Ce cas clinique est réservé aux membres Premium</p>
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700"
          >
            Retour aux cas
          </button>
        </div>
      </AuthLayout>
    )
  }

  const selectedModule = chapters
    .flatMap(c => c.modules)
    .find(m => m.id === selectedModuleId)

  const totalModules = chapters.flatMap(c => c.modules).length
  const completedModulesCount = Object.values(moduleProgress).filter(p => p.completed).length

  return (
    <AuthLayout>
      <div className="min-h-screen pb-12 overflow-x-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white rounded-3xl p-8 mb-8 shadow-2xl">
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="text-sm text-amber-100 hover:text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux cas cliniques
          </button>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
              <Target className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Cas Clinique</span>
            </div>

            <h1 className="text-3xl font-bold mb-3">{clinicalCase.title}</h1>
            {clinicalCase.description && (
              <div
                className="prose prose-invert max-w-none text-amber-100 mb-6"
                dangerouslySetInnerHTML={{ __html: clinicalCase.description }}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-2xl font-bold">{chapters.length}</div>
                <div className="text-xs text-amber-200">Chapitres</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-2xl font-bold">{totalModules}</div>
                <div className="text-xs text-amber-200">Modules</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-2xl font-bold">{completedModulesCount}</div>
                <div className="text-xs text-amber-200">Complétés</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-2xl font-bold">{caseProgress?.completion_percentage || 0}%</div>
                <div className="text-xs text-amber-200">Progression</div>
              </div>
            </div>

            {/* Progress Bar */}
            {caseProgress && (
              <div className="mt-6">
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${caseProgress.completion_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Chapters & Modules Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-xl p-4 border border-slate-200 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Table des matières</h3>
              </div>

              <div className="space-y-2">
                {chapters.map((chapter, chapterIdx) => (
                  <div key={chapter.id} className="space-y-1">
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`h-4 w-4 text-amber-600 transition-transform ${
                            expandedChapters[chapter.id] ? 'rotate-90' : ''
                          }`}
                        />
                        <Layers className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-gray-900 text-sm">{chapter.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">{chapter.modules.length}</span>
                    </button>

                    {expandedChapters[chapter.id] && (
                      <div className="ml-6 space-y-1">
                        {chapter.modules.map((module) => {
                          const isCompleted = moduleProgress[module.id]?.completed
                          const isSelected = selectedModuleId === module.id
                          const hasQuiz = !!module.quiz
                          const quizPassed = module.quiz_passed

                          return (
                            <button
                              key={module.id}
                              onClick={() => handleModuleClick(module.id)}
                              className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                                isSelected
                                  ? 'bg-amber-100 border-2 border-amber-400'
                                  : 'hover:bg-slate-100 border border-transparent'
                              }`}
                            >
                              <div className={`mt-0.5 shrink-0 ${
                                isCompleted ? 'text-green-600' : 'text-slate-400'
                              }`}>
                                {getContentTypeIcon(module.content_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {module.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {isCompleted && (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                      <CheckCircle className="h-3 w-3" />
                                    </span>
                                  )}
                                  {hasQuiz && (
                                    <span className="inline-flex items-center gap-1 text-xs">
                                      {quizPassed ? (
                                        <Trophy className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Target className="h-3 w-3 text-amber-600" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Module Content */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              <div ref={el => { moduleRefs.current[selectedModule.id] = el }}>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                  {/* Module Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      {getContentTypeIcon(selectedModule.content_type)}
                      <span className="text-sm font-semibold opacity-90">
                        {selectedModule.content_type === 'video' ? 'Vidéo' :
                         selectedModule.content_type === 'image' ? 'Image' :
                         selectedModule.content_type === 'text' ? 'Texte' : 'Mixte'}
                      </span>
                      {moduleProgress[selectedModule.id]?.completed && (
                        <span className="inline-flex items-center gap-1 ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Complété
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
                  </div>

                  {/* Module Content */}
                  <div className="p-6 space-y-6">
                    {/* Video */}
                    {selectedModule.vimeo_url && (
                      <div className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-black aspect-video shadow-lg">
                        <iframe
                          src={getVimeoEmbedUrl(selectedModule.vimeo_url)}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                          title={`Vimeo - ${selectedModule.title}`}
                        />
                      </div>
                    )}

                    {/* Images */}
                    {selectedModule.images && selectedModule.images.length > 0 ? (
                      <div className="space-y-4">
                        {selectedModule.images.map((imageUrl: string, idx: number) => (
                          <img
                            key={idx}
                            src={imageUrl}
                            alt={`${selectedModule.title} - Image ${idx + 1}`}
                            className="max-w-full h-auto rounded-xl shadow-lg"
                          />
                        ))}
                      </div>
                    ) : selectedModule.image_url ? (
                      <div>
                        <img
                          src={selectedModule.image_url}
                          alt={selectedModule.title}
                          className="max-w-full h-auto rounded-xl shadow-lg"
                        />
                      </div>
                    ) : null}

                    {/* Description HTML */}
                    {selectedModule.description_html && (
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: selectedModule.description_html }}
                      />
                    )}

                    {/* Mark Complete Button */}
                    {!moduleProgress[selectedModule.id]?.completed && !selectedModule.quiz && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleMarkModuleComplete(selectedModule.id)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold border-2 border-amber-600 hover:bg-amber-700 transition-all"
                        >
                          <CheckCircle className="h-5 w-5" />
                          Marquer comme terminé
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quiz Section */}
                {selectedModule.quiz && profile && !showQuiz && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 mb-4">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Quiz disponible</h3>
                      <p className="text-slate-600">
                        Testez vos connaissances sur ce module avec un quiz
                      </p>
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition shadow-lg"
                      >
                        Commencer le quiz
                      </button>
                    </div>
                  </div>
                )}

                {/* Quiz Modal */}
                {showQuiz && selectedModule.quiz && profile && (
                  <ClinicalCaseQuizComponent
                    quiz={selectedModule.quiz}
                    moduleId={selectedModule.id}
                    userId={profile.id}
                    onQuizPassed={handleQuizPassed}
                    onClose={() => setShowQuiz(false)}
                  />
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                <Target className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Sélectionnez un module
                </h3>
                <p className="text-slate-600">
                  Choisissez un module dans la table des matières pour commencer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
