'use client'

import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import Personnage, { Bulle, Scene } from './Personnage'

export type QueDireOption = {
  /** Ce que le praticien dit. */
  label: string
  correct: boolean
  /** Expression du patient en entendant cette phrase. */
  expression?: string | null
  /** Ce que le patient répond. */
  reaction?: string | null
  /** Pourquoi cette phrase aide ou nuit. */
  feedback?: string | null
}

export type QueDirePayload = {
  personnage?: string
  expression?: string | null
  /** Ce que dit le patient pour ouvrir la situation. */
  question: string
  options: QueDireOption[]
}

/**
 * « Que dites-vous au patient ? » : on choisit une formulation et l'on voit le
 * patient y réagir. La bonne réponse est la formulation de remplacement du
 * chapitre ; les autres sont des phrases réellement entendues en cabinet. On
 * peut réessayer : c'est la réaction du patient qui enseigne, pas la note.
 */
export default function QueDire({
  payload,
  onResolved,
}: {
  payload: QueDirePayload
  onResolved: (ok: boolean) => void
}) {
  const patient = payload?.personnage || 'patient'
  const options = payload?.options || []
  const [choix, setChoix] = useState<number | null>(null)
  const [essais, setEssais] = useState(0)

  const option = choix === null ? null : options[choix]

  const choisir = (k: number) => {
    setChoix(k)
    setEssais((n) => n + 1)
    // Seule la première réponse compte pour le score : réessayer après avoir
    // vu la réaction du patient ne doit pas transformer un échec en réussite.
    if (essais === 0) onResolved(Boolean(options[k]?.correct))
  }

  return (
    <div className="space-y-4">
      <Scene className="px-4 pb-4 pt-4 sm:px-6">
        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Bulle qui={patient} declencheur={choix ?? 'q'} className="max-w-xl">
            {option?.reaction || payload.question}
          </Bulle>
          <div className="mx-auto flex h-52 w-40 items-end justify-center sm:h-64 sm:w-48">
            <Personnage
              id={patient}
              expression={option?.expression ?? payload.expression}
              animation={option ? (option.correct ? 'saute' : 'tremble') : 'apparait'}
              declencheur={choix ?? 'q'}
              className="max-h-full w-auto"
            />
          </div>
        </div>
      </Scene>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vous répondez :</p>
        {options.map((o, k) => {
          const choisie = choix === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => choisir(k)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                choisie
                  ? o.correct
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  choisie ? (o.correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : 'bg-slate-100 text-slate-500'
                }`}
              >
                {choisie ? o.correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" /> : String.fromCharCode(65 + k)}
              </span>
              <span>« {o.label} »</span>
            </button>
          )
        })}
      </div>

      {option?.feedback && (
        <div
          className={`rounded-xl p-4 text-sm ${
            option.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
          }`}
        >
          <strong>{option.correct ? 'Bien dit. ' : 'Regardez sa réaction. '}</strong>
          {option.feedback}
        </div>
      )}

      {option && !option.correct && (
        <button
          type="button"
          onClick={() => setChoix(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          <RotateCcw className="h-4 w-4" />
          Essayer une autre formulation
        </button>
      )}
    </div>
  )
}
