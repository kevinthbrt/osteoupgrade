'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react'
import Personnage, { Scene } from './Personnage'

type Props = {
  titre: string
  partie: string | null
  reussies: number
  notees: number
  minutes: number | null
  suivant: { href: string; titre: string } | null
  retourParcours: string
  onRevoir: () => void
}

const COULEURS = ['#8b5cf6', '#7c3aed', '#c4b5fd', '#facc15', '#34d399', '#f472b6']

/** Confettis sur un canvas, joués une fois à l'arrivée sur l'écran. */
function useConfettis(ref: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const morceaux = Array.from({ length: 140 }, (_, i) => ({
      x: rect.width * 0.3,
      y: rect.height * 0.55,
      vx: (Math.random() - 0.3) * 11,
      vy: -Math.random() * 13 - 4,
      s: 4 + Math.random() * 6,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.3,
      c: COULEURS[i % COULEURS.length],
    }))

    let raf = 0
    const debut = performance.now()
    const boucle = (t: number) => {
      ctx.clearRect(0, 0, rect.width, rect.height)
      for (const m of morceaux) {
        m.vy += 0.32
        m.vx *= 0.99
        m.x += m.vx
        m.y += m.vy
        m.a += m.va
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.a)
        ctx.fillStyle = m.c
        ctx.fillRect(-m.s / 2, -m.s / 4, m.s, m.s / 2)
        ctx.restore()
      }
      if (t - debut < 3200) raf = requestAnimationFrame(boucle)
      else ctx.clearRect(0, 0, rect.width, rect.height)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [ref])
}

export default function FinChapitre({ titre, partie, reussies, notees, minutes, suivant, retourParcours, onRevoir }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useConfettis(canvas)

  return (
    <div className="relative grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-2">
      <Scene className="flex min-h-[260px] items-end justify-center gap-2 rounded-none px-6 pb-6 pt-8">
        <div className="w-44 sm:w-52">
          <Personnage id="bassin" expression="joie" animation="saute" />
        </div>
        <div className="w-28 sm:w-32">
          <Personnage id="disque" expression="soulage" animation="saute" declencheur="fin" />
        </div>
      </Scene>

      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
        <svg viewBox="0 0 54 54" className="h-12 w-12" aria-hidden="true">
          <circle cx="27" cy="27" r="27" className="fill-emerald-50" />
          <path
            d="M16 28 l7 7 l15 -16"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="fin-coche stroke-emerald-500"
          />
        </svg>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chapitre terminé !</h2>
          <p className="mt-1 text-sm text-slate-500">
            {titre}
            {partie ? ` · ${partie}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {notees > 0 && (
            <div className="rounded-xl bg-violet-50 px-4 py-2.5">
              <b className="block text-xl tabular-nums text-slate-900">
                {reussies}/{notees}
              </b>
              <span className="text-xs text-slate-500">exercices réussis du premier coup</span>
            </div>
          )}
          {minutes ? (
            <div className="rounded-xl bg-violet-50 px-4 py-2.5">
              <b className="block text-xl tabular-nums text-slate-900">{minutes} min</b>
              <span className="text-xs text-slate-500">de formation</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {suivant ? (
            <Link
              href={suivant.href}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-700"
            >
              Chapitre suivant : {suivant.titre}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={retourParcours}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <BookOpen className="h-4 w-4" />
              Retour au parcours
            </Link>
          )}
          <button
            type="button"
            onClick={onRevoir}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            <RotateCcw className="h-4 w-4" />
            Revoir le chapitre
          </button>
        </div>
      </div>

      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  )
}
