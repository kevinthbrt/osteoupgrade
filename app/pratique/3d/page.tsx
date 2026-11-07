'use client'

// Prototype « vidéo augmentée » : vidéo Vimeo découpée en étapes et
// synchronisée avec une vue 3D du segment traité. Réservé aux admins
// tant que le format n’est pas validé.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type VimeoPlayer from '@vimeo/player'
import AuthLayout from '@/components/AuthLayout'
import { fetchProfilePayload } from '@/lib/profile-client'
import { ChevronLeft, Clipboard, Crosshair, Loader2, Lock, Play, RotateCcw, Zap } from 'lucide-react'
import { lumbarRollL5S1, type Pose, type TechniqueStep } from './technique'
import type { GapReadout } from './SpineScene'

const SpineScene = dynamic(() => import('./SpineScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
})

const technique = lumbarRollL5S1
const STORAGE_KEY = `osteoupgrade:3d-timings:${technique.slug}`

const formatTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const readStoredTimings = (): Record<string, number> | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : null
  } catch {
    return null
  }
}

const writeStoredTimings = (value: Record<string, number>) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // stockage indisponible (navigation privée) : le calage reste en mémoire
  }
}

export default function Pratique3DPage() {
  const router = useRouter()
  const [access, setAccess] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    fetchProfilePayload()
      .then((payload) => {
        if (!payload?.user) { router.push('/'); return }
        setAccess(payload.profile?.role === 'admin' ? 'allowed' : 'denied')
      })
      .catch(() => setAccess('denied'))
  }, [router])

  if (access === 'loading') {
    return (
      <AuthLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </AuthLayout>
    )
  }

  if (access === 'denied') {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-900">Prototype en cours de test</p>
          <p className="mt-1 text-sm text-slate-600">Cette page n’est pas encore ouverte aux membres.</p>
          <Link href="/pratique" className="mt-4 inline-block text-sm font-medium text-violet-600 hover:underline">
            Retour à la pratique
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AugmentedVideo />
    </AuthLayout>
  )
}

