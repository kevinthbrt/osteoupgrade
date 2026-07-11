'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Page mobile (scannée via QR) : saisie des réponses/tests, classement en direct,
// synchronisée avec l'ordinateur via /api/osteoflow/hypotheses-sync (jeton).
// Données NON identifiantes uniquement (hypothèses/tests/questions/réponses).

interface Hypothesis { id: number; label: string; prior: number; rationale: string }
interface HypothesisTest { test_id: string; name: string; region: string; targetId: number; deltaPositive: number; deltaNegative: number; rationale: string }
interface QuestionAnswer { label: string; targetId: number; delta: number }
interface ClinicalQuestion { id: string; text: string; answers: QuestionAnswer[] }
interface Payload { hypotheses: Hypothesis[]; tests: HypothesisTest[]; questions?: ClinicalQuestion[] }
type TestResult = 'positive' | 'negative' | null
interface SyncState { results: Record<string, TestResult>; answers: Record<string, number | null> }

function recompute(hyps: Hypothesis[], effects: { targetId: number; delta: number }[]): Record<number, number> {
  const scores: Record<number, number> = {}
  for (const h of hyps) scores[h.id] = h.prior
  for (const e of effects) if (scores[e.targetId] !== undefined) scores[e.targetId] += e.delta
  for (const id of Object.keys(scores)) {
    const n = Number(id)
    scores[n] = Math.min(99, Math.max(1, scores[n]))
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const out: Record<number, number> = {}
  for (const id of Object.keys(scores)) {
    const n = Number(id)
    out[n] = total > 0 ? Math.round((scores[n] / total) * 100) : 0
  }
  return out
}

const RANK_BAR = ['bg-indigo-500', 'bg-sky-500', 'bg-teal-500']
const RANK_TEXT = ['text-indigo-600', 'text-sky-600', 'text-teal-600']

export default function MobileHypothesesPage({ params }: { params: { token: string } }) {
  const token = params.token
  const [payload, setPayload] = useState<Payload | null>(null)
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const lastWriteRef = useRef(0)
  const appliedUpdatedAtRef = useRef<string | null>(null)

  const push = useCallback((state: SyncState) => {
    lastWriteRef.current = Date.now()
    fetch('/api/osteoflow/hypotheses-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, state }),
    }).catch(() => { /* réessayé au prochain changement */ })
  }, [token])

  // Polling de l'état distant.
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const res = await fetch(`/api/osteoflow/hypotheses-sync?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        if (!res.ok) { if (alive) setError('Session introuvable ou expirée.'); return }
        const data = await res.json() as { payload: Payload | null; state: SyncState | null; updated_at: string | null }
        if (!alive) return
        setError(null)
        setConnected(true)
        if (data.payload) setPayload(prev => prev ?? data.payload)
        // Applique l'état distant sauf si on vient d'écrire (anti-clignotement).
        if (
          data.state && data.updated_at &&
          data.updated_at !== appliedUpdatedAtRef.current &&
          Date.now() - lastWriteRef.current > 1500
        ) {
          appliedUpdatedAtRef.current = data.updated_at
          setResults(data.state.results ?? {})
          setAnswers(data.state.answers ?? {})
        }
      } catch {
        if (alive) setConnected(false)
      }
    }
    tick()
    const id = setInterval(tick, 1200)
    return () => { alive = false; clearInterval(id) }
  }, [token])

  const setResult = (testId: string, value: TestResult) => {
    setResults(prev => {
      const next = { ...prev, [testId]: prev[testId] === value ? null : value }
      push({ results: next, answers })
      return next
    })
  }
  const setAnswer = (qid: string, idx: number) => {
    setAnswers(prev => {
      const next = { ...prev, [qid]: prev[qid] === idx ? null : idx }
      push({ results, answers: next })
      return next
    })
  }

  const probs = useMemo(() => {
    if (!payload) return {}
    const effects: { targetId: number; delta: number }[] = []
    for (const t of payload.tests) {
      const r = results[t.test_id]
      if (r === 'positive') effects.push({ targetId: t.targetId, delta: t.deltaPositive })
      else if (r === 'negative') effects.push({ targetId: t.targetId, delta: t.deltaNegative })
    }
    for (const q of payload.questions ?? []) {
      const ai = answers[q.id]
      if (ai != null && q.answers[ai]) effects.push({ targetId: q.answers[ai].targetId, delta: q.answers[ai].delta })
    }
    return recompute(payload.hypotheses, effects)
  }, [payload, results, answers])

  const ranked = useMemo(
    () => payload ? [...payload.hypotheses].sort((a, b) => (probs[b.id] ?? b.prior) - (probs[a.id] ?? a.prior)) : [],
    [payload, probs],
  )

  if (error) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-gray-600">{error}</div>
  }
  if (!payload) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-gray-500">{connected ? 'En attente des hypothèses…' : 'Connexion…'}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 space-y-3 max-w-md mx-auto">
      <h1 className="text-base font-semibold text-violet-900 flex items-center gap-2">🩺 Hypothèses cliniques</h1>

      <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] leading-snug text-amber-800">
        Aide à la décision. Pourcentages indicatifs, non validés cliniquement. La décision relève de la seule responsabilité du praticien.
      </div>

      <div className="space-y-2">
        {ranked.map((h, i) => {
          const p = probs[h.id] ?? h.prior
          return (
            <div key={h.id} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-bold ${RANK_TEXT[i] ?? RANK_TEXT[0]}`}>#{i + 1}</span>
                <span className="text-sm font-medium flex-1">{h.label}</span>
                <span className={`text-base font-bold tabular-nums ${RANK_TEXT[i] ?? RANK_TEXT[0]}`}>{p}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${RANK_BAR[i] ?? RANK_BAR[0]}`} style={{ width: `${p}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {payload.questions && payload.questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Questions à poser</p>
          {payload.questions.map((q) => {
            const sel = answers[q.id] ?? null
            return (
              <div key={q.id} className="rounded-lg border bg-white px-3 py-2.5 space-y-2">
                <p className="text-sm font-medium leading-snug">{q.text}</p>
                <div className="flex flex-wrap gap-2">
                  {q.answers.map((a, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnswer(q.id, idx)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium border ${sel === idx ? 'bg-violet-600 text-white border-violet-600' : 'border-violet-300 text-violet-700'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {payload.tests.length > 0 && (
        <div className="space-y-2 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tests à réaliser</p>
          {payload.tests.map((t) => {
            const r = results[t.test_id] ?? null
            return (
              <div key={t.test_id} className="rounded-lg border bg-white px-3 py-2.5 space-y-2">
                <div className="text-sm font-medium">{t.name}{t.region && <span className="text-[11px] text-gray-400 font-normal"> · {t.region}</span>}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResult(t.test_id, 'positive')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${r === 'positive' ? 'bg-green-600 text-white border-green-600' : 'border-green-300 text-green-700'}`}
                  >
                    Positif
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult(t.test_id, 'negative')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${r === 'negative' ? 'bg-red-600 text-white border-red-600' : 'border-red-300 text-red-700'}`}
                  >
                    Négatif
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
