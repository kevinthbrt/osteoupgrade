'use client'

import { useEffect, useState } from 'react'
import { Eye, Loader2, X } from 'lucide-react'
import { PLANS, planLabel, type Plan } from '@/lib/entitlements'

/**
 * Bandeau de simulation d'offre (cf. lib/plan-simulation.ts).
 *
 * Rendu sur toutes les pages connectées, mais invisible tant qu'aucune
 * simulation n'est active. Il est volontairement flottant et non bloquant : il
 * ne décale aucune mise en page, donc l'écran observé reste celui que verrait
 * réellement l'abonné.
 *
 * Il porte aussi le sélecteur d'offre : une fois en simulation, la navigation
 * se verrouille comme pour l'abonné simulé — le lien Admin disparaît. Sans
 * cette sortie toujours visible, l'administrateur devrait retrouver `/admin`
 * de mémoire pour revenir.
 */
export default function PlanSimulationBanner() {
  const [simulation, setSimulation] = useState<Plan | null>(null)
  const [enCours, setEnCours] = useState<Plan | 'sortie' | null>(null)

  useEffect(() => {
    let annule = false
    fetch('/api/profile', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!annule) setSimulation(payload?.simulation ?? null)
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [])

  const changer = async (plan: Plan | null) => {
    setEnCours(plan ?? 'sortie')
    try {
      await fetch('/api/admin/simulate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      window.location.reload()
    } catch {
      setEnCours(null)
    }
  }

  if (!simulation) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[min(96vw,44rem)] px-2">
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/95 backdrop-blur-xl shadow-2xl px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-900">
          <Eye className="h-4 w-4" />
          Simulation : {planLabel(simulation)}
        </span>
        <span className="text-xs text-amber-800/80 flex-1 min-w-[12rem]">
          Vous voyez l&apos;interface d&apos;un abonné {planLabel(simulation)}. Aucune donnée n&apos;est modifiée.
        </span>
        <div className="flex items-center gap-1.5">
          {PLANS.filter((p) => p !== simulation).map((p) => (
            <button
              key={p}
              onClick={() => changer(p)}
              disabled={enCours !== null}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition disabled:opacity-50"
            >
              {enCours === p ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : planLabel(p)}
            </button>
          ))}
          <button
            onClick={() => changer(null)}
            disabled={enCours !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900 text-amber-50 text-xs font-bold hover:bg-amber-800 transition disabled:opacity-50"
          >
            {enCours === 'sortie' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Quitter
          </button>
        </div>
      </div>
    </div>
  )
}
