'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

/*
 * Animations pilotées par le défilement de la page d'accueil.
 *
 * Le défilement fait avancer les animations, comme une vidéo dont on tient la
 * molette : en remontant, tout se rembobine. Rien ne bouge pour les visiteurs
 * qui ont demandé à réduire les animations, et la scène épinglée n'est
 * utilisée que sur grand écran (au doigt, sur téléphone, elle gêne plus
 * qu'elle n'aide) : la page affiche alors ses blocs habituels.
 */

/** Grand écran et animations autorisées : la scène épinglée peut s'afficher. */
export function useScrollStoryEnabled(): boolean {
  const reduced = useReducedMotion()
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (min-height: 640px)')
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return wide && !reduced
}

/** Fine barre de progression en haut de page. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-sky-400 via-blue-600 to-violet-600"
    />
  )
}

/**
 * Aperçu du hero : l'écran part incliné, en perspective, et se redresse
 * pendant que le titre s'efface au défilement.
 */
export function HeroShowcase({ intro, children }: { intro: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.3], [16, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1])
  const frameY = useTransform(scrollYProgress, [0, 0.3], [0, -40])
  const introOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.22], [0, -60])

  return (
    <div ref={ref} className="w-full flex flex-col items-center gap-6">
      <motion.div style={reduced ? undefined : { opacity: introOpacity, y: introY }} className="w-full flex flex-col items-center gap-6">
        {intro}
      </motion.div>
      <div className="w-full flex justify-center" style={{ perspective: 1400 }}>
        <motion.div
          style={reduced ? undefined : { rotateX, scale, y: frameY, transformOrigin: 'center top' }}
          className="w-full max-w-5xl mt-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

/** Vidéo d'une étape : ne tourne que lorsque l'étape est à l'écran. */
function StepVideo({ src, poster, label, active, className }: { src: string; poster: string; label: string; active: boolean; className: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = true
    if (active) el.play().catch(() => {})
    else el.pause()
  }, [active])
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} className={className} />
}

export interface StoryStep {
  key: string
  label: string
  tone: 'blue' | 'red' | 'violet'
  title: string
  text: string
  points: string[]
  note?: string
}

const TONES = {
  blue: { text: 'text-blue-600', dot: 'bg-blue-600', check: 'bg-blue-100 text-blue-700' },
  red: { text: 'text-red-700', dot: 'bg-red-600', check: 'bg-red-100 text-red-700' },
  violet: { text: 'text-violet-700', dot: 'bg-violet-600', check: 'bg-violet-100 text-violet-700' },
} as const

/** Opacité d'une étape : apparaît à son début, s'efface à sa fin (sauf première et dernière). */
function useStepOpacity(progress: MotionValue<number>, index: number, count: number) {
  const start = index / count
  const end = (index + 1) / count
  const fade = 0.05
  const input = [start - fade, start + fade, end - fade, end + fade]
  const output = [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0]
  return useTransform(progress, input, output)
}

/**
 * Texte d'une étape : l'ancien sort complètement avant que le suivant
 * n'entre, pour ne jamais superposer deux paragraphes.
 */
function useTextMotion(progress: MotionValue<number>, index: number, count: number) {
  const start = index / count
  const end = (index + 1) / count
  const input = [start, start + 0.07, end - 0.07, end]
  const first = index === 0
  const last = index === count - 1
  const opacity = useTransform(progress, input, [first ? 1 : 0, 1, 1, last ? 1 : 0])
  const y = useTransform(progress, input, [first ? 0 : 36, 0, 0, last ? 0 : -36])
  return { opacity, y }
}

