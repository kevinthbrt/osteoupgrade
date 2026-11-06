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
  const screenRatio = useTransform(progress, [0, 0.62, 0.72, 1], [1.6, 1.6, 1.05, 1.05])

  return (
    <motion.div ref={ref} style={{ background, height: `${count * 100 + 40}vh` }} className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="sticky top-0 h-screen flex items-center px-8">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-12 items-center pt-16">
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
            className="relative w-full flex flex-col rounded-2xl border-2 bg-white overflow-hidden"
          >
            <div className="flex-none flex items-center gap-2 h-8 px-4 bg-slate-100 border-b border-slate-200" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs font-medium text-slate-500">{steps[active]?.label}</span>
            </div>
            {/* L'écran s'agrandit en hauteur pour les hypothèses, plus lisibles ainsi */}
            <motion.div style={{ aspectRatio: screenRatio, maxHeight: 'calc(100vh - 200px)' }} className="relative w-full">
              <Layer index={0} count={count} progress={progress} className="bg-[#0B1220]">
                <StepVideo
                  src="/landing/v2/dictee-ia.mp4"
                  poster="/landing/v2/poster-dictee.webp"
                  label="Démonstration : dictée de l’anamnèse, structuration, drapeaux rouges et hypothèses cliniques"
                  active={active === 0}
                  className="h-full w-full object-contain"
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
              <Layer index={2} count={count} progress={progress} className="bg-slate-50 flex items-center justify-center p-2">
                <StepVideo
                  src="/landing/v2/hypotheses.mp4"
                  poster="/landing/v2/poster-hypotheses.webp"
                  label="Démonstration : une réponse et des tests cochés font évoluer les pourcentages des hypothèses cliniques"
                  active={active === 2}
                  className="h-full w-auto max-w-full object-contain rounded-xl border border-slate-200 shadow-lg bg-white"
                />
              </Layer>
            </motion.div>
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

/**
 * Léger effet de profondeur : l'élément glisse un peu moins vite que la page,
 * et peut se redresser en arrivant (rotation de départ).
 */
export function Parallax({ children, className = '', distance = 50, rotate = 0 }: { children: React.ReactNode; className?: string; distance?: number; rotate?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const r = useTransform(scrollYProgress, [0, 0.45], [rotate, rotate === 0 ? 0 : rotate / 4])
  return (
    <motion.div ref={ref} style={reduced ? undefined : { y, rotate: r }} className={className}>
      {children}
    </motion.div>
  )
}

/** Chiffre qui défile jusqu'à sa valeur quand il arrive à l'écran. */
export function CountUp({ value, className = '' }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const target = parseInt(value, 10)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced || Number.isNaN(target)) return
    setShown('0')
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const startAt = performance.now()
      const duration = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - startAt) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setShown(String(Math.round(target * eased)))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [reduced, target])
  return <span ref={ref} className={`tabular-nums ${className}`}>{shown}</span>
}

export interface PhoneStep {
  img: string
  alt: string
  title: string
  text: string
}

function PhoneText({ step, index, count, progress }: { step: PhoneStep; index: number; count: number; progress: MotionValue<number> }) {
  const { opacity, y } = useTextMotion(progress, index, count)
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-lg font-extrabold text-[#0F2A26]">{index + 1}</span>
      <h3 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">{step.title}</h3>
      <p className="text-lg leading-relaxed text-emerald-50/80">{step.text}</p>
    </motion.div>
  )
}

function PhoneScreen({ step, index, count, progress }: { step: PhoneStep; index: number; count: number; progress: MotionValue<number> }) {
  const opacity = useStepOpacity(progress, index, count)
  const y = useTransform(progress, [index / count - 0.06, index / count + 0.04], [index === 0 ? 0 : 60, 0])
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0">
      <Image src={step.img} alt={step.alt} width={780} height={1328} className="h-full w-full object-cover object-top" />
    </motion.div>
  )
}

/**
 * L'appli patient racontée en une scène : le téléphone reste au centre,
 * l'écran change à chaque étape et le téléphone pivote légèrement.
 */
