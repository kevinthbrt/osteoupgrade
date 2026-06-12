'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import FreeContentGate from '@/components/FreeContentGate'
import { fetchProfilePayload } from '@/lib/profile-client'
import { Brain, ChevronRight, RotateCcw, CheckCircle2, XCircle, AlertCircle, Smile, RotateCw, Award, Download, ChevronDown, Eye, ThumbsUp, Zap } from 'lucide-react'

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

const MAX_REQUEUE = 2

function HowItWorks() {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-4xl mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white border border-violet-100 shadow-sm hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Comment fonctionne OsteoFlash ?</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-2xl bg-white border border-violet-100 shadow-sm overflow-hidden">
          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                <Eye className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">1. Lisez la question</p>
                <p className="text-xs text-slate-500 leading-relaxed">Chaque carte affiche une question clinique. Réfléchissez avant de révéler la réponse.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <ThumbsUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">2. Évaluez-vous</p>
                <p className="text-xs text-slate-500 leading-relaxed">Après avoir vu la réponse, notez votre niveau de mémorisation avec l&apos;un des 4 boutons.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">3. La répétition s&apos;adapte</p>
                <p className="text-xs text-slate-500 leading-relaxed">L&apos;algorithme planifie automatiquement la prochaine révision au moment optimal pour ancrer la mémoire.</p>
              </div>
            </div>
          </div>

          {/* Ratings legend */}
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Les 4 niveaux de réponse</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700">Oublié</p>
                  <p className="text-[11px] text-red-400 leading-tight">La carte revient immédiatement dans la session</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-orange-700">Difficile</p>
                  <p className="text-[11px] text-orange-400 leading-tight">Intervalle court, révision rapprochée</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-700">Bien</p>
                  <p className="text-[11px] text-blue-400 leading-tight">Intervalle standard, progression normale</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
                <Smile className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-700">Facile</p>
                  <p className="text-[11px] text-green-400 leading-tight">Intervalle long, carte bien ancrée</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              ℹ️ Une carte est considérée <strong>maîtrisée</strong> dès qu&apos;elle est répondue <strong>Bien</strong> ou <strong>Facile</strong> au moins une fois. Atteindre 100 % sur un thème débloque un <strong>certificat PDF</strong> téléchargeable.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OsteoFlashPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null)
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([])
  const [requeueCount, setRequeuCount] = useState<Record<string, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [loadingCards, setLoadingCards] = useState(false)
  const [certificate, setCertificate] = useState<{ number: string; isNew: boolean } | null>(null)
  const [certLoading, setCertLoading] = useState(false)

  const isFree = role !== null && !['premium', 'admin'].includes(role)

  useEffect(() => {
    fetchProfilePayload().then((payload) => {
      if (!payload?.user) { router.push('/'); return }
      setRole(payload.profile?.role || 'free')
    })
  }, [router])

  useEffect(() => {
    if (!role || isFree) return
    fetch('/api/flashcards/decks')
      .then((r) => r.json())
      .then((data) => { setDecks(data.decks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, isFree])

  const startDeck = useCallback(async (deck: FlashcardDeck) => {
    setLoadingCards(true)
    setActiveDeck(deck)
    setRequeuCount({})
    setCertificate(null)
    try {
      const res = await fetch(`/api/flashcards/${deck.id}/cards`)
      const data = await res.json()
      const allCards: Flashcard[] = data.cards ?? []
      const now = new Date().toISOString()
      const due = allCards.filter((c) => !c.progress || c.progress.next_review_at <= now)
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
      const nextIndex = currentIndex + 1

      if (ratingValue === 1) {
        const count = requeueCount[card.id] ?? 0
        if (count < MAX_REQUEUE) {
          setSessionCards((prev) => [...prev, card])
          setRequeuCount((prev) => ({ ...prev, [card.id]: count + 1 }))
        }
      }

      setSessionCards((prev) => {
        const willBeDone = nextIndex >= prev.length
        if (willBeDone) setSessionDone(true)
        return prev
      })

      setCurrentIndex(nextIndex)
      setFlipped(false)
      setRating(null)
    }, 300)
  }, [sessionCards, currentIndex, requeueCount])

  const exitSession = useCallback(() => {
    setActiveDeck(null)
    setSessionCards([])
    setRequeuCount({})
    setSessionDone(false)
    setFlipped(false)
    setRating(null)
    setCertificate(null)
    fetch('/api/flashcards/decks').then((r) => r.json()).then((data) => setDecks(data.decks ?? []))
  }, [])

  useEffect(() => {
    if (!sessionDone || !activeDeck) return
    setCertLoading(true)
    fetch('/api/flashcards/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_id: activeDeck.id }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.certificate_number) {
          setCertificate({ number: data.certificate_number, isNew: !data.already_existed })
        }
      })
      .catch(() => {})
      .finally(() => setCertLoading(false))
  }, [sessionDone, activeDeck?.id])

  const currentCard = sessionCards[currentIndex]
  const isDone = sessionDone || (sessionCards.length > 0 && currentIndex >= sessionCards.length)

  // ── Session view ─────────────────────────────────────────────
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

    if (isDone) {
      const reviewed = sessionCards.length
      return (
        <AuthLayout>
          <div className="max-w-lg mx-auto pt-12 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Session terminée !</h2>
            <p className="text-slate-500 mb-8">{reviewed} carte{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''}</p>

            {certLoading && (
              <p className="text-sm text-slate-400 mb-4 animate-pulse">Vérification du niveau…</p>
            )}
            {certificate && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-center mb-6 shadow-lg">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                <div className="relative">
                  {certificate.isNew && (
                    <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-2">
                      🎓 Thème maîtrisé à 100 %
                    </p>
                  )}
                  <Award className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <p className="text-white font-bold text-lg mb-1">Certificat d&apos;Excellence</p>
                  <p className="text-violet-300 text-xs mb-4 font-mono">{certificate.number}</p>
                  <a
                    href={`/api/flashcards/certificate/pdf?deck_id=${activeDeck?.id}`}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger mon certificat PDF
                  </a>
                </div>
              </div>
            )}

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

    const requeuedCount = requeueCount[currentCard?.id ?? ''] ?? 0

    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={exitSession} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> Quitter
            </button>
            <span className="text-sm font-medium text-slate-600">
              {currentIndex + 1} / {sessionCards.length}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6">
            <div
              className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / sessionCards.length) * 100}%` }}
            />
          </div>

          {currentCard?.module_name && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-xs text-violet-600 font-medium">{currentCard.module_name}</p>
              {requeuedCount > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                  <RotateCw className="w-3 h-3" /> À revoir
                </span>
              )}
            </div>
          )}

          <div
            className={`cursor-pointer select-none rounded-2xl border border-slate-200 bg-white shadow-lg text-center transition-all duration-200 ${flipped ? 'px-6 py-4' : 'p-8 min-h-[200px] flex flex-col items-center justify-center'}`}
            onClick={() => !flipped && setFlipped(true)}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Question</p>
            <p className={`font-semibold text-slate-900 leading-relaxed ${flipped ? 'text-sm' : 'text-lg'}`}>{currentCard?.question}</p>
            {!flipped && (
              <p className="text-xs text-slate-400 mt-6">Appuyez pour révéler la réponse</p>
            )}
          </div>

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

          {flipped && (
            <p className="text-xs text-center text-slate-400 mt-3">
              Oublié = la carte revient dans cette session
            </p>
          )}
        </div>
      </AuthLayout>
    )
  }

  // ── Deck list view ────────────────────────────────────────────
  return (
    <AuthLayout>
      <FreeContentGate isLocked={isFree}>
      <div className="min-h-screen -m-6 md:-m-8">
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

        <div className="relative bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 md:px-10 pt-8 pb-10">
          <HowItWorks />

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
                const mastered = pct === 100
                return (
                  <div
                    key={deck.id}
                    onClick={() => startDeck(deck)}
                    className="group rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl p-6 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
                        mastered
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                          : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                      }`}>
                        {mastered ? <Award className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {mastered && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            100% ✓
                          </span>
                        )}
                        {!mastered && deck.user_due > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            {deck.user_due} à réviser
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{deck.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{deck.description}</p>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{deck.user_reviewed} / {deck.total_cards} cartes maîtrisées</span>
                      <span className={`font-semibold ${mastered ? 'text-amber-600' : 'text-violet-700'}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          mastered
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-violet-600 text-sm font-semibold">
                        {mastered ? 'Réviser' : 'Commencer'}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                      {mastered && (
                        <a
                          href={`/api/flashcards/certificate/pdf?deck_id=${deck.id}`}
                          download
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Certificat PDF
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </FreeContentGate>
    </AuthLayout>
  )
}
