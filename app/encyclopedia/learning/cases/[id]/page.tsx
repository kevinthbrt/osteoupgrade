'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
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

  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    loadData()
  }, [caseId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
                const attempts = await getUserQuizAttempts(user.id, quiz.id)
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
      const progress = await getOrCreateCaseProgress(user.id, caseId)
      setCaseProgress(progress)

      // Load module progress
      const modProgress = await getUserModuleProgress(user.id, caseId)
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
      <div className="min-h-screen pb-12">
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
            <p className="text-amber-100 mb-6">{clinicalCase.description}</p>

            <div className="grid grid-cols-4 gap-4 max-w-2xl">
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
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Table des matières
              </h3>

              <div className="space-y-2">
                {chapters.map((chapter, chapterIdx) => (
                  <div key={chapter.id} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                    {/* Chapter Header */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-amber-600">
                          Chapitre {chapterIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {chapter.title}
                        </span>
                      </div>
                      {expandedChapters[chapter.id] ? (
                        <ChevronDown className="h-5 w-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      )}
                    </button>

                    {/* Modules List */}
                    {expandedChapters[chapter.id] && (
                      <div className="p-2 space-y-1">
                        {chapter.modules.map((module, moduleIdx) => {
                          const isCompleted = moduleProgress[module.id]?.completed
                          const isSelected = selectedModuleId === module.id
                          const hasQuiz = !!module.quiz
                          const quizPassed = module.quiz_passed

                          return (
                            <button
                              key={module.id}
                              onClick={() => handleModuleClick(module.id)}
                              className={`w-full px-3 py-2 rounded-lg text-left transition-all ${
                                isSelected
                                  ? 'bg-amber-100 border-2 border-amber-300'
                                  : 'hover:bg-slate-50 border-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`flex-shrink-0 ${
                                    isCompleted ? 'text-green-600' : 'text-slate-400'
                                  }`}>
                                    {getContentTypeIcon(module.content_type)}
                                  </div>
                                  <span className={`text-sm font-medium ${
                                    isSelected ? 'text-amber-900' : 'text-slate-700'
                                  }`}>
                                    {module.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {hasQuiz && (
                                    <div className={`w-2 h-2 rounded-full ${
                                      quizPassed ? 'bg-green-500' : 'bg-amber-400'
                                    }`} title={quizPassed ? 'Quiz réussi' : 'Quiz disponible'} />
                                  )}
                                  {isCompleted && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
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
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                  {/* Module Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b-2 border-amber-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getContentTypeIcon(selectedModule.content_type)}
                          <span className="text-xs font-semibold text-amber-700 uppercase">
                            {selectedModule.content_type}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          {selectedModule.title}
                        </h2>
                      </div>
                      {moduleProgress[selectedModule.id]?.completed && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Complété</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Module Content */}
                  <div className="p-6">
                    {/* Video */}
                    {selectedModule.vimeo_url && (
                      <div className="mb-6">
                        <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={getVimeoEmbedUrl(selectedModule.vimeo_url)}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    {selectedModule.image_url && (
                      <div className="mb-6">
                        <img
                          src={selectedModule.image_url}
                          alt={selectedModule.title}
                          className="w-full rounded-xl shadow-lg"
                        />
                      </div>
                    )}

                    {/* Description HTML */}
                    {selectedModule.description_html && (
                      <div
                        className="prose prose-slate max-w-none mb-6"
                        dangerouslySetInnerHTML={{ __html: selectedModule.description_html }}
                      />
                    )}

                    {/* Mark Complete Button */}
                    {!moduleProgress[selectedModule.id]?.completed && !selectedModule.quiz && (
                      <button
                        onClick={() => handleMarkModuleComplete(selectedModule.id)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Marquer comme terminé
                      </button>
                    )}
                  </div>
                </div>

                {/* Quiz Section */}
                {selectedModule.quiz && profile && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <ClinicalCaseQuizComponent
                      quiz={selectedModule.quiz}
                      moduleId={selectedModule.id}
                      userId={profile.id}
                      onQuizPassed={handleQuizPassed}
                      onClose={() => {}}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
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
