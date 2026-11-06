'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { TrendingUp, Sparkles, Wallet } from 'lucide-react'

/*
 * Cartes « Objectifs » et « Ma rémunération » de la page d'accueil, recréées
 * à l'identique des écrans de MyOsteoflow (cabinet de démonstration, chiffres
 * fictifs) pour pouvoir les animer au défilement : la courbe se trace, les
 * jauges se remplissent, les montants défilent, le calcul se pose ligne à
 * ligne. Sans animation si le visiteur les a réduites.
 */

const euros = (value: number, decimals = 0) =>
  `${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} €`

/** Avancement de la carte : 0 quand elle entre à l'écran, 1 quand elle est bien en vue. */
function useCardProgress() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'center 0.5'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })
  const still = useTransform(scrollYProgress, () => 1)
  return { ref, p: reduced ? still : smooth }
}

function Amount({ p, from = 0, to, range, decimals = 0, className }: { p: MotionValue<number>; from?: number; to: number; range: [number, number]; decimals?: number; className?: string }) {
  const value = useTransform(p, range, [from, to], { clamp: true })
  const text = useTransform(value, (v) => euros(v, decimals))
  return <motion.span className={`tabular-nums ${className ?? ''}`}>{text}</motion.span>
}

function Gauge({ p, label, sub, done, target, ratio, tone, range }: { p: MotionValue<number>; label: string; sub: string; done: number; target: number; ratio: number; tone: 'green' | 'white' | 'amber'; range: [number, number] }) {
  const width = useTransform(p, range, ['0%', `${Math.min(100, ratio * 100)}%`], { clamp: true })
  const bar = tone === 'green' ? 'bg-emerald-400' : tone === 'amber' ? 'bg-amber-300' : 'bg-white'
  const badge = tone === 'green' ? 'bg-emerald-400 text-emerald-950' : tone === 'amber' ? 'bg-amber-300 text-amber-950' : 'bg-white/15 text-white'
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.07] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white">{label}</p>
          <p className="truncate text-xs text-blue-100/80">{sub}</p>
        </div>
        <span className={`flex-none rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{Math.round(ratio * 100)} %</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
        <motion.div style={{ width }} className={`h-full rounded-full ${bar}`} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-2 text-xs">
        <Amount p={p} to={done} range={range} className="font-semibold text-white" />
        <span className="text-blue-100/80">sur {euros(target)}</span>
      </div>
    </div>
  )
}

// Chiffre d'affaires cumulé fin de mois (janvier à octobre), puis au 4 novembre
const ACTUAL = [0, 5200, 10700, 16600, 22300, 28000, 34100, 38900, 40800, 46900, 53600, 55925]
const ACTUAL_X = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10.13]
const GOAL = 65000
const PROJECTION = 66347
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const W = 600
const H = 190
const sx = (month: number) => (month / 12) * W
const sy = (value: number) => H - 10 - (value / 70000) * (H - 20)

/** Objectifs : la trajectoire de l'année se trace, les jauges se remplissent. */
export function ObjectivesCard() {
  const { ref, p } = useCardProgress()
  const actualPath = ACTUAL.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(ACTUAL_X[i]).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ')
  const last = { x: sx(ACTUAL_X[ACTUAL_X.length - 1]), y: sy(ACTUAL[ACTUAL.length - 1]) }
  const draw = useTransform(p, [0.25, 0.8], [0, 1], { clamp: true })
  const projection = useTransform(p, [0.8, 0.95], [0, 1], { clamp: true })
  const marker = useTransform(p, [0.78, 0.85], [0, 1], { clamp: true })
  const badge = useTransform(p, [0.05, 0.25], [0, 1], { clamp: true })

  return (
    <div ref={ref} className="rounded-2xl bg-gradient-to-br from-[#2f63e6] to-[#2448c9] p-5 sm:p-6 text-white shadow-2xl shadow-blue-900/25">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-bold">Trajectoire annuelle 2026</h4>
        <motion.span style={{ opacity: badge }} className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/25 px-3 py-1 text-sm font-semibold">
          ▲ En avance de 1 136 €
        </motion.span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Gauge p={p} label="Aujourd’hui" sub="mercredi 4 novembre" done={300} target={283} ratio={1} tone="green" range={[0.05, 0.35]} />
        <Gauge p={p} label="Semaine" sub="Objectif : 1 413 €" done={1020} target={1413} ratio={0.72} tone="white" range={[0.1, 0.4]} />
        <Gauge p={p} label="Novembre" sub="Objectif : 5 417 €" done={1020} target={5417} ratio={0.19} tone="white" range={[0.15, 0.45]} />
        <Gauge p={p} label="Année 2026" sub="Objectif : 65 000 €" done={55925} target={65000} ratio={0.86} tone="amber" range={[0.2, 0.5]} />
      </div>

      <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.07] p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-blue-100"><Sparkles className="h-4 w-4" />Projection fin 2026, au rythme actuel</p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight"><Amount p={p} to={PROJECTION} range={[0.3, 0.9]} /></p>
          </div>
          <motion.span style={{ opacity: projection }} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-semibold text-emerald-200">
            <TrendingUp className="h-4 w-4" />+1 347 € par rapport à l’objectif
          </motion.span>
        </div>

        <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-3 w-full" role="img" aria-label="Chiffre d’affaires cumulé de janvier au 4 novembre, au-dessus de la trajectoire de l’objectif annuel">
          {MONTHS.map((month, i) => (
            <g key={month}>
              <line x1={sx(i)} x2={sx(i)} y1={6} y2={H - 6} stroke="rgba(255,255,255,0.08)" />
              <text x={sx(i) + W / 24} y={H + 16} textAnchor="middle" fontSize="11" fill="rgba(219,234,254,0.8)">{month}</text>
            </g>
          ))}
          {/* Objectif : de 0 à 65 000 € sur l'année */}
          <line x1={sx(0)} y1={sy(0)} x2={sx(12)} y2={sy(GOAL)} stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeDasharray="6 6" />
          <text x={sx(12) - 4} y={sy(GOAL) + 20} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.75)">Objectif 65 000 €</text>
          {/* Réel */}
          <motion.path d={actualPath} fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: draw }} />
          {/* Projection jusqu'à décembre */}
          <motion.path d={`M${last.x} ${last.y} L${sx(12)} ${sy(PROJECTION)}`} fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="4 7" strokeLinecap="round" style={{ pathLength: projection, opacity: projection }} />
          <motion.g style={{ opacity: marker }}>
            <circle cx={last.x} cy={last.y} r="7" fill="#fff" />
            <circle cx={last.x} cy={last.y} r="4" fill="#10b981" />
            <rect x={last.x - 112} y={last.y - 34} width="104" height="24" rx="12" fill="#fff" />
            <text x={last.x - 60} y={last.y - 18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e3a8a">4 nov. · 55 925 €</text>
          </motion.g>
        </svg>
      </div>
    </div>
  )
}

const MONTH_STEPS = [
  { label: 'Encaissé', value: 6625, sign: 1 },
  { label: 'Charges (moyenne mensuelle)', value: 976.74, sign: -1 },
  { label: 'Urssaf à provisionner', value: 1550.25, sign: -1 },
  { label: 'Marge de sécurité', value: 164.06, sign: -1 },
]

function StepRow({ p, index, label, value, sign }: { p: MotionValue<number>; index: number; label: string; value: number; sign: number }) {
  const start = 0.2 + index * 0.1
  const opacity = useTransform(p, [start, start + 0.08], [0, 1], { clamp: true })
  const x = useTransform(p, [start, start + 0.08], [16, 0], { clamp: true })
  return (
    <motion.div style={{ opacity, x }} className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-blue-50">{label}</span>
      <span className="tabular-nums font-medium">{sign < 0 ? '−' : ''}{euros(value, 2)}</span>
    </motion.div>
  )
}

/** Ma rémunération : le calcul du mois se pose ligne à ligne, jusqu'au virement. */
export function PayCard() {
  const { ref, p } = useCardProgress()
  const total = useTransform(p, [0.62, 0.72], [0, 1], { clamp: true })
  const net = useTransform(p, [0.75, 0.85], [0, 1], { clamp: true })
  const glow = useTransform(p, [0.62, 0.75, 0.9], ['0 0 0 0 rgba(52,211,153,0)', '0 0 0 6px rgba(52,211,153,0.35)', '0 0 0 0 rgba(52,211,153,0)'])

  return (
    <div ref={ref} className="rounded-2xl bg-gradient-to-br from-[#2f63e6] to-[#2448c9] p-5 sm:p-6 text-white shadow-2xl shadow-blue-900/25">
      <p className="flex items-center gap-2 text-sm text-blue-100"><Wallet className="h-4 w-4" />Virement vers votre compte perso, octobre 2026</p>
      <p className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight"><Amount p={p} to={3933.95} range={[0.15, 0.75]} decimals={2} /></p>
      <p className="mt-1 text-sm text-blue-100/90">Dont 623,16 € à garder de côté pour l’impôt, prélevé sur le compte perso.</p>

      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4 text-sm sm:text-base">
        <p className="mb-1 text-sm text-blue-100/80">Le mois d’octobre, pas à pas</p>
        {MONTH_STEPS.map((step, index) => (
          <StepRow key={step.label} p={p} index={index} {...step} />
        ))}
        <motion.div style={{ opacity: total, boxShadow: glow }} className="mt-2 flex items-baseline justify-between gap-3 rounded-lg border-t border-white/20 px-2 py-2 font-bold">
          <span>Virement pro vers perso</span>
          <span className="tabular-nums">{euros(3933.95, 2)}</span>
        </motion.div>
        <motion.div style={{ opacity: net }} className="flex items-baseline justify-between gap-3 px-2 py-1">
          <span className="text-blue-50">Impôt (prélevé sur le perso)</span>
          <span className="tabular-nums">−{euros(623.16, 2)}</span>
        </motion.div>
        <motion.div style={{ opacity: net }} className="mt-1 flex items-baseline justify-between gap-3 rounded-lg bg-emerald-400/15 px-2 py-2 font-bold text-emerald-100">
          <span>Net dans votre poche</span>
          <span className="tabular-nums">{euros(3310.78, 2)}</span>
        </motion.div>
      </div>
    </div>
  )
}
