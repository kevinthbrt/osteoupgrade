'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { Brain, ChevronRight, RotateCcw, CheckCircle2, XCircle, AlertCircle, Smile } from 'lucide-react'

interface FlashcardDeck {
  id: string
  title: string
  description: string
  theme: string
  total_cards: number
  user_reviewed: number
  user_due: number
}

interface Flashcard {
  id: string
  deck_id: string
  question: string
  answer: string
  explanation: string
  module_name: string
  position: number
  progress: {
    repetition: number
    ease_factor: number
    interval_days: number
    next_review_at: string
    last_rating: number
  } | null
}

const RATINGS = [
  { value: 1, label: 'Oublié', color: 'bg-red-500 hover:bg-red-600', icon: XCircle },
  { value: 2, label: 'Difficile', color: 'bg-orange-500 hover:bg-orange-600', icon: AlertCircle },
  { value: 3, label: 'Bien', color: 'bg-blue-500 hover:bg-blue-600', icon: CheckCircle2 },
  { value: 4, label: 'Facile', color: 'bg-green-500 hover:bg-green-600', icon: Smile },
]

export default function OsteoFlashPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null)
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [loadingCards, setLoadingCards] = useState(false)

  useEffect(() => {
    fetch('/api/flashcards/decks')
      .then((r) => r.json())
      .then((data) => { setDecks(data.decks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const startDeck = useCallback(async (deck: FlashcardDeck) => {
    setLoadingCards(true)
    setActiveDeck(deck)
    try {
      const res = await fetch(`/api/flashcards/${deck.id}/cards`)
      const data = await res.json()
      const allCards: Flashcard[] = data.cards ?? []

      const now = new Date().toISOString()
      const due = allCards.filter(
        (c) => !c.progress || c.progress.next_review_at <= now
      )
      const toReview = due.length > 0 ? due : allCards.slice(0, 20)
      setSessionCards([...toReview].sort(() => Math.random() - 0.5))
      setCurrentIndex(0)
      setFlipped(false)
      setSessionDone(false)
      setRating(null)
    } finally {
      setLoadingCards(false)
    }
  }, [])

  const handleRate = useCallback(async (ratingValue: number) => {
    const card = sessionCards[currentIndex]
    if (!card) return
    setRating(ratingValue)

    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, deck_id: card.deck_id, rating: ratingValue }),
    })

    setTimeout(() => {
      if (currentIndex + 1 >= sessionCards.length) {
        setSessionDone(true)
      } else {
        setCurrentIndex((i) => i + 1)
        setFlipped(false)
        setRating(null)
      }
    }, 300)
  }, [sessionCards, currentIndex])

  const exitSession = useCallback(() => {
    setActiveDeck(null)
    setSessionCards([])
    setSessionDone(false)
    setFlipped(false)
    setRating(null)
    fetch('/api/flashcards/decks').then((r) => r.json()).then((data) => setDecks(data.decks ?? []))
  }, [])

  const currentCard = sessionCards[currentIndex]

  // ── Session view ──────────────────────────────────────────────
  if (activeDeck) {
    if (loadingCards) {
      return (
        <AuthLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
          </div>
        </AuthLayout>
      )
    }

    if (sessionDone) {
      const reviewed = sessionCards.length
      return (
        <AuthLayout>
          <div className="max-w-lg mx-auto pt-12 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Session terminée !</h2>
            <p className="text-slate-500 mb-8">{reviewed} carte{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''}</p>
            <button
              onClick={exitSession}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
            >
              Retour aux thèmes
            </button>
          </div>
        </AuthLayout>
      )
    }

    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={exitSession} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> Quitter
            </button>
            <span className="text-sm font-medium text-slate-600">
              {currentIndex + 1} / {sessionCards.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6">
            <div
              className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex) / sessionCards.length) * 100}%` }}
            />
          </div>

          {/* Module badge */}
          {currentCard?.module_name && (
            <p className="text-xs text-violet-600 font-medium mb-3 text-center">{currentCard.module_name}</p>
          )}

          {/* Card front */}
          <div
            className={`cursor-pointer select-none rounded-2xl border border-slate-200 bg-white shadow-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center transition-all duration-200 ${flipped ? 'opacity-0 h-0 overflow-hidden p-0 min-h-0' : ''}`}
            onClick={() => !flipped && setFlipped(true)}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Question</p>
            <p className="text-lg font-semibold text-slate-900 leading-relaxed">{currentCard?.question}</p>
            {!flipped && (
              <p className="text-xs text-slate-400 mt-6">Appuyez pour révéler la réponse</p>
            )}
          </div>

          {/* Card back */}
          {flipped && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 shadow-lg p-8 min-h-[200px] flex flex-col">
              <p className="text-xs uppercase tracking-widest text-violet-500 mb-3">Réponse</p>
              <p className="text-lg font-bold text-violet-900 mb-4 leading-relaxed">{currentCard?.answer}</p>
              {currentCard?.explanation && (
                <div className="border-t border-violet-200 pt-4 mt-2">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Explication</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentCard.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Rating buttons */}
          {flipped && (
            <div className="mt-6 grid grid-cols-4 gap-3">
              {RATINGS.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.value}
                    onClick={() => handleRate(r.value)}
                    disabled={rating !== null}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-white font-semibold text-sm transition-all ${
                      rating === r.value ? 'opacity-100 scale-95' : rating !== null ? 'opacity-40' : ''
                    } ${r.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    {r.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </AuthLayout>
    )
  }

  // ── Deck list view ────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-violet-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Brain className="h-4 w-4" /> OsteoFlash
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-violet-100 to-indigo-200 bg-clip-text text-transparent">
                Mémorisation active
              </h1>
              <p className="text-violet-300/70 text-sm mt-1.5">
                Révisez vos thèmes cliniques par cartes recto-verso avec progression adaptée à votre niveau.
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        </div>

        {/* Body */}
        <div className="relative bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 md:px-10 pt-8 pb-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {decks.map((deck) => {
                const pct = deck.total_cards > 0
                  ? Math.round((deck.user_reviewed / deck.total_cards) * 100)
                  : 0
                const hasDue = deck.user_due > 0

                return (
                  <button
                    key={deck.id}
                    onClick={() => startDeck(deck)}
                    className="group rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl p-6 text-left transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      {hasDue && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                          {deck.user_due} à réviser
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">{deck.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{deck.description}</p>

                    {/* Progress bar */}
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{deck.user_reviewed} / {deck.total_cards} cartes maîtrisées</span>
                      <span className="font-semibold text-violet-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-violet-600 text-sm font-semibold">
                      Commencer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
