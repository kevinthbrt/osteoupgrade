'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import Personnage, { Bulle, Scene } from './Personnage'

export type Replique = {
  personnage: string
  expression?: string | null
  texte: string
}

export type ScenePayload = {
  repliques: Replique[]
}

/**
 * Un dialogue en quelques répliques, que l'on fait avancer soi-même. Les deux
 * premiers personnages qui parlent occupent la scène, à gauche et à droite ;
 * chacun garde sa dernière expression quand l'autre parle.
 */
export default function SceneDialogue({ payload }: { payload: ScenePayload }) {
  const repliques = payload?.repliques || []
  const [i, setI] = useState(0)

  const acteurs = useMemo(() => {
    const ids: string[] = []
    for (const r of repliques) {
      if (!ids.includes(r.personnage)) ids.push(r.personnage)
      if (ids.length === 2) break
    }
    return ids
  }, [repliques])

  if (repliques.length === 0) return null

  // L'expression de chaque acteur est celle de sa dernière réplique déjà jouée.
  const expressionDe = (id: string) => {
    for (let k = i; k >= 0; k--) {
      if (repliques[k].personnage === id) return repliques[k].expression ?? null
    }
    return repliques.find((r) => r.personnage === id)?.expression ?? null
  }

  const courante = repliques[i]
  const derniere = i === repliques.length - 1

  return (
    <div className="space-y-3">
      <Scene className="px-4 pb-5 pt-4 sm:px-6">
        <Bulle qui={courante.personnage} declencheur={i} className="mb-4 max-w-xl">
          {courante.texte}
        </Bulle>
        <div className="flex items-end justify-around gap-4">
          {acteurs.map((id) => (
            <div
              key={id}
              className={`flex h-48 w-1/2 max-w-[220px] items-end justify-center transition-opacity duration-300 sm:h-60 ${
                courante.personnage === id ? 'opacity-100' : 'opacity-80'
              }`}
            >
              <Personnage
                id={id}
                expression={expressionDe(id)}
                animation="apparait"
                declencheur={courante.personnage === id ? i : undefined}
                className="max-h-full w-auto"
              />
            </div>
          ))}
        </div>
      </Scene>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={`Réplique ${i + 1} sur ${repliques.length}`}>
          {repliques.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 w-6 rounded-full transition-colors ${k <= i ? 'bg-violet-500' : 'bg-violet-200'}`}
            />
          ))}
        </div>
        {derniere ? (
          <button
            type="button"
            onClick={() => setI(0)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-200"
          >
            <RotateCcw className="h-4 w-4" />
            Revoir la scène
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setI((k) => Math.min(k + 1, repliques.length - 1))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Suite
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
