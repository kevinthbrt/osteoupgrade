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
  Trophy,
  Loader2,
  AlertCircle,
  Star,
  Target
} from 'lucide-react'

type Question = {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

type QuizData = {
  id: string
  title: string
  description: string
  duration_minutes: number
  questions: Question[]
}

export default function TakeQuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  useEffect(() => {
    if (quizStarted && !quizFinished && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleFinishQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quizStarted, quizFinished, timeRemaining])

  const loadQuiz = async () => {
    try {
      // Mock quiz data - in production, fetch from database
      const mockQuiz: QuizData = {
        id: quizId,
        title: 'Anatomie Cervicale - Niveau 1',
        description: 'Testez vos connaissances sur l\'anatomie de la région cervicale',
        duration_minutes: 10,
        questions: [
          {
            id: '1',
            question: 'Combien de vertèbres cervicales possède la colonne vertébrale humaine ?',
            options: ['5', '6', '7', '8'],
            correct_answer: 2,
            explanation: 'La colonne cervicale est composée de 7 vertèbres (C1 à C7). C1 (Atlas) et C2 (Axis) ont des caractéristiques particulières.'
          },
          {
            id: '2',
            question: 'Quel muscle est le principal fléchisseur de la tête ?',
            options: ['Trapèze', 'Sterno-cléido-mastoïdien', 'Splénius', 'Élévateur de la scapula'],
            correct_answer: 1,
            explanation: 'Le muscle sterno-cléido-mastoïdien (SCM) est le principal fléchisseur de la tête. Il permet également la rotation controlatérale.'
          },
          {
            id: '3',
            question: 'L\'artère vertébrale passe par quel foramen ?',
            options: ['Foramen magnum', 'Foramen transversaire', 'Foramen intervertébral', 'Foramen jugulaire'],
            correct_answer: 1,
            explanation: 'L\'artère vertébrale passe par les foramens transversaires des vertèbres C1 à C6, avant d\'entrer dans le crâne par le foramen magnum.'
          },
          {
            id: '4',
            question: 'Quelle est la particularité de C1 (Atlas) ?',
            options: ['Elle possède une apophyse odontoïde', 'Elle n\'a pas de corps vertébral', 'Elle est fusionnée avec C2', 'Elle est la plus grande vertèbre cervicale'],
            correct_answer: 1,
            explanation: 'L\'Atlas (C1) est unique car elle ne possède pas de corps vertébral. Elle se compose d\'un arc antérieur et d\'un arc postérieur.'
          },
          {
            id: '5',
            question: 'Le plexus brachial est formé par les racines nerveuses de :',
            options: ['C1-C4', 'C3-C7', 'C5-T1', 'C6-T2'],
            correct_answer: 2,
            explanation: 'Le plexus brachial est formé par les racines nerveuses de C5, C6, C7, C8 et T1. Il innerve le membre supérieur.'
          }
        ]
      }

      setQuiz(mockQuiz)
      setUserAnswers(new Array(mockQuiz.questions.length).fill(null))
      setTimeRemaining(mockQuiz.duration_minutes * 60)
    } catch (error) {
      console.error('Error loading quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = optionIndex
    setUserAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowFeedback(false)
    } else {
      handleFinishQuiz()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setShowFeedback(false)
    }
  }

  const handleFinishQuiz = async () => {
    setQuizFinished(true)

    // Calculate score
    const score = calculateScore()

    // Save results to database (mock)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // TODO: Save to database
        console.log('Quiz completed:', { quizId, score, userAnswers })
      }
    } catch (error) {
      console.error('Error saving quiz results:', error)
    }
  }

  const calculateScore = () => {
    if (!quiz) return 0

    let correct = 0
    userAnswers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correct_answer) {
        correct++
      }
    })

    return Math.round((correct / quiz.questions.length) * 100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  if (!quiz) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz introuvable</h2>
          <button
            onClick={() => router.push('/encyclopedia/learning/quizzes')}
            className="mt-4 px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700"
          >
            Retour aux quiz
          </button>
        </div>
      </AuthLayout>
    )
  }

  // Start screen
  if (!quizStarted) {
    return (
      <AuthLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8">
            <div className="mb-6">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">Quiz Interactif</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{quiz.title}</h1>
            <p className="text-purple-100 text-lg mb-8">{quiz.description}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{quiz.questions.length}</div>
                <div className="text-purple-200 text-sm">Questions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{quiz.duration_minutes}</div>
                <div className="text-purple-200 text-sm">Minutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">75%</div>
                <div className="text-purple-200 text-sm">Pour réussir</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">📋 Instructions</h3>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Lisez attentivement chaque question avant de répondre</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Vous pouvez naviguer entre les questions pendant le quiz</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Le quiz se terminera automatiquement à la fin du temps imparti</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Vous verrez votre score et les explications à la fin</span>
              </li>
            </ul>

            <button
              onClick={handleStartQuiz}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span>Commencer le quiz</span>
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Results screen
  if (quizFinished) {
    const score = calculateScore()
    const correctAnswers = userAnswers.filter((answer, index) => answer === quiz.questions[index].correct_answer).length

    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8 ${
            score >= 75 ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-amber-600 to-orange-700'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                {score >= 75 ? (
                  <Trophy className="h-12 w-12 text-yellow-300" />
                ) : (
                  <Target className="h-12 w-12 text-white" />
                )}
              </div>

              <h1 className="text-4xl font-bold mb-2">
                {score >= 75 ? '🎉 Félicitations !' : '💪 Continuez vos efforts !'}
              </h1>
              <p className="text-lg mb-8 opacity-90">
                {score >= 75
                  ? 'Vous avez réussi ce quiz avec brio !'
                  : 'Revoyez les concepts pour améliorer votre score'}
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{score}%</div>
                  <div className="text-sm opacity-90">Score</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">{correctAnswers}/{quiz.questions.length}</div>
                  <div className="text-sm opacity-90">Correct</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-4xl font-bold">+{score * 10}</div>
                  <div className="text-sm opacity-90">XP gagnés</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Détails des réponses</h3>

            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers[index]
              const isCorrect = userAnswer === question.correct_answer

              return (
                <div key={question.id} className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                  isCorrect ? 'border-green-200' : 'border-red-200'
                }`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">Question {index + 1}</h4>
                      <p className="text-slate-700 mb-4">{question.question}</p>

                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex
                          const isCorrectOption = optionIndex === question.correct_answer

                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectOption
                                  ? 'border-green-500 bg-green-50'
                                  : isUserAnswer
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {isUserAnswer && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                <span className={`font-medium ${
                                  isCorrectOption ? 'text-green-900' : isUserAnswer ? 'text-red-900' : 'text-slate-700'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900 mb-1">Explication</p>
                            <p className="text-blue-800 text-sm">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/encyclopedia/learning/quizzes')}
              className="px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Retour aux quiz
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Refaire ce quiz
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Quiz in progress
  const current Question = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const timePercentage = (timeRemaining / (quiz.duration_minutes * 60)) * 100

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-600">
                Question {currentQuestionIndex + 1} / {quiz.questions.length}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-100 text-purple-700">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time Warning */}
          {timeRemaining < 60 && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Moins d'une minute restante !</span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswers[currentQuestionIndex] === index

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300'
                    } flex items-center justify-center`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-lg ${isSelected ? 'text-purple-900 font-semibold' : 'text-slate-700'}`}>
                      {option}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>

          <div className="flex gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-purple-500 w-6'
                    : userAnswers[index] !== null
                    ? 'bg-green-400'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleFinishQuiz}
              disabled={userAnswers.some(a => a === null)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Terminer</span>
              <CheckCircle className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
            >
              <span>Suivant</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
