'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Décompte jusqu'à l'échéance de l'offre.
 *
 * Rendu uniquement côté client : la date cible est absolue, mais le temps
 * restant dépend de l'horloge du visiteur. Calculé au rendu serveur, il
 * afficherait la valeur figée au moment du build ou de la requête, et
 * divergerait immédiatement.
 */
export default function Countdown({ deadline }: { deadline: string }) {
  const target = new Date(deadline).getTime()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(target - Date.now())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [target])

  // Premier rendu client : on n'affiche rien tant que l'horloge n'a pas été
  // lue, pour éviter un écart d'hydratation avec le HTML serveur.
  if (remaining === null) return null

  if (remaining <= 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
        <Clock className="h-4 w-4" />
        Cette offre est terminée
      </div>
    )
  }

  const seconds = Math.floor(remaining / 1000)
  const parts = [
    { value: Math.floor(seconds / 86400), label: 'jours' },
    { value: Math.floor((seconds % 86400) / 3600), label: 'heures' },
    { value: Math.floor((seconds % 3600) / 60), label: 'min' },
    { value: seconds % 60, label: 'sec' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="timer" aria-live="off">
      {parts.map((part) => (
        <div
          key={part.label}
          className="min-w-[64px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm sm:min-w-[76px]"
        >
          <div className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
            {String(part.value).padStart(2, '0')}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {part.label}
          </div>
        </div>
      ))}
    </div>
  )
}
