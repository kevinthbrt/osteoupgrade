'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Loader2,
  AlertCircle,
  Star,
  Target,
  Stethoscope,
  FileText,
  Brain,
  Activity,
  ChevronRight,
  Play,
  Info
} from 'lucide-react'
import {
  getCaseById,
  getCaseSteps,
  getStepChoices,
  getOrCreateProgress,
  updateProgress,
  saveUserAnswer,
  getUserAnswers,
  completeCase,
  type ClinicalCase,
  type CaseStep,
  type CaseStepChoice,
  type CaseProgress
} from '@/lib/clinical-cases-api'

type StepWithChoices = CaseStep & {
  choices: CaseStepChoice[]
}

export default function TakeCasePage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null)
  const [steps, setSteps] = useState<StepWithChoices[]>([])
  const [progress, setProgress] = useState<CaseProgress | null>(null)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<{text: string, type: string} | null>(null)

  const [caseStarted, setCaseStarted] = useState(false)
  const [caseFinished, setCaseFinished] = useState(false)

  const [timeElapsed, setTimeElapsed] = useState(0)
  const [currentScore, setCurrentScore] = useState(0)

  const [userAnswerMap, setUserAnswerMap] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCase()
  }, [caseId])

  useEffect(() => {
    if (caseStarted && !caseFinished) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [caseStarted, caseFinished])

  const loadCase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // Load case
      const caseData = await getCaseById(caseId)
      if (!caseData) {
        console.error('Case not found')
        setLoading(false)
        return
      }

      setClinicalCase(caseData)

      // Load steps with choices
      const stepsData = await getCaseSteps(caseId)
      const stepsWithChoices = await Promise.all(
        stepsData.map(async (step) => {
          const choices = await getStepChoices(step.id)
          return { ...step, choices }
        })
      )

      setSteps(stepsWithChoices)

      // Load or create progress
      const progressData = await getOrCreateProgress(user.id, caseId)
      if (progressData) {
        setProgress(progressData)
        setCurrentScore(progressData.score)
        setCurrentStepIndex(progressData.current_step_order)
        setTimeElapsed(progressData.time_spent_seconds)

        if (progressData.completed) {
          setCaseStarted(true)
          setCaseFinished(true)
        }

        // Load user answers
        const answers = await getUserAnswers(progressData.id)
        const answerMap: Record<string, string> = {}
        answers.forEach(answer => {
          if (answer.choice_id) {
            answerMap[answer.step_id] = answer.choice_id
          }
        })
        setUserAnswerMap(answerMap)
      }

    } catch (error) {
      console.error('Error loading case:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartCase = () => {
    setCaseStarted(true)
  }

  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoice(choiceId)
    setShowFeedback(false)
  }

  const handleConfirmChoice = async () => {
    if (!selectedChoice || !progress) return

    const currentStep = steps[currentStepIndex]
    const choice = currentStep.choices.find(c => c.id === selectedChoice)

    if (!choice) return

    // Show feedback
    if (choice.feedback) {
      setCurrentFeedback({
        text: choice.feedback,
        type: choice.feedback_type || 'info'
      })
      setShowFeedback(true)
    }

    // Save answer
    await saveUserAnswer(progress.id, currentStep.id, choice.id, choice.points_awarded)

    // Update score
    const newScore = currentScore + choice.points_awarded
    setCurrentScore(newScore)

    // Update answer map
    setUserAnswerMap(prev => ({
      ...prev,
      [currentStep.id]: choice.id
    }))

    // Update progress in database
    await updateProgress(progress.id, {
      score: newScore,
      time_spent_seconds: timeElapsed
    })
  }

  const handleNextStep = async () => {
    if (!progress) return

    const nextIndex = currentStepIndex + 1

    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex)
      setSelectedChoice(userAnswerMap[steps[nextIndex].id] || null)
      setShowFeedback(false)
      setCurrentFeedback(null)

      // Update progress
      await updateProgress(progress.id, {
        current_step_order: nextIndex,
        time_spent_seconds: timeElapsed
      })
    } else {
      // Case completed
      await handleCompleteCase()
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      setSelectedChoice(userAnswerMap[steps[prevIndex].id] || null)
      setShowFeedback(false)
      setCurrentFeedback(null)
    }
  }

  const handleCompleteCase = async () => {
    if (!progress) return

    await completeCase(progress.id, currentScore, timeElapsed)
    setCaseFinished(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'info':
        return <Info className="h-6 w-6" />
      case 'choice':
        return <Brain className="h-6 w-6" />
      case 'clinical_exam':
        return <Stethoscope className="h-6 w-6" />
      case 'decision':
        return <Target className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'info':
        return 'Information'
      case 'choice':
        return 'Question'
      case 'clinical_exam':
        return 'Examen Clinique'
      case 'decision':
        return 'Décision'
      default:
        return 'Étape'
    }
  }

  const getStepTypeColor = (stepType: string) => {
    switch (stepType) {
      case 'info':
        return 'blue'
      case 'choice':
        return 'purple'
      case 'clinical_exam':
        return 'orange'
      case 'decision':
        return 'red'
      default:
        return 'gray'
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cas introuvable</h2>
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700"
          >
            Retour aux cas pratiques
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (steps.length === 0) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cas en préparation</h2>
          <p className="text-slate-600 mb-4">Ce cas n'a pas encore d'étapes configurées.</p>
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700"
          >
            Retour aux cas pratiques
          </button>
        </div>
      </AuthLayout>
    )
  }

  // Start screen
  if (!caseStarted) {
    return (
      <AuthLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8">
            <div className="mb-6">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                Cas Clinique Interactif
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{clinicalCase.title}</h1>
            <p className="text-amber-100 text-lg mb-4">{clinicalCase.description}</p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-8">
              <div className="flex items-center gap-2 text-amber-100">
                <Stethoscope className="h-5 w-5" />
                <span className="font-semibold">Patient :</span>
                <span>{clinicalCase.patient_profile}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{steps.length}</div>
                <div className="text-amber-200 text-sm">Étapes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{clinicalCase.duration_minutes}</div>
                <div className="text-amber-200 text-sm">Minutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{progress?.max_score || 0}</div>
                <div className="text-amber-200 text-sm">Points max</div>
              </div>
            </div>

            {clinicalCase.objectives && clinicalCase.objectives.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objectifs d'apprentissage
                </h3>
                <ul className="space-y-2">
                  {clinicalCase.objectives.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-100">
                      <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-600" />
              Instructions
            </h3>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Lisez attentivement chaque étape avant de faire votre choix</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Chaque choix peut rapporter des points différents</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Vous recevrez un feedback immédiat après chaque décision</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Votre score et un résumé détaillé seront affichés à la fin</span>
              </li>
            </ul>

            <button
              onClick={handleStartCase}
              className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Play className="h-6 w-6" />
              <span>Commencer le cas clinique</span>
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Results screen
  if (caseFinished) {
    const percentage = progress ? Math.round((currentScore / progress.max_score) * 100) : 0
    const isPassed = percentage >= 70

    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8 ${
            isPassed ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-amber-600 to-orange-700'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                {isPassed ? (
                  <Trophy className="h-12 w-12 text-yellow-300" />
                ) : (
                  <Target className="h-12 w-12 text-white" />
                )}
              </div>

              <h1 className="text-4xl font-bold mb-2">
                {isPassed ? '🎉 Excellent travail !' : '💪 Bon effort !'}
              </h1>
              <p className="text-lg mb-8 opacity-90">
                {isPassed
                  ? 'Vous avez brillamment résolu ce cas clinique !'
                  : 'Continuez à pratiquer pour améliorer vos compétences'}
              </p>

              <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <div className="text-sm opacity-90">Score</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{currentScore}/{progress?.max_score}</div>
                  <div className="text-sm opacity-90">Points</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{steps.length}</div>
                  <div className="text-sm opacity-90">Étapes</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{formatTime(timeElapsed)}</div>
                  <div className="text-sm opacity-90">Temps</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Détails du parcours</h3>

            {steps.map((step, index) => {
              const userChoiceId = userAnswerMap[step.id]
              const userChoice = step.choices.find(c => c.id === userChoiceId)
              const correctChoice = step.choices.find(c => c.is_correct)

              return (
                <div key={step.id} className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                  userChoice?.is_correct ? 'border-green-200' : userChoice ? 'border-amber-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      userChoice?.is_correct ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {getStepIcon(step.step_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-600">
                          Étape {index + 1} - {getStepTypeLabel(step.step_type)}
                        </span>
                        {userChoice && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            +{userChoice.points_awarded} pts
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                      <p className="text-slate-700 mb-4 text-sm">{step.content}</p>

                      {step.choices.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {step.choices.map((choice) => {
                            const isUserChoice = choice.id === userChoiceId
                            const isCorrect = choice.is_correct

                            return (
                              <div
                                key={choice.id}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : isUserChoice
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {isUserChoice && !isCorrect && <Star className="h-4 w-4 text-amber-600" />}
                                  <span className={`font-medium text-sm ${
                                    isCorrect ? 'text-green-900' : isUserChoice ? 'text-amber-900' : 'text-slate-700'
                                  }`}>
                                    {choice.choice_text}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {userChoice?.feedback && (
                        <div className={`border rounded-lg p-4 ${
                          userChoice.feedback_type === 'correct' ? 'bg-green-50 border-green-200' :
                          userChoice.feedback_type === 'incorrect' ? 'bg-red-50 border-red-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            <Star className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                              userChoice.feedback_type === 'correct' ? 'text-green-600' :
                              userChoice.feedback_type === 'incorrect' ? 'text-red-600' :
                              'text-blue-600'
                            }`} />
                            <div>
                              <p className={`font-semibold mb-1 ${
                                userChoice.feedback_type === 'correct' ? 'text-green-900' :
                                userChoice.feedback_type === 'incorrect' ? 'text-red-900' :
                                'text-blue-900'
                              }`}>
                                Feedback
                              </p>
                              <p className={`text-sm ${
                                userChoice.feedback_type === 'correct' ? 'text-green-800' :
                                userChoice.feedback_type === 'incorrect' ? 'text-red-800' :
                                'text-blue-800'
                              }`}>
                                {userChoice.feedback}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/encyclopedia/learning/cases')}
              className="px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Retour aux cas
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all"
            >
              Refaire ce cas
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Case in progress
  const currentStep = steps[currentStepIndex]
  const progress_percentage = ((currentStepIndex + 1) / steps.length) * 100
  const stepColor = getStepTypeColor(currentStep.step_type)

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-600">
                Étape {currentStepIndex + 1} / {steps.length}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-100 text-amber-700">
                <Trophy className="h-4 w-4" />
                <span className="font-semibold">{currentScore} pts</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 bg-${stepColor}-100 rounded-xl`}>
                <div className={`text-${stepColor}-600`}>
                  {getStepIcon(currentStep.step_type)}
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-semibold text-${stepColor}-600 uppercase`}>
                  {getStepTypeLabel(currentStep.step_type)}
                </h3>
                <p className="text-xs text-slate-600">
                  {currentStep.points_available} points disponibles
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">{currentStep.title}</h2>
            <p className="text-slate-700 mb-6 whitespace-pre-wrap">{currentStep.content}</p>

            {currentStep.image_url && (
              <div className="mb-6 rounded-xl overflow-hidden border-2 border-slate-200">
                <img
                  src={currentStep.image_url}
                  alt={currentStep.title}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Choices */}
          {currentStep.choices.length > 0 && (
            <div className="space-y-3">
              {currentStep.choices.map((choice) => {
                const isSelected = selectedChoice === choice.id

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice.id)}
                    disabled={showFeedback}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all disabled:opacity-70 ${
                      isSelected
                        ? `border-${stepColor}-500 bg-${stepColor}-50 shadow-lg`
                        : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                        isSelected
                          ? `border-${stepColor}-500 bg-${stepColor}-500`
                          : 'border-slate-300'
                      } flex items-center justify-center`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-lg ${isSelected ? `text-${stepColor}-900 font-semibold` : 'text-slate-700'}`}>
                        {choice.choice_text}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Feedback */}
          {showFeedback && currentFeedback && (
            <div className={`mt-6 border-2 rounded-xl p-6 ${
              currentFeedback.type === 'correct' ? 'bg-green-50 border-green-300' :
              currentFeedback.type === 'incorrect' ? 'bg-red-50 border-red-300' :
              currentFeedback.type === 'partial' ? 'bg-amber-50 border-amber-300' :
              'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex items-start gap-3">
                {currentFeedback.type === 'correct' && <CheckCircle className="h-6 w-6 text-green-600 mt-1" />}
                {currentFeedback.type === 'incorrect' && <XCircle className="h-6 w-6 text-red-600 mt-1" />}
                {(currentFeedback.type === 'partial' || currentFeedback.type === 'info') && <Info className="h-6 w-6 text-blue-600 mt-1" />}
                <div className="flex-1">
                  <p className={`font-semibold mb-2 ${
                    currentFeedback.type === 'correct' ? 'text-green-900' :
                    currentFeedback.type === 'incorrect' ? 'text-red-900' :
                    currentFeedback.type === 'partial' ? 'text-amber-900' :
                    'text-blue-900'
                  }`}>
                    {currentFeedback.type === 'correct' ? '✅ Excellent choix !' :
                     currentFeedback.type === 'incorrect' ? '❌ Choix à reconsidérer' :
                     currentFeedback.type === 'partial' ? '⚠️ Choix partiel' :
                     'ℹ️ Information'}
                  </p>
                  <p className={`${
                    currentFeedback.type === 'correct' ? 'text-green-800' :
                    currentFeedback.type === 'incorrect' ? 'text-red-800' :
                    currentFeedback.type === 'partial' ? 'text-amber-800' :
                    'text-blue-800'
                  }`}>
                    {currentFeedback.text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Précédent
          </button>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'bg-amber-500 w-6'
                    : userAnswerMap[steps[index].id]
                    ? 'bg-green-400'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {!showFeedback ? (
            <button
              onClick={handleConfirmChoice}
              disabled={!selectedChoice || currentStep.choices.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Valider
              <CheckCircle className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              {currentStepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
