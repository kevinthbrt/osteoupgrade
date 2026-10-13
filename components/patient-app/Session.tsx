'use client'

import { useEffect, useRef, useState } from 'react'
import type { LinkExercise, LinkProgram } from '@/lib/patient-link-codec'
import s from './patient-app.module.css'
import { PainScale, Thumb, doseText } from './ui'
import type { DayLog, Library } from './shared'

type Phase = 'intro' | 'work' | 'rest' | 'pain' | 'end'

interface Props {
  mode: 'guided' | 'quick'
  program: LinkProgram
  library: Library
  todayLog: DayLog
  onChange: (patch: Partial<DayLog>) => void
  onClose: () => void
}

// Un exercice tenu (maintien) se chronomètre, un exercice « lourd lent » se
// rythme 3 s montée et 3 s descente, les autres se comptent à son rythme.
function kind(ex: LinkExercise): 'hold' | 'tempo' | 'reps' {
  if (ex.h && ex.h > 0) return 'hold'
  if (/lourd lent/i.test(ex.n)) return 'tempo'
  return 'reps'
}

export default function Session({ mode, program, library, todayLog, onChange, onClose }: Props) {
  const firstTodo = Math.max(0, program.x.findIndex(e => !todayLog.done[e.e]))
  const [exIndex, setExIndex] = useState(firstTodo)
  const [set, setSet] = useState(1)
  const [phase, setPhase] = useState<Phase>('intro')
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => { dialog.current?.focus() }, [phase, exIndex])

  if (mode === 'quick') return <Quick program={program} todayLog={todayLog} onChange={onChange} onClose={onClose} />

  const ex = program.x[exIndex]
  const sets = Math.max(1, ex.s ?? 1)
  const k = kind(ex)

  const finishSet = () => setPhase(set < sets ? 'rest' : 'pain')
  const nextSet = () => { setSet(n => n + 1); setPhase('work') }
  const nextExercise = () => {
    const done = { ...todayLog.done, [ex.e]: true as const }
    const remaining = program.x.findIndex(e => !done[e.e])
    if (remaining < 0) {
      onChange({ done, complete: true })
      setPhase('end')
    } else {
      onChange({ done })
      setExIndex(remaining); setSet(1); setPhase('intro')
    }
  }

  return (
    <div className={s.session} role="dialog" aria-modal="true" aria-label="Séance guidée">
      <div className={s.sessionInner} ref={dialog} tabIndex={-1}>
        <div className={s.sessionHead}>
          <span className={`${s.small} ${s.muted}`}>Exercice {exIndex + 1} sur {program.x.length}</span>
          <button type="button" onClick={onClose}>Fermer</button>
        </div>
        <div className={s.steps} aria-hidden="true">
          {program.x.map((e, i) => <i key={e.e} className={todayLog.done[e.e] || i === exIndex ? s.dotOn : ''} />)}
        </div>
        <div className={s.sessionBody}>
          {phase === 'intro' && (
            <>
              <Thumb ex={ex} library={library} className={s.big} />
              <h2>{ex.n}</h2>
              {(ex.d ?? library[ex.e]?.description) && <p className={s.muted}>{ex.d ?? library[ex.e]?.description}</p>}
              <div className={s.chips} style={{ justifyContent: 'center' }}><span className={s.chip}>{doseText(ex)}</span></div>
              {ex.o && <p className={`${s.advice} ${s.ok}`}>{ex.o}</p>}
              <button type="button" className={s.btn} onClick={() => setPhase('work')}>Commencer la série 1</button>
            </>
          )}
          {phase === 'work' && k === 'hold' && (
            <>
              <h2>{ex.n}</h2><Dots n={sets} on={set} />
              <p className={s.muted}>Série {set} sur {sets} : tenez la position</p>
              <Countdown key={`h${set}`} seconds={ex.h ?? 30} onEnd={finishSet} />
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={finishSet}>J’ai terminé la série</button>
            </>
          )}
          {phase === 'work' && k === 'tempo' && (
            <>
              <h2>{ex.n}</h2><Dots n={sets} on={set} />
              <p className={s.muted}>Série {set} sur {sets}</p>
              <Tempo key={`t${set}`} reps={parseInt(ex.r ?? '', 10) || 10} onEnd={finishSet} />
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={finishSet}>J’ai terminé la série</button>
            </>
          )}
          {phase === 'work' && k === 'reps' && (
            <>
              <Thumb ex={ex} library={library} className={s.big} />
              <h2>{ex.n}</h2><Dots n={sets} on={set} />
              <p className={s.muted}>Série {set} sur {sets}{ex.r ? ` : ${ex.r} répétitions, à votre rythme` : ''}</p>
              <button type="button" className={s.btn} onClick={finishSet}>J’ai terminé la série</button>
            </>
          )}
          {phase === 'rest' && (
            <>
              <h2>Repos</h2><Dots n={sets} on={set} />
              <p className={s.muted}>Prochaine série : {set + 1} sur {sets}</p>
              <Countdown key={`r${set}`} seconds={ex.p || 30} onEnd={nextSet} />
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={nextSet}>Passer le repos</button>
            </>
          )}
          {phase === 'pain' && (
            <>
              <h2>Pendant cet exercice, la douleur était à combien&nbsp;?</h2>
              <PainScale value={todayLog.pains[ex.e]} label="Douleur pendant l’exercice de 0 à 10" onPick={v => onChange({ pains: { ...todayLog.pains, [ex.e]: v } })} />
              {todayLog.pains[ex.e] != null && (todayLog.pains[ex.e] > 5
                ? <p className={`${s.advice} ${s.warn}`}>Au-dessus de 5 : la prochaine fois, réduisez la charge ou l’amplitude.</p>
                : <p className={`${s.advice} ${s.ok}`}>C’est acceptable, tant que la douleur est revenue à la normale demain matin.</p>)}
              <button type="button" className={s.btn} disabled={todayLog.pains[ex.e] == null} onClick={nextExercise}>
                {program.x.some(e => e.e !== ex.e && !todayLog.done[e.e]) ? 'Exercice suivant' : 'Terminer la séance'}
              </button>
            </>
          )}
          {phase === 'end' && <Done onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}

function Quick({ program, todayLog, onChange, onClose }: Omit<Props, 'mode' | 'library'>) {
  const [pain, setPain] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const save = () => {
    if (pain == null) return
    const done: Record<string, true> = {}, pains: Record<string, number> = { ...todayLog.pains }
    for (const e of program.x) { done[e.e] = true; pains[e.e] = pains[e.e] ?? pain }
    onChange({ done, pains, complete: true })
    setSaved(true)
  }
  return (
    <div className={s.session} role="dialog" aria-modal="true" aria-label="Noter ma séance">
      <div className={s.sessionInner}>
        <div className={s.sessionHead}><span className={`${s.small} ${s.muted}`}>Séance faite sans le guide</span><button type="button" onClick={onClose}>Fermer</button></div>
        <div className={s.sessionBody}>
          {saved ? <Done onClose={onClose} /> : (
            <>
              <h2>Pendant la séance, la douleur maximale était à combien&nbsp;?</h2>
              <PainScale value={pain} onPick={setPain} label="Douleur maximale pendant la séance de 0 à 10" />
              <button type="button" className={s.btn} disabled={pain == null} onClick={save}>Enregistrer la séance</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Done({ onClose }: { onClose: () => void }) {
  return (
    <>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ justifySelf: 'center' }} aria-hidden="true">
        <circle cx="44" cy="44" r="40" fill="var(--good-soft)" />
        <path d="M27 45l12 12 23-25" fill="none" stroke="var(--good)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2>Séance enregistrée</h2>
      <p className={s.muted}>Demain matin, notez la douleur au réveil : c’est elle qui dit si la charge est bonne.</p>
      <button type="button" className={s.btn} onClick={onClose}>Revenir à l’accueil</button>
    </>
  )
}

function Dots({ n, on }: { n: number; on: number }) {
  return <div className={s.dots} aria-label={`Série ${on} sur ${n}`}>{Array.from({ length: n }, (_, k) => <i key={k} className={k < on ? s.dotOn : ''} />)}</div>
}

function Countdown({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const [left, setLeft] = useState(seconds)
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => {
    const started = Date.now()
    const t = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000))
      setLeft(l)
      if (l === 0) { clearInterval(t); end.current() }
    }, 250)
    return () => clearInterval(t)
  }, [seconds])
  return (
    <>
      <div className={`${s.timer} ${s.num}`} aria-live="polite">{left}</div>
      <div className={s.bar}><i style={{ width: `${((seconds - left) / seconds) * 100}%` }} /></div>
    </>
  )
}

function Tempo({ reps, onEnd, up = 3, down = 3 }: { reps: number; onEnd: () => void; up?: number; down?: number }) {
  const [t, setT] = useState(0)
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => {
    const started = Date.now()
    const id = setInterval(() => {
      const el = (Date.now() - started) / 1000
      if (el >= reps * (up + down)) { clearInterval(id); end.current(); return }
      setT(el)
    }, 100)
    return () => clearInterval(id)
  }, [reps, up, down])
  const cycle = up + down, rep = Math.floor(t / cycle), inCycle = t - rep * cycle, rising = inCycle < up
  const fill = rising ? inCycle / up : 1 - (inCycle - up) / down
  return (
    <>
      <div className={s.phase} aria-live="polite">{rising ? 'Montez' : 'Descendez'}</div>
      <div className={s.bar}><i style={{ width: `${fill * 100}%` }} /></div>
      <p className={s.num}><b>{Math.min(rep + 1, reps)}</b> / {reps} répétitions</p>
    </>
  )
}