export function PhoneStory({ steps }: { steps: PhoneStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: 0.4 })
  const count = steps.length
  const rotate = useTransform(progress, [0, 0.5, 1], [-6, 0, 6])
  const rotateY = useTransform(progress, [0, 0.5, 1], [14, 0, -14])
  const halo = useTransform(progress, [0, 1], [0.35, 0.6])
  const lockY = useTransform(progress, [0.02, 0.12], ['0%', '-100%'])
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(count - 1, Math.max(0, Math.floor(value * count))))
  })

  return (
    <div ref={ref} style={{ height: `${count * 100 + 30}vh` }} className="relative">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-2 gap-16 items-center pt-16">
          <div className="flex gap-8">
            <div className="flex flex-col justify-center gap-3" aria-hidden="true">
              {steps.map((step, index) => (
                <span key={step.title} className={`h-10 w-1.5 rounded-full transition-colors duration-300 ${index <= active ? 'bg-emerald-400' : 'bg-white/15'}`} />
              ))}
            </div>
            <div className="relative flex-1 min-h-[320px]">
              {steps.map((step, index) => (
                <PhoneText key={step.title} step={step} index={index} count={count} progress={progress} />
              ))}
            </div>
          </div>
          <div className="relative flex justify-center" style={{ perspective: 1200 }}>
            <motion.div style={{ opacity: halo }} className="absolute inset-0 m-auto h-[70%] w-[70%] rounded-full bg-emerald-400/40 blur-3xl" aria-hidden="true" />
            <motion.div
              style={{ rotate, rotateY }}
              className="relative h-[min(72vh,620px)] aspect-[780/1360] rounded-[44px] bg-[#0b1513] p-3 shadow-2xl shadow-black/60 ring-1 ring-white/10"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-white">
                {steps.map((step, index) => (
                  <PhoneScreen key={step.img} step={step} index={index} count={count} progress={progress} />
                ))}
                {/* Le téléphone se déverrouille au début de la scène */}
                <motion.div style={{ y: lockY }} className="absolute inset-0 z-10" aria-hidden="true">
                  <LockScreen />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Le courrier sort de son enveloppe au fil du défilement : le rabat s'ouvre,
 * la lettre monte. Fonctionne aussi sur téléphone (pas d'épinglage).
 */
export function EnvelopeReveal({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  const flap = useTransform(p, [0.08, 0.38], [0, 180])
  const flapZ = useTransform(p, (v) => (v < 0.25 ? 4 : 1))
  const letterY = useTransform(p, [0.38, 0.92], ['62%', '0%'])
  const letterScale = useTransform(p, [0.38, 0.92], [0.86, 1])
  const envelopeY = useTransform(p, [0.6, 1], ['0%', '14%'])
  const envelopeOpacity = useTransform(p, [0.8, 1], [1, 0.35])
  const labelOpacity = useTransform(p, [0.45, 0.62], [1, 0])

  if (reduced) {
    return <Image src={src} alt={alt} width={width} height={height} className="w-full max-w-xl h-auto bg-white rounded-md shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5" />
  }

  return (
    // Découpe en bas seulement : la lettre reste cachée sous l'enveloppe, le rabat peut dépasser en haut
    <div ref={ref} className="relative w-full max-w-xl" style={{ perspective: 1200, clipPath: 'inset(-60% -12% 0 -12%)' }}>
      {/* La lettre, dans le flux : elle donne sa hauteur à la scène */}
      <div className="relative" style={{ paddingBottom: '22%' }}>
        <motion.div style={{ y: letterY, scale: letterScale }} className="relative z-[2] origin-bottom">
          <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto bg-white rounded-md shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5" />
        </motion.div>
      </div>
      {/* L'enveloppe : dos, poche avant, rabat */}
      <motion.div style={{ y: envelopeY, opacity: envelopeOpacity }} className="pointer-events-none absolute inset-x-[-4%] bottom-0 h-[46%]" aria-hidden="true">
        <div className="absolute inset-0 z-[1] rounded-xl bg-[#bcd0f0] ring-1 ring-[#9fb8e3] shadow-2xl shadow-blue-900/30" />
        <svg className="absolute inset-0 z-[3] h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <path d="M0 6 L50 36 L100 6 L100 60 L0 60 Z" fill="#dbe7fb" />
          <path d="M0 60 L50 30 L100 60" fill="none" stroke="#b3c8ec" strokeWidth="0.6" />
          <path d="M0 6 L50 36 L100 6" fill="none" stroke="#b3c8ec" strokeWidth="0.5" />
        </svg>
        <motion.svg style={{ rotateX: flap, zIndex: flapZ, transformOrigin: 'top' }} className="absolute inset-x-0 top-0 h-[62%] w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0 0 L100 0 L50 40 Z" fill="#a9c1ea" stroke="#94b0e0" strokeWidth="0.5" />
        </motion.svg>
        <motion.span style={{ opacity: labelOpacity }} className="absolute bottom-[14%] left-1/2 z-[4] -translate-x-1/2 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">À l’attention du Dr Rousseau, médecin traitant</motion.span>
      </motion.div>
    </div>
  )
}

/** Écran verrouillé du téléphone du patient, avec la notification de sa séance. */
function LockScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-[#0f3d36] via-[#145c50] to-[#0b2a26] px-4 pt-10 text-white">
      <span className="text-xs font-medium text-emerald-100/80">Vendredi 6 novembre</span>
      <span className="mt-1 text-6xl font-semibold tracking-tight tabular-nums">8:02</span>
      <div className="mt-8 w-full rounded-2xl bg-white/15 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-50/90">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400 text-[10px] font-extrabold text-[#0F2A26]">✓</span>
          Mes exercices · maintenant
        </div>
        <p className="mt-1.5 text-sm font-semibold">Votre séance du jour est prête</p>
        <p className="text-xs text-emerald-50/80">3 exercices, 12 minutes, conseillés par votre ostéopathe</p>
      </div>
      <div className="mt-auto mb-3 flex flex-col items-center gap-2">
        <span className="text-[11px] text-emerald-50/70">Glissez vers le haut pour ouvrir</span>
        <span className="h-1 w-24 rounded-full bg-white/80" />
      </div>
    </div>
  )
}

/**
 * Téléphone qui se déverrouille quand il arrive à l'écran (version sans
 * épinglage, pour le téléphone et les petits écrans).
 */
export function PhoneUnlock({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'center 0.5'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  const lockY = useTransform(p, [0.45, 0.9], ['0%', '-100%'])
  return (
    <div ref={ref} className="relative w-[230px] lg:w-[260px] self-start overflow-hidden rounded-t-[28px] ring-8 ring-[#1F3D38] shadow-2xl shadow-black/50">
      <Image src={src} alt={alt} width={780} height={1328} className="w-full h-auto" />
      {!reduced && (
        <motion.div style={{ y: lockY }} className="absolute inset-0" aria-hidden="true">
          <LockScreen />
        </motion.div>
      )}
    </div>
  )
}

/** Petites étiquettes qui s'allument une à une à l'arrivée à l'écran. */
export function StaggerChips({ items, className, chipClassName }: { items: string[]; className?: string; chipClassName: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={className}>
      {items.map((item, index) => (
        <motion.span
          key={item}
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ delay: index * 0.09, duration: 0.35, ease: 'easeOut' }}
          className={chipClassName}
        >
          {item}
        </motion.span>
      ))}
    </div>
  )
}