function StepText({ step, index, count, progress }: { step: StoryStep; index: number; count: number; progress: MotionValue<number> }) {
  const { opacity, y } = useTextMotion(progress, index, count)
  const tone = TONES[step.tone]
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center gap-4">
      <span className={`text-sm font-bold ${tone.text}`}>{step.label}</span>
      <h3 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">{step.title}</h3>
      <p className="text-lg leading-relaxed text-slate-600">{step.text}</p>
      <ul className="flex flex-col gap-3 text-slate-700">
        {step.points.map((point) => (
          <li key={point} className="flex gap-2.5">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone.check}`}>✓</span>
            {point}
          </li>
        ))}
      </ul>
      {step.note && <p className="text-sm text-slate-500">{step.note}</p>}
    </motion.div>
  )
}

function Layer({ index, count, progress, children, className = '' }: { index: number; count: number; progress: MotionValue<number>; children: React.ReactNode; className?: string }) {
  const opacity = useStepOpacity(progress, index, count)
  const scale = useTransform(progress, [index / count - 0.05, index / count + 0.05], [index === 0 ? 1 : 0.96, 1])
  return (
    <motion.div style={{ opacity, scale }} className={`absolute inset-0 ${className}`}>
      {children}
    </motion.div>
  )
}

/** Signes d'alerte qui s'allument un à un pendant l'étape « drapeaux rouges ». */
function FlagChip({ label, order, total, progress }: { label: string; order: number; total: number; progress: MotionValue<number> }) {
  const start = 1 / 3 + 0.03 + (order / total) * 0.2
  const opacity = useTransform(progress, [start, start + 0.03], [0, 1])
  const y = useTransform(progress, [start, start + 0.03], [10, 0])
  return (
    <motion.span style={{ opacity, y }} className="text-sm font-medium text-red-800 bg-white border border-red-300 rounded-full px-3 py-1.5 shadow-sm">
      {label}
    </motion.span>
  )
}

/**
 * La séance racontée en une scène : l'écran reste au centre pendant que le
 * texte défile, et se transforme à chaque étape.
 */
export function ClinicalStory({ steps, redFlags }: { steps: StoryStep[]; redFlags: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: 0.4 })
  const count = steps.length
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(count - 1, Math.max(0, Math.floor(value * count))))
  })

  const background = useTransform(progress, [0, 0.33, 0.4, 0.66, 0.73, 1], ['#ffffff', '#ffffff', '#fff5f5', '#fff5f5', '#f7f5ff', '#f7f5ff'])
  const frameColor = useTransform(progress, [0, 0.33, 0.4, 0.66, 0.73, 1], ['#e2e8f0', '#e2e8f0', '#fca5a5', '#fca5a5', '#c4b5fd', '#c4b5fd'])
  const glow = useTransform(progress, [0, 0.33, 0.4, 0.66, 0.73, 1], [
    '0 30px 80px -20px rgba(37,99,235,.25)',
    '0 30px 80px -20px rgba(37,99,235,.25)',
    '0 30px 80px -20px rgba(220,38,38,.35)',
    '0 30px 80px -20px rgba(220,38,38,.35)',
    '0 30px 80px -20px rgba(124,58,237,.3)',
    '0 30px 80px -20px rgba(124,58,237,.3)',
  ])
  const railScale = useTransform(progress, [0, 1], [0, 1])

  return (
    <motion.div ref={ref} style={{ background, height: `${count * 100 + 40}vh` }} className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="sticky top-0 h-screen flex items-center px-8">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-14 items-center pt-16">
          {/* Étapes et texte */}
          <div className="flex gap-8">
            <div className="relative flex flex-col justify-between py-1" aria-hidden="true">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
              <motion.div style={{ scaleY: railScale }} className="absolute left-[7px] top-2 bottom-2 w-0.5 origin-top bg-gradient-to-b from-blue-600 via-red-500 to-violet-600" />
              {steps.map((step, index) => (
                <span
                  key={step.key}
                  className={`relative h-4 w-4 rounded-full border-2 border-white transition-all duration-300 ${index <= active ? TONES[step.tone].dot : 'bg-slate-300'} ${index === active ? 'scale-125' : ''}`}
                />
              ))}
            </div>
            <div className="relative flex-1 min-h-[440px]">
              {steps.map((step, index) => (
                <StepText key={step.key} step={step} index={index} count={count} progress={progress} />
              ))}
            </div>
          </div>

          {/* L'écran, qui se transforme */}
          <motion.div
            style={{ borderColor: frameColor, boxShadow: glow }}
            className="relative w-full aspect-[16/10] rounded-2xl border-2 bg-white overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 h-8 px-4 bg-slate-100/95 border-b border-slate-200" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs font-medium text-slate-500">{steps[active]?.label}</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 top-8">
              <Layer index={0} count={count} progress={progress} className="bg-[#0B1220]">
                <StepVideo
                  src="/landing/v2/dictee-ia.mp4"
                  poster="/landing/v2/poster-dictee.webp"
                  label="Démonstration : dictée de l’anamnèse, structuration, drapeaux rouges et hypothèses cliniques"
                  active={active === 0}
                  className="h-full w-full object-cover object-top"
                />
              </Layer>
              <Layer index={1} count={count} progress={progress} className="bg-red-50 flex flex-col items-center justify-center gap-6 p-8">
                <Image
                  src="/landing/v2/drapeaux-rouges.webp"
                  alt="Carte Drapeaux rouges : douleur nocturne, âge supérieur à 55 ans, perte de poids à demander"
                  width={1132}
                  height={256}
                  className="w-full h-auto rounded-xl shadow-xl shadow-red-900/15"
                />
                <div className="flex flex-wrap justify-center gap-2">
                  {redFlags.map((flag, order) => (
                    <FlagChip key={flag} label={flag} order={order} total={redFlags.length} progress={progress} />
                  ))}
                </div>
              </Layer>
              <Layer index={2} count={count} progress={progress} className="bg-slate-50 flex items-center justify-center p-4">
                <StepVideo
                  src="/landing/v2/hypotheses.mp4"
                  poster="/landing/v2/poster-hypotheses.webp"
                  label="Démonstration : une réponse et des tests cochés font évoluer les pourcentages des hypothèses cliniques"
                  active={active === 2}
                  className="h-full w-auto rounded-xl border border-slate-200 shadow-lg bg-white"
                />
              </Layer>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

/** Apparition en cascade, au rythme du défilement (cartes, listes). */
export function ScrollCascade({ children, index = 0, className = '' }: { children: React.ReactNode; index?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.7'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [60 + index * 24, 0])
  return (
    <motion.div ref={ref} style={reduced ? undefined : { opacity, y }} className={className}>
      {children}
    </motion.div>
  )
}
