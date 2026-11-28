'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Personnage, { Bulle, Scene } from './Personnage'

export type Cible = {
  /** Étage affiché au survol, par exemple « L4-L5 ». */
  label: string
  /** Position verticale sur l'image de la colonne, en pourcentage de sa hauteur. */
  y: number
  correct: boolean
  feedback?: string | null
}

export type TrouverNiveauPayload = {
  cibles: Cible[]
}

/**
 * Positions des disques sur l'image `public/personnages/colonne/neutre.webp`,
 * mesurées sur l'image. À reprendre si l'image change.
 */
export const DISQUES_COLONNE: Record<string, number> = {
  'L1-L2': 17.5,
  'L2-L3': 34,
  'L3-L4': 50.5,
  'L4-L5': 66,
  'L5-S1': 81,
}

/**
 * On désigne un étage sur la colonne ; la vertèbre réagit. Comme pour les
 * autres activités, seule la première réponse compte pour le score.
 */
export default function TrouverNiveau({
  payload,
  onResolved,
}: {
  payload: TrouverNiveauPayload
  onResolved: (ok: boolean) => void
}) {
  const cibles = payload?.cibles || []
  const [essais, setEssais] = useState<number[]>([])
  const [trouve, setTrouve] = useState(false)

  const derniere = essais.length ? cibles[essais[essais.length - 1]] : null

  const viser = (k: number) => {
    if (trouve || essais.includes(k)) return
    if (essais.length === 0) onResolved(Boolean(cibles[k]?.correct))
    setEssais((e) => [...e, k])
    if (cibles[k]?.correct) setTrouve(true)
  }

  const recommencer = () => {
    setEssais([])
    setTrouve(false)
  }

  const expression = !derniere ? 'perplexe' : derniere.correct ? 'fier' : 'stresse'
  const replique = !derniere
    ? 'Cliquez sur un disque !'
    : derniere.correct
      ? 'C’est bien celui-là !'
      : 'Hmm, pas celui-là…'

  return (
    <div className="space-y-4">
      <Scene className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="relative w-36 shrink-0 sm:w-44" style={{ aspectRatio: '281 / 700' }}>
            <Personnage id="colonne" animation="apparait" className="h-full w-full" alt="Colonne lombaire de L1 au sacrum" />
            {cibles.map((c, k) => {
              const essaye = essais.includes(k)
              return (
                <button
                  key={k}
                  type="button"
                  aria-label={`Disque ${c.label}`}
                  onClick={() => viser(k)}
                  style={{ top: `${c.y}%` }}
                  className={`group absolute left-[22%] h-[6.5%] w-[56%] -translate-y-1/2 rounded-full border-2 border-dashed transition-colors ${
                    essaye
                      ? c.correct
                        ? 'border-emerald-500 bg-emerald-400/30'
                        : 'border-rose-500 bg-rose-400/25'
                      : 'border-violet-500/40 hover:border-violet-600 hover:bg-violet-500/20 focus-visible:border-violet-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute left-[105%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white transition-opacity ${
                      essaye ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex w-36 flex-col items-center gap-3 sm:w-48">
            <Bulle qui="vertebre" declencheur={essais.length} className="text-sm">
              {replique}
            </Bulle>
            <Personnage
              id="vertebre"
              expression={expression}
              animation={!derniere ? 'apparait' : derniere.correct ? 'saute' : 'tremble'}
              declencheur={essais.length}
              className="w-full"
            />
          </div>
        </div>
      </Scene>

      {derniere?.feedback && (
        <div className={`rounded-xl p-4 text-sm ${derniere.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
          <strong>{derniere.label} : {derniere.correct ? 'bien vu. ' : 'pas tout à fait. '}</strong>
          {derniere.feedback}
          {!derniere.correct && ' Essayez encore.'}
        </div>
      )}

      {essais.length > 0 && (
        <button
          type="button"
          onClick={recommencer}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </button>
      )}
    </div>
  )
}