function AugmentedVideo() {
  const playerFrame = useRef<HTMLIFrameElement>(null)
  const player = useRef<VimeoPlayer | null>(null)
  const [time, setTime] = useState(0)
  const [mode, setMode] = useState<'sync' | 'explore'>('sync')
  const [patientView, setPatientView] = useState(true)
  const [slowMotion, setSlowMotion] = useState(false)
  const [thrustKey, setThrustKey] = useState(0)
  const [explorePose, setExplorePose] = useState<Pose>({ trunkRotation: 0, pelvisRotation: 0, flexion: 0 })
  const [timings, setTimings] = useState<Record<string, number>>(() =>
    Object.fromEntries(technique.steps.map((s) => [s.id, s.start]))
  )
  const [copied, setCopied] = useState(false)
  const readout = useRef<GapReadout>({ upper: 0, lower: 0, relative: 0 })

  useEffect(() => {
    const stored = readStoredTimings()
    if (stored) setTimings((t) => ({ ...t, ...stored }))
  }, [])

  const steps: TechniqueStep[] = useMemo(
    () =>
      technique.steps
        .map((s) => ({ ...s, start: timings[s.id] ?? s.start }))
        .sort((a, b) => a.start - b.start),
    [timings]
  )

  const currentIndex = useMemo(() => {
    let idx = 0
    steps.forEach((s, i) => { if (time >= s.start) idx = i })
    return idx
  }, [steps, time])
  const current = steps[currentIndex]

  // Lecteur Vimeo piloté par son API (chargé côté client uniquement).
  // On lui passe une iframe existante : avec un simple identifiant, la
  // bibliothèque interroge l’oEmbed de vimeo.com, bloqué par la CSP.
  useEffect(() => {
    let cancelled = false
    let instance: VimeoPlayer | null = null
    import('@vimeo/player').then(({ default: Player }) => {
      if (cancelled || !playerFrame.current) return
      instance = new Player(playerFrame.current)
      instance.on('timeupdate', (data: { seconds: number }) => setTime(data.seconds))
      instance.on('seeked', (data: { seconds: number }) => setTime(data.seconds))
      player.current = instance
    })
    return () => {
      cancelled = true
      instance?.destroy().catch(() => undefined)
      player.current = null
    }
  }, [])

  // En mode synchronisé, l’arrivée sur l’étape d’impulsion la déclenche.
  const lastStepId = useRef<string | null>(null)
  useEffect(() => {
    if (mode !== 'sync') return
    if (current.id !== lastStepId.current) {
      lastStepId.current = current.id
      if (current.thrust) {
        setSlowMotion(false)
        setThrustKey((k) => k + 1)
      }
    }
  }, [current, mode])

  const goToStep = useCallback((step: TechniqueStep) => {
    setMode('sync')
    setTime(step.start)
    lastStepId.current = null
    const p = player.current
    if (!p) return
    p.setCurrentTime(step.start).then(() => p.play()).catch(() => undefined)
  }, [])

  const replayThrust = (slow: boolean) => {
    setSlowMotion(slow)
    setThrustKey((k) => k + 1)
  }

  const calibrateCurrentStep = (stepId: string) => {
    const p = player.current
    if (!p) return
    p.getCurrentTime().then((seconds) => {
      const rounded = Math.round(seconds * 10) / 10
      setTimings((t) => {
        const next = { ...t, [stepId]: rounded }
        writeStoredTimings(next)
        return next
      })
    })
  }

  const resetTimings = () => {
    const defaults = Object.fromEntries(technique.steps.map((s) => [s.id, s.start]))
    setTimings(defaults)
    writeStoredTimings(defaults)
  }

  const copyTimings = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(timings, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const pose = mode === 'sync' ? current.pose : explorePose
  const arrows = mode === 'sync'
    ? current.arrows
    : { trunk: explorePose.trunkRotation > 0.5, pelvis: explorePose.pelvisRotation > 0.5 }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link href="/pratique" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600">
          <ChevronLeft className="h-4 w-4" /> Pratique
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{technique.title}</h1>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">Prototype 3D</span>
        </div>
        <p className="mt-1 text-slate-600">{technique.subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
          <iframe
            ref={playerFrame}
            src={`https://player.vimeo.com/video/${technique.vimeoId}?api=1&dnt=1`}
            className="aspect-video w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={technique.title}
          />
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 shadow-sm sm:aspect-video">
          <SpineScene
            pose={pose}
            thrustKey={thrustKey}
            thrustAmplitude={technique.thrustAmplitude}
            slowMotion={slowMotion}
            patientView={patientView}
            arrows={arrows}
            readout={readout}
          />
          <GapMeter readout={readout} />
          <div className="absolute right-3 top-3 flex gap-1.5">
            <button
              onClick={() => setPatientView((v) => !v)}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
            >
              {patientView ? 'Vue anatomique' : 'Vue patient couché'}
            </button>
          </div>
          <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-slate-400">
            Schéma, amplitudes exagérées · glisser pour tourner
          </p>
        </div>
      </div>

      {/* Frise des étapes */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const active = mode === 'sync' && i === currentIndex
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step)}
              className={`flex min-w-[9.5rem] flex-1 flex-col rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-violet-500 bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-violet-300'
              }`}
            >
              <span className="text-[11px] font-medium text-slate-500">
                {i + 1}. {formatTime(step.start)}
              </span>
              <span className={`text-sm font-semibold ${active ? 'text-violet-700' : 'text-slate-800'}`}>
                {step.thrust && <Zap className="mr-1 inline h-3.5 w-3.5 text-amber-500" />}
                {step.title}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Explication de l’étape */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          {mode === 'sync' ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900">{current.title}</h2>
              <div className="mt-3 rounded-lg bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Dans l’articulation</p>
                <p className="mt-1 text-sm text-slate-700">{current.inside}</p>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Repères praticien</p>
              <ul className="mt-2 space-y-1.5">
                {current.cues.map((cue) => (
                  <li key={cue} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    {cue}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ExplorePanel pose={explorePose} onChange={setExplorePose} />
          )}
        </div>

        {/* Commandes */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
              <button
                onClick={() => setMode('sync')}
                className={`rounded-md py-1.5 ${mode === 'sync' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'}`}
              >
                Suivre la vidéo
              </button>
              <button
                onClick={() => {
                  setExplorePose(current.pose)
                  setMode('explore')
                  player.current?.pause().catch(() => undefined)
                }}
                className={`rounded-md py-1.5 ${mode === 'explore' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'}`}
              >
                Explorer
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => replayThrust(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white hover:from-violet-600 hover:to-violet-700"
              >
                <Play className="h-4 w-4" /> Impulsion au ralenti
              </button>
              <button
                onClick={() => replayThrust(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Zap className="h-4 w-4 text-amber-500" /> Impulsion à vitesse réelle
              </button>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Rotation du tronc (verrouillage du haut)</p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Rotation du bassin (verrouillage du bas, impulsion)</p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-300" /> L5 et S1, le segment traité</p>
            </div>
          </div>

          {/* Calage des étapes sur la vidéo */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Crosshair className="h-4 w-4" /> Calage (admin)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Mets la vidéo au début d’une étape, puis clique sur son nom. Le calage est gardé dans ce navigateur.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {technique.steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => calibrateCurrentStep(s.id)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:border-violet-400"
                >
                  {s.title} · {formatTime(timings[s.id] ?? s.start)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={copyTimings} className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
                <Clipboard className="h-3.5 w-3.5" /> {copied ? 'Copié' : 'Copier les temps'}
              </button>
              <button onClick={resetTimings} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
                <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExplorePanel({ pose, onChange }: { pose: Pose; onChange: (p: Pose) => void }) {
  const sliders: { key: keyof Pose; label: string; hint: string; max: number }[] = [
    { key: 'trunkRotation', label: 'Rotation du tronc', hint: 'Verrouillage du haut, épaule vers l’arrière', max: 10 },
    { key: 'pelvisRotation', label: 'Rotation du bassin', hint: 'Verrouillage du bas, bassin vers l’avant', max: 10 },
    { key: 'flexion', label: 'Flexion lombaire', hint: 'Flexion de hanche transmise au rachis', max: 10 },
  ]
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900">Explorer les paramètres</h2>
      <p className="mt-1 text-sm text-slate-600">
        Fais varier chaque composante et regarde à partir de quand la facette du dessus commence à bâiller.
      </p>
      <div className="mt-4 space-y-4">
        {sliders.map((s) => (
          <label key={s.key} className="block">
            <span className="flex justify-between text-sm font-medium text-slate-800">
              {s.label}
              <span className="tabular-nums text-slate-500">{pose[s.key].toFixed(0)}°</span>
            </span>
            <input
              type="range"
              min={0}
              max={s.max}
              step={0.5}
              value={pose[s.key]}
              onChange={(e) => onChange({ ...pose, [s.key]: Number(e.target.value) })}
              className="mt-1 w-full accent-violet-600"
            />
            <span className="text-xs text-slate-500">{s.hint}</span>
          </label>
        ))}
      </div>
    </>
  )
}

function GapMeter({ readout }: { readout: React.MutableRefObject<GapReadout> }) {
  const [value, setValue] = useState<GapReadout>(readout.current)
  useEffect(() => {
    const id = window.setInterval(() => setValue({ ...readout.current }), 80)
    return () => window.clearInterval(id)
  }, [readout])
  return (
    <div className="pointer-events-none absolute left-2 top-2 w-36 space-y-1.5 rounded-lg bg-slate-900/70 p-2 text-[10px] sm:left-3 sm:top-3 sm:w-44 sm:space-y-2 sm:p-2.5 sm:text-[11px] text-slate-200 backdrop-blur">
      <div>
        <div className="flex justify-between"><span>Bâillement (dessus)</span><span>{Math.round(value.upper * 100)} %</span></div>
        <div className="mt-1 h-1.5 rounded bg-slate-700">
          <div className="h-1.5 rounded bg-emerald-400" style={{ width: `${value.upper * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between"><span>Appui (dessous)</span><span>{Math.round(value.lower * 100)} %</span></div>
        <div className="mt-1 h-1.5 rounded bg-slate-700">
          <div className="h-1.5 rounded bg-rose-400" style={{ width: `${value.lower * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
