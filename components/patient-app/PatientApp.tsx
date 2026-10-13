'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  activePhase, decodeProgram, encodeFullReport, encodeShortCode, phasesOf, summarizeWeeks,
  type FullReport, type LinkExercise, type LinkProgram,
} from '@/lib/patient-link-codec'
import s from './patient-app.module.css'
import Session from './Session'
import UpdateProgram from './UpdateProgram'
import { decodeTransfer, encodeTransfer, isIos, isStandalone, type Transfer } from './transfer'
import { PainScale, Thumb, doseText } from './ui'
import { addDays, dayOffset, isoDay, frDate, type DayLog, type Library, type LibraryItem } from './shared'

// L'appli ne connaît ni le patient ni son praticien côté serveur : le
// programme arrive dans le fragment de l'URL, et tout ce que le patient saisit
// reste dans le stockage local de son navigateur.
const K_PROGRAMS = 'ofp:programs'
const K_CURRENT = 'ofp:current'
const K_LIBRARY = 'ofp:library'
const kLog = (id: string) => `ofp:log:${id}`

const DEFAULT_VIGILANCE = `• Douleur qui dépasse 5 sur 10 pendant l’exercice
• Douleur qui n’est pas revenue à son niveau habituel le lendemain matin
• Vertiges, nausées ou malaise
• Fourmillements, engourdissements ou faiblesse dans un membre`

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* stockage indisponible */ }
}

type Tab = 'today' | 'program' | 'track' | 'report'
type Programs = Record<string, { program: LinkProgram; savedAt: string; updated?: boolean }>
/** Programme vu à une date : l'étape en cours remplace les exercices à plat. */
export type ViewProgram = LinkProgram & { x: LinkExercise[] }

/**
 * Range un programme reçu (lien ouvert, lien collé ou QR code scanné). Un
 * lien plus ancien que la version déjà présente ne l'écrase pas.
 */
export function receiveProgram(incoming: LinkProgram): { programs: Programs; message: string } {
  const stored = read<Programs>(K_PROGRAMS, {})
  const existing = stored[incoming.id]
  let message: string
  if (existing?.program.u && incoming.u && incoming.u < existing.program.u) {
    message = 'Ce lien contient une version plus ancienne de votre programme : la plus récente est conservée.'
  } else {
    const changed = !!existing && JSON.stringify(existing.program) !== JSON.stringify(incoming)
    stored[incoming.id] = { program: incoming, savedAt: new Date().toISOString(), updated: changed || existing?.updated }
    message = existing ? (changed ? 'Programme mis à jour.' : 'Votre programme est déjà à jour.') : 'Programme ajouté.'
  }
  write(K_PROGRAMS, stored)
  write(K_CURRENT, incoming.id)
  return { programs: stored, message }
}

/**
 * Reprend le programme et le suivi copiés depuis Safari. Un jour déjà saisi
 * dans l'appli n'est jamais écrasé.
 */
export function importTransfer(data: Transfer): { programs: Programs; current: string | null; message: string } {
  const stored = read<Programs>(K_PROGRAMS, {})
  for (const [id, entry] of Object.entries(data.programs)) {
    const mine = stored[id]
    if (!mine || (entry.program.u && (!mine.program.u || entry.program.u > mine.program.u))) stored[id] = entry
    const log = read<Record<string, DayLog>>(kLog(id), {})
    write(kLog(id), { ...(data.logs[id] ?? {}), ...log })
  }
  write(K_PROGRAMS, stored)
  const current = data.current && stored[data.current] ? data.current : Object.keys(stored)[0] ?? null
  write(K_CURRENT, current)
  const n = Object.keys(data.programs).length
  return { programs: stored, current, message: n ? 'Votre programme et votre suivi sont dans l’appli.' : 'Ce lien ne contenait aucun programme.' }
}

/** Tout ce que l'appli garde sur ce téléphone, pour le transfert. */
function collectTransfer(): Transfer {
  const programs = read<Programs>(K_PROGRAMS, {})
  const logs: Transfer['logs'] = {}
  for (const id of Object.keys(programs)) logs[id] = read(kLog(id), {})
  return { programs, logs, current: read<string | null>(K_CURRENT, null) }
}

export default function PatientApp() {
  const [ready, setReady] = useState(false)
  const [programs, setPrograms] = useState<Programs>({})
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [log, setLog] = useState<Record<string, DayLog>>({})
  const [library, setLibrary] = useState<Library>({})
  const [tab, setTab] = useState<Tab>('today')
  const [session, setSession] = useState<null | 'guided' | 'quick'>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const today = isoDay(new Date())

  // Programme reçu dans le lien, puis retiré de la barre d'adresse.
  useEffect(() => {
    let stored = read<Programs>(K_PROGRAMS, {})
    let current = read<string | null>(K_CURRENT, null)
    const fromLink = window.location.hash ? decodeProgram(window.location.hash.slice(1)) : null
    const transfer = !fromLink && window.location.hash ? decodeTransfer(window.location.hash) : null
    if (transfer) {
      const imported = importTransfer(transfer)
      stored = imported.programs
      current = imported.current
      setFlash(imported.message)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (fromLink) {
      const received = receiveProgram(fromLink)
      stored = received.programs
      current = fromLink.id
      if (received.message !== 'Programme ajouté.') setFlash(received.message)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (current && !stored[current]) current = Object.keys(stored)[0] ?? null
    setPrograms(stored)
    setCurrentId(current)
    setReady(true)
  }, [])

  useEffect(() => { if (currentId) setLog(read(kLog(currentId), {})) }, [currentId])

  // Bibliothèque publique (identique pour tous) : illustrations et textes par
  // défaut. Rien dans cette requête ne dit quel programme le patient suit.
  useEffect(() => {
    const cached = read<{ at: number; items: Library } | null>(K_LIBRARY, null)
    if (cached) setLibrary(cached.items)
    if (cached && Date.now() - cached.at < 24 * 3600e3) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    client.from('rehab_exercises')
      .select('id, description, progression_regression, illustration_url')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return
        const items: Library = {}
        for (const r of data as LibraryItem[]) items[r.id] = r
        setLibrary(items)
        write(K_LIBRARY, { at: Date.now(), items })
      })
  }, [])

  const stored = currentId ? programs[currentId] ?? null : null
  const program: ViewProgram | null = useMemo(() => {
    if (!stored) return null
    const phase = activePhase(stored.program, today)
    return { ...stored.program, x: phase.x, n: phase.n, w: phase.w, i: phase.i }
  }, [stored, today])

  const onReceived = (next: Programs, id: string, message: string) => { setPrograms(next); setCurrentId(id); setTab('today'); setFlash(message) }
  const onTransfer = (text: string): string | null => {
    const data = decodeTransfer(text)
    if (!data) return null
    const imported = importTransfer(data)
    if (imported.current) onReceived(imported.programs, imported.current, imported.message)
    return imported.message
  }
  const dismissUpdate = () => {
    if (!currentId) return
    const next = { ...programs, [currentId]: { ...programs[currentId], updated: false } }
    setPrograms(next); write(K_PROGRAMS, next)
  }

  const saveLog = useCallback((next: Record<string, DayLog>) => {
    setLog(next)
    if (currentId) write(kLog(currentId), next)
  }, [currentId])

  const todayLog: DayLog = log[today] ?? { done: {}, pains: {} }
  const updateToday = (patch: Partial<DayLog>) => saveLog({ ...log, [today]: { ...todayLog, ...patch } })

  if (!ready) return <div className={s.app}><div className={s.screen} /></div>
  if (!program || !stored) return <EmptyState onReceived={onReceived} onTransfer={onTransfer} />

  return (
    <div className={s.app}>
      <div className={s.screen}>
        <header className={s.top}>
          <span className={s.who}>{tab === 'today' ? frDate(today, true) : program.pr}</span>
          <h1>{{ today: 'Bonjour', program: 'Votre programme', track: 'Votre suivi', report: 'Votre bilan' }[tab]}</h1>
        </header>
        <main className={s.main}>
          {flash && tab === 'today' && <p className={`${s.advice} ${s.ok}`} role="status">{flash}</p>}
          {tab === 'today' && (
            <>
              <Notices raw={stored.program} updated={!!stored.updated} today={today} onDismissUpdate={dismissUpdate} />
              <Today program={program} library={library} log={log} today={today} todayLog={todayLog}
                onMorning={v => updateToday({ m: v })} onStart={() => setSession('guided')} onQuick={() => setSession('quick')} />
              <InstallCard />
            </>
          )}
          {tab === 'program' && (
            <ProgramView program={program} raw={stored.program} today={today} library={library} programs={programs} currentId={currentId!}
              onSwitch={id => { setCurrentId(id); write(K_CURRENT, id) }} onReceived={onReceived} onTransfer={onTransfer} />
          )}
          {tab === 'track' && <Track program={program} log={log} today={today} />}
          {tab === 'report' && <Report program={program} log={log} today={today} />}
        </main>
        <nav className={s.tabs} aria-label="Sections">
          {TABS.map(t => (
            <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => { setTab(t.id); setFlash(null); window.scrollTo(0, 0) }}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </div>
      {session && (
        <Session
          mode={session} program={program} library={library} todayLog={todayLog}
          onChange={patch => updateToday(patch)} onClose={() => setSession(null)}
        />
      )}
    </div>
  )
}

const icon = (d: string) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={d} /></svg>
const TABS: Array<{ id: Tab; label: string; icon: JSX.Element }> = [
  { id: 'today', label: 'Aujourd’hui', icon: icon('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4') },
  { id: 'program', label: 'Programme', icon: icon('M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h8M8 12h8M8 16h5') },
  { id: 'track', label: 'Suivi', icon: icon('M4 19V5M4 19h16M8 15l3-4 3 2 4-6') },
  { id: 'report', label: 'Bilan', icon: icon('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3M21 14v7h-4M14 18v3') },
]

function EmptyState({ onReceived, onTransfer }: { onReceived: (p: Programs, id: string, message: string) => void; onTransfer: (text: string) => string | null }) {
  const [installed, setInstalled] = useState(false)
  useEffect(() => { setInstalled(isStandalone()) }, [])
  return (
    <div className={s.app}>
      <div className={s.screen}>
        <div className={s.empty}>
          <h1>Votre programme d’exercices</h1>
          {installed && (
            <section className={`${s.card} ${s.notice}`}>
              <p><b>Vous venez d’installer l’appli ?</b> Si vous avez touché « Copier mon suivi » dans Safari, retrouvez ici votre programme et vos séances déjà faites.</p>
              <PasteTransfer onTransfer={onTransfer} />
            </section>
          )}
          <p className={s.muted}>Ouvrez le lien envoyé par votre praticien, ou scannez le QR code imprimé sur votre fiche d’exercices.</p>
          <UpdateProgram onTransfer={onTransfer} onDecoded={pr => { const r = receiveProgram(pr); onReceived(r.programs, pr.id, r.message); return r.message }} />
          <p className={`${s.small} ${s.muted}`}>Votre programme et votre suivi restent sur ce téléphone. Rien n’est envoyé sur internet.</p>
        </div>
      </div>
    </div>
  )
}

function Notices({ raw, updated, today, onDismissUpdate }: { raw: LinkProgram; updated: boolean; today: string; onDismissUpdate: () => void }) {
  const phase = activePhase(raw, today)
  const key = `ofp:seen-phase:${raw.id}:${phase.index}`
  const [seen, setSeen] = useState(true)
  useEffect(() => { setSeen(read<boolean>(key, false)) }, [key])
  const freshStep = phase.index > 0 && !seen && dayOffset(phase.startsOn, today) <= 7
  if (!updated && !freshStep) return null
  return (
    <section className={`${s.card} ${s.notice}`}>
      {freshStep && <p><b>Nouvelle étape depuis le {frDate(phase.startsOn, true)}</b>{phase.l ? ` : ${phase.l}` : ''}. Vos exercices ont changé, prenez le temps de relire leurs consignes.</p>}
      {updated && <p><b>Votre praticien a mis à jour votre programme.</b> Votre suivi est conservé.</p>}
      <button type="button" className={s.link} onClick={() => { write(key, true); setSeen(true); onDismissUpdate() }}>J’ai compris</button>
    </section>
  )
}

// ── Installation ────────────────────────────────────────────────────────────

const K_INSTALL_HIDDEN = 'ofp:install-hidden'
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/**
 * Explique comment mettre l'appli sur l'écran d'accueil. iPhone : Safari ne
 * le propose jamais de lui-même, et l'appli installée repart d'un stockage
 * vide ; d'où l'étape « Copier mon suivi ». Android : le navigateur installe
 * l'appli en gardant les données, un bouton suffit.
 */
function InstallCard({ always = false }: { always?: boolean }) {
  const [platform, setPlatform] = useState<null | 'ios' | 'other'>(null)
  const [hidden, setHidden] = useState(true)
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [copied, setCopied] = useState<null | 'ok' | 'manual'>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    if (isStandalone()) return
    setPlatform(isIos() ? 'ios' : 'other')
    setHidden(!always && read<boolean>(K_INSTALL_HIDDEN, false))
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [always])

  if (!platform || hidden) return null
  if (platform === 'other' && !prompt) return null

  const copy = async () => {
    const link = `${window.location.origin}/programme#${encodeTransfer(collectTransfer())}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied('ok')
    } catch {
      setManual(link)
      setCopied('manual')
    }
  }

  return (
    <section className={s.card}>
      <span className={s.label}>Installer l’appli sur votre téléphone</span>
      {platform === 'ios' ? (
        <>
          <p className={s.small}>Une icône sur votre écran d’accueil, comme une vraie appli. Trois étapes :</p>
          <ol className={s.stepsList}>
            <li>
              <b>Copiez votre suivi</b>
              <span className={`${s.small} ${s.muted}`}>L’appli installée ne voit pas ce que vous avez fait dans Safari : ce lien lui transmet votre programme et vos séances.</span>
              <button type="button" className={s.btn} onClick={copy}>{copied === 'ok' ? 'Suivi copié' : 'Copier mon suivi'}</button>
              {copied === 'manual' && (
                <textarea className={s.field} rows={3} readOnly value={manual} onFocus={e => e.currentTarget.select()} aria-label="Lien à copier" />
              )}
              {copied === 'manual' && <span className={`${s.small} ${s.muted}`}>Touchez le texte ci-dessus, puis « Copier ».</span>}
            </li>
            <li>
              <b>Ajoutez l’appli</b>
              <span className={`${s.small} ${s.muted}`}>
                Touchez le bouton Partager
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-label="(carré avec une flèche vers le haut)" style={{ display: 'inline-block', verticalAlign: '-3px', margin: '0 4px' }}><path d="M12 3v12M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
                en bas de Safari, puis « Sur l’écran d’accueil ». Si vous ne le voyez pas, faites défiler la liste vers le bas.
              </span>
            </li>
            <li>
              <b>Ouvrez « Mes exercices »</b>
              <span className={`${s.small} ${s.muted}`}>Depuis l’écran d’accueil, puis touchez « Coller mon suivi ». Vous n’aurez plus besoin de Safari.</span>
            </li>
          </ol>
        </>
      ) : (
        <>
          <p className={s.small}>Une icône sur votre écran d’accueil, comme une vraie appli. Votre suivi est conservé.</p>
          <button type="button" className={s.btn} onClick={async () => { await prompt!.prompt(); setPrompt(null) }}>Installer l’appli</button>
        </>
      )}
      {!always && (
        <button type="button" className={s.link} onClick={() => { write(K_INSTALL_HIDDEN, true); setHidden(true) }}>Plus tard</button>
      )}
    </section>
  )
}

/** Dans l'appli installée : reprend le suivi copié depuis Safari. */
function PasteTransfer({ onTransfer }: { onTransfer: (text: string) => string | null }) {
  const [manual, setManual] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const NOT_FOUND = 'Aucun suivi trouvé. Dans Safari, touchez d’abord « Copier mon suivi », puis revenez ici.'

  const fromClipboard = async () => {
    setError(null)
    try {
      const value = await navigator.clipboard.readText()
      if (!onTransfer(value)) setError(NOT_FOUND)
    } catch {
      setManual(true)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {!manual ? (
        <button type="button" className={s.btn} onClick={fromClipboard}>Coller mon suivi</button>
      ) : (
        <>
          <textarea className={s.field} rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Touchez ici puis « Coller »" aria-label="Suivi copié" />
          <button type="button" className={s.btn} disabled={!text.trim()} onClick={() => { if (!onTransfer(text)) setError(NOT_FOUND) }}>Valider</button>
        </>
      )}
      {error && <p className={`${s.advice} ${s.warn}`} role="status">{error}</p>}
    </div>
  )
}

// ── Aujourd'hui ─────────────────────────────────────────────────────────────

function habitualMorning(log: Record<string, DayLog>, today: string): number | null {
  const past = Object.entries(log).filter(([d, l]) => d < today && l.m != null).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 4)
  if (past.length === 0) return null
  return Math.round(past.reduce((a, [, l]) => a + (l.m as number), 0) / past.length)
}

function weekStats(program: ViewProgram, log: Record<string, DayLog>, today: string) {
  const week = Math.floor(dayOffset(program.d, today) / 7)
  const done = Object.entries(log).filter(([d, l]) => l.complete && Math.floor(dayOffset(program.d, d) / 7) === week).length
  return { week, done }
}

function Today({ program, library, log, today, todayLog, onMorning, onStart, onQuick }: {
  program: ViewProgram; library: Library; log: Record<string, DayLog>; today: string; todayLog: DayLog
  onMorning: (v: number) => void; onStart: () => void; onQuick: () => void
}) {
  const habitual = habitualMorning(log, today)
  const n = program.x.length
  const done = program.x.filter(e => todayLog.done[e.e]).length
  const { week, done: weekDone } = weekStats(program, log, today)
  let advice: JSX.Element | null = null
  if (todayLog.m != null) {
    const worse = todayLog.m > 5 || (habitual != null && todayLog.m >= habitual + 2)
    advice = worse
      ? <p className={`${s.advice} ${s.warn}`}>Plus douloureux que d’habitude{habitual != null ? ` (${habitual}/10)` : ''}. Faites la séance avec moins de charge aujourd’hui, et prévenez votre praticien si ça continue demain.</p>
      : <p className={`${s.advice} ${s.ok}`}>{habitual != null ? `C’est votre niveau habituel (${habitual}/10)\u00a0: gardez la même charge.` : 'Noté. Gardez la même charge tant que la douleur reste sous 5.'}</p>
  }
  return (
    <>
      <section className={s.card}>
        <span className={s.label}>Ce matin, au réveil</span>
        <p>Comment est la zone douloureuse, de 0 à 10&nbsp;?</p>
        <PainScale value={todayLog.m} onPick={onMorning} label="Douleur au réveil de 0 à 10" />
        {advice}
      </section>
      <section className={s.card}>
        <div className={s.progress}>
          <Ring done={done} total={n} />
          <div>
            <span className={s.label}>Séance du jour</span>
            <p><b>{todayLog.complete ? 'Séance faite, bravo.' : done ? 'Séance commencée' : `${n} exercice${n > 1 ? 's' : ''}`}</b></p>
            <p className={`${s.small} ${s.muted}`}>Semaine {week + 1} · {weekDone} séance{weekDone > 1 ? 's' : ''} sur {program.n} cette semaine</p>
          </div>
        </div>
        {program.x.map(ex => (
          <div className={s.ex} key={ex.e}>
            <Thumb ex={ex} library={library} />
            <div><div className={s.exName}>{ex.n}</div><div className={s.dose}>{doseText(ex)}</div></div>
            <span className={`${s.check} ${todayLog.done[ex.e] ? s.checkOn : ''}`} aria-label={todayLog.done[ex.e] ? 'Fait' : 'À faire'}>{todayLog.done[ex.e] ? '✓' : ''}</span>
          </div>
        ))}
        <button type="button" className={s.btn} onClick={onStart} disabled={!!todayLog.complete}>
          {todayLog.complete ? 'Séance du jour enregistrée' : done ? 'Reprendre la séance' : 'Commencer la séance guidée'}
        </button>
        {!todayLog.complete && <button type="button" className={s.link} onClick={onQuick}>J’ai déjà fait ma séance</button>}
      </section>
    </>
  )
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 26, c = 2 * Math.PI * r, f = total ? done / total : 0
  return (
    <svg className={s.ring} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">{done}/{total}</text>
    </svg>
  )
}

// ── Programme ───────────────────────────────────────────────────────────────

function ProgramView({ program, raw, today, library, programs, currentId, onSwitch, onReceived, onTransfer }: {
  program: ViewProgram; raw: LinkProgram; today: string; library: Library; programs: Programs; currentId: string
  onSwitch: (id: string) => void; onReceived: (p: Programs, id: string, message: string) => void; onTransfer: (text: string) => string | null
}) {
  const phases = phasesOf(raw)
  const current = activePhase(raw, today)
  const vigilance = (program.g || DEFAULT_VIGILANCE).split('\n').map(l => l.replace(/^\s*[•\-*]\s*/, '').trim()).filter(Boolean)
  const others = Object.values(programs).filter(p => p.program.id !== currentId)
  return (
    <>
      {program.i && <section className={s.card}><span className={s.label}>Le mot de votre praticien</span><p className={s.pre}>{program.i}</p></section>}
      {program.w && <section className={s.card}><span className={s.label}>Votre routine</span><p><b>{program.w}</b></p></section>}
      {phases.length > 1 && (
        <section className={s.card}>
          <span className={s.label}>Les étapes de votre programme</span>
          <ol className={s.stepsList}>
            {phases.map((ph, k) => {
              const state = k < current.index ? 'passée' : k === current.index ? 'en cours' : 'à venir'
              return (
                <li key={k} className={k === current.index ? s.stepNow : k < current.index ? s.stepPast : ''}>
                  <b>Étape {k + 1}{ph.l && ph.l !== `Étape ${k + 1}` ? ` : ${ph.l}` : ''}</b>
                  <span className={`${s.small} ${s.muted}`}>{k === 0 ? `dès le ${frDate(raw.d)}` : `à partir du ${frDate(addDays(raw.d, ph.o))}`} · {state}</span>
                  {k > current.index && <span className={`${s.small} ${s.muted}`}>{ph.x.map(e => e.n).join(', ')}</span>}
                </li>
              )
            })}
          </ol>
          {current.next && <p className={`${s.small} ${s.muted}`}>Vos exercices changeront d’eux-mêmes le {frDate(current.next.startsOn, true)}.</p>}
        </section>
      )}
      {program.x.map((ex, i) => {
        const lib = library[ex.e]
        const desc = ex.d ?? lib?.description ?? ''
        const adapt = ex.a ?? lib?.progression_regression ?? ''
        return (
          <details className={`${s.card} ${s.details}`} key={ex.e}>
            <summary>
              <Thumb ex={ex} library={library} />
              <div><div className={s.exName}>{i + 1}. {ex.n}</div><div className={`${s.small} ${s.muted}`}>{doseText(ex)}</div></div>
              <svg className={s.chev} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            {desc && <p>{desc}</p>}
            <div className={s.chips}>
              {ex.s != null && <span className={s.chip}>{ex.s} séries</span>}
              {ex.r && <span className={s.chip}>{ex.r} répétitions</span>}
              {ex.h ? <span className={s.chip}>Maintien {ex.h} s</span> : null}
              {ex.p ? <span className={s.chip}>Repos {ex.p} s</span> : null}
              {ex.f && <span className={s.chip}>{ex.f}</span>}
            </div>
            {ex.o && <p className={`${s.advice} ${s.ok}`}>{ex.o}</p>}
            {adapt && <p className={`${s.small} ${s.muted}`}>{adapt}</p>}
          </details>
        )
      })}
      <section className={`${s.card} ${s.vig}`}>
        <span className={s.label}>Arrêtez et contactez votre praticien si</span>
        <ul>{vigilance.map(v => <li key={v}>{v}</li>)}</ul>
      </section>
      <section className={s.card}>
        <span className={s.label}>Mettre à jour mon programme</span>
        <p className={`${s.small} ${s.muted}`}>Votre praticien a modifié votre programme ? Ouvrez le nouveau lien, collez-le ici ou scannez le QR code de votre nouvelle fiche.</p>
        <UpdateProgram onTransfer={onTransfer} onDecoded={pr => { const r = receiveProgram(pr); onReceived(r.programs, pr.id, r.message); return r.message }} />
      </section>
      <InstallCard always />
      {others.length > 0 && (
        <section className={s.card}>
          <span className={s.label}>Vos autres programmes</span>
          {others.map(p => (
            <button key={p.program.id} type="button" className={`${s.btn} ${s.ghost}`} onClick={() => onSwitch(p.program.id)}>
              Programme du {frDate(p.program.d)}
            </button>
          ))}
        </section>
      )}
    </>
  )
}

// ── Suivi ───────────────────────────────────────────────────────────────────

function Track({ program, log, today }: { program: ViewProgram; log: Record<string, DayLog>; today: string }) {
  const { done: weekDone } = weekStats(program, log, today)
  const total = Object.values(log).filter(l => l.complete).length
  const mornings = Object.entries(log).filter(([, l]) => l.m != null).sort(([a], [b]) => (a < b ? -1 : 1))
  const firstM = mornings[0]?.[1].m, lastM = mornings[mornings.length - 1]?.[1].m

  // Calendrier : les 5 dernières semaines, du lundi au dimanche.
  const todayDate = new Date(`${today}T12:00:00`)
  const monday = addDays(today, -((todayDate.getDay() + 6) % 7) - 28)
  const days = Array.from({ length: 35 }, (_, i) => addDays(monday, i))

  return (
    <>
      <div className={s.stats}>
        <div className={s.stat}><span className={s.label}>Cette semaine</span><b className={s.num}>{weekDone}/{program.n}</b><span className={`${s.small} ${s.muted}`}>séances, {total} depuis le début</span></div>
        <div className={s.stat}><span className={s.label}>Douleur au réveil</span><b className={s.num}>{firstM != null ? `${firstM} → ${lastM}` : 'à noter'}</b><span className={`${s.small} ${s.muted}`}>{mornings.length ? `sur 10, ${mornings.length} relevé${mornings.length > 1 ? 's' : ''}` : 'notez-la chaque matin'}</span></div>
      </div>
      <section className={s.card}>
        <span className={s.label}>Calendrier</span>
        <div className={s.cal}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((h, i) => <span className={s.calH} key={i}>{h}</span>)}
          {days.map(d => {
            const l = log[d]
            const cls = [s.day, l?.complete ? s.dayDone : '', d === today ? s.dayToday : '', d < program.d || d > today ? s.dayOut : ''].join(' ')
            return <span key={d} className={cls} title={`${frDate(d, true)}${l?.complete ? ' : séance faite' : ''}`}>{Number(d.slice(8))}</span>
          })}
        </div>
        <div className={s.legend}><span><i style={{ background: 'var(--good)' }} />séance faite</span><span><i style={{ outline: '2px solid var(--accent)' }} />aujourd’hui</span></div>
      </section>
      <section className={`${s.card} ${s.chart}`}>
        <span className={s.label}>Douleur au réveil</span>
        {mornings.length >= 2 ? <PainChart points={mornings.slice(-28).map(([d, l]) => ({ d, v: l.m as number }))} /> : <p className={`${s.small} ${s.muted}`}>La courbe apparaît après deux matins notés.</p>}
        <p className={`${s.small} ${s.muted}`}>Tant qu’elle reste sous 5 et revient à votre niveau habituel le lendemain, la charge est bonne.</p>
      </section>
    </>
  )
}

function PainChart({ points }: { points: Array<{ d: string; v: number }> }) {
  const W = 320, H = 150, L = 26, R = 10, T = 10, B = 24
  const d0 = points[0].d, span = Math.max(1, dayOffset(d0, points[points.length - 1].d))
  const X = (d: string) => L + (dayOffset(d0, d) / span) * (W - L - R)
  const Y = (v: number) => T + ((10 - v) * (H - T - B)) / 10
  const line = points.map((p, k) => `${k ? 'L' : 'M'}${X(p.d).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Douleur au réveil, de ${points[0].v} à ${last.v} sur 10`}>
      {[0, 5, 10].map(v => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeDasharray={v === 5 ? '4 4' : undefined} />
          <text x={L - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{v}</text>
        </g>
      ))}
      <text x={W - R} y={Y(5) - 5} textAnchor="end" fontSize="10.5" fill="var(--muted)">seuil 5/10</text>
      <path d={`${line} L${X(last.d).toFixed(1)} ${Y(0)} L${X(d0).toFixed(1)} ${Y(0)} Z`} fill="var(--accent)" fillOpacity=".12" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" />
      {points.map(p => <circle key={p.d} cx={X(p.d)} cy={Y(p.v)} r={p === last ? 4.5 : 2.5} fill="var(--accent)" />)}
      <text x={L} y={H - 6} fontSize="11" fill="var(--muted)">{frDate(d0)}</text>
      <text x={W - R} y={H - 6} textAnchor="end" fontSize="11" fill="var(--muted)">{frDate(last.d)}</text>
    </svg>
  )
}

// ── Bilan ───────────────────────────────────────────────────────────────────

export function buildReport(program: ViewProgram, log: Record<string, DayLog>, today: string): FullReport {
  const days = Object.entries(log)
    .filter(([d]) => d >= program.d && d <= today)
    .map(([d, l]) => ({
      o: dayOffset(program.d, d),
      m: l.m ?? null,
      x: !!l.complete,
      p: Object.values(l.pains ?? {}).length ? Math.max(...Object.values(l.pains)) : null,
    }))
    .filter(d => d.m != null || d.x || d.p != null)
    .sort((a, b) => a.o - b.o)
  return { v: 1, id: program.id, s: program.d, at: today, u: program.u, n: program.n, days }
}

function Report({ program, log, today }: { program: ViewProgram; log: Record<string, DayLog>; today: string }) {
  const report = useMemo(() => buildReport(program, log, today), [program, log, today])
  const weeks = useMemo(() => summarizeWeeks(report), [report])
  const full = useMemo(() => encodeFullReport(report), [report])
  const code = useMemo(() => (weeks.length ? encodeShortCode(program.id, weeks) : ''), [program.id, weeks])
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    import('qrcode').then(QR => QR.toDataURL(full, { errorCorrectionLevel: 'L', margin: 0, width: 408, color: { dark: '#10201d', light: '#ffffff' } }))
      .then(url => { if (alive) setQr(url) })
      .catch(() => setQr(null))
    return () => { alive = false }
  }, [full])

  if (report.days.length === 0) {
    return <section className={s.card}><span className={s.label}>Bilan</span><p>Votre bilan apparaîtra après votre première séance ou votre premier matin noté.</p></section>
  }

  const done = report.days.filter(d => d.x).length
  const ms = report.days.filter(d => d.m != null)
  const pains = report.days.map(d => d.p).filter((v): v is number => v != null)
  const text = `Bilan de mon programme d’exercices (à coller dans Osteoflow) : ${full}`
  const copy = () => {
    const done = () => setCopied(true)
    try { navigator.clipboard.writeText(text).then(done, done) } catch { done() }
  }

  return (
    <>
      <section className={s.card} style={{ textAlign: 'center' }}>
        <span className={s.label}>À montrer à votre praticien</span>
        <p>En consultation, votre praticien scanne ce code.</p>
        <div className={s.qrbox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="QR code de votre bilan" /> : <span className={s.small} style={{ color: '#10201d' }}>Préparation du code…</span>}
        </div>
        <p className={`${s.small} ${s.muted}`}>Sans caméra, il peut taper ce code&nbsp;:</p>
        <div className={s.code} aria-label="Code du bilan">{code}</div>
      </section>
      <section className={s.card}>
        <div className={s.summary}>
          <div><span>Séances faites</span><b className={s.num}>{done}</b></div>
          {ms.length > 0 && <div><span>Douleur au réveil</span><b className={s.num}>{ms[0].m}/10 → {ms[ms.length - 1].m}/10</b></div>}
          {pains.length > 0 && <div><span>Douleur maximale en séance</span><b className={s.num}>{Math.max(...pains)}/10</b></div>}
          <div><span>Depuis le</span><b>{frDate(program.d)}</b></div>
        </div>
      </section>
      <section className={s.card}>
        <div className={s.privacy}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          <p>Vos données restent sur ce téléphone. Le bilan ne le quitte que si vous le montrez ou l’envoyez vous-même.</p>
        </div>
        <button type="button" className={`${s.btn} ${s.ghost}`} onClick={copy}>Copier le bilan pour l’envoyer par message</button>
        {copied && <p className={`${s.small} ${s.muted}`}>Bilan copié : collez-le dans un email ou un SMS à votre praticien.</p>}
      </section>
    </>
  )
}
