'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  FlaskConical,
  Key,
  Lightbulb,
  Send,
  Target,
} from 'lucide-react'
import { ActiviteContenu, enregistrerTentative, estNotee } from '../ChapterActivities'
import Personnage, { Bulle, Scene } from './Personnage'
import FinChapitre from './FinChapitre'
import type { RegionActivity, RegionChapter, RegionSection, SectionCallout } from '@/lib/region-modules'

type Lien = { href: string; titre: string }

type Props = {
  chapter: RegionChapter
  sections: RegionSection[]
  activities: RegionActivity[]
  userId: string | null
  solved: Set<string>
  done: boolean
  onTerminer: () => void
  suivant: Lien | null
  retourParcours: string
}

type Etape =
  | { type: 'intro' }
  | { type: 'section'; section: RegionSection }
  | { type: 'activite'; activity: RegionActivity }
  | { type: 'retenir' }
  | { type: 'fin' }

/** Ouverture : une activité placée avec after_section = -1 s'affiche avant la première section. */
export const OUVERTURE = -1

const CALLOUTS: Record<SectionCallout, { cadre: string; libelle: string | null; icone: any }> = {
  none: { cadre: 'border-slate-200 bg-white', libelle: null, icone: null },
  cle: { cadre: 'border-sky-200 bg-sky-50/70', libelle: 'À retenir', icone: Key },
  drapeau_rouge: { cadre: 'border-rose-200 bg-rose-50/70', libelle: 'Drapeau rouge', icone: AlertTriangle },
  preuve: { cadre: 'border-emerald-200 bg-emerald-50/70', libelle: 'Niveau de preuve', icone: FlaskConical },
  piege: { cadre: 'border-amber-200 bg-amber-50/70', libelle: 'Piège fréquent', icone: Lightbulb },
  pratique: { cadre: 'border-violet-200 bg-violet-50/70', libelle: 'En pratique', icone: Activity },
  reorientation: { cadre: 'border-orange-200 bg-orange-50/70', libelle: 'Réorientation', icone: Send },
}

/** L'ordre des étapes : intro, ouverture, chaque section suivie de ses activités, le reste, les points clés, la fin. */
export function construireEtapes(chapter: RegionChapter, sections: RegionSection[], activities: RegionActivity[]): Etape[] {
  const triees = [...sections].sort((a, b) => a.order_index - b.order_index)
  const indexSections = new Set(triees.map((s) => s.order_index))
  const apres = (n: number) =>
    activities.filter((a) => a.after_section === n).sort((a, b) => a.order_index - b.order_index)

  const etapes: Etape[] = [{ type: 'intro' }]
  for (const a of apres(OUVERTURE)) etapes.push({ type: 'activite', activity: a })
  for (const s of triees) {
    etapes.push({ type: 'section', section: s })
    for (const a of apres(s.order_index)) etapes.push({ type: 'activite', activity: a })
  }
  const restantes = activities
    .filter((a) => a.after_section == null || (a.after_section !== OUVERTURE && !indexSections.has(a.after_section)))
    .sort((a, b) => a.order_index - b.order_index)
  for (const a of restantes) etapes.push({ type: 'activite', activity: a })
  if (chapter.key_points?.length) etapes.push({ type: 'retenir' })
  etapes.push({ type: 'fin' })
  return etapes
}

const cleStockage = (id: string) => `regions:etape:${id}`

/**
 * Le lecteur pas à pas d'un chapitre animé : une étape par écran, une barre de
 * progression, les activités au moment où la notion vient d'être lue, et une
 * fin de chapitre qui marque le chapitre comme terminé.
 */
export default function LecteurAnime({
  chapter,
  sections,
  activities,
  userId,
  solved,
  done,
  onTerminer,
  suivant,
  retourParcours,
}: Props) {
  const etapes = useMemo(() => construireEtapes(chapter, sections, activities), [chapter, sections, activities])
  const [i, setI] = useState(0)
  const [resultats, setResultats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...solved].map((id) => [id, true]))
  )
  const haut = useRef<HTMLDivElement>(null)
  const premierRendu = useRef(true)

  // Reprendre là où l'on s'était arrêté. Le stockage peut être indisponible
  // (navigation privée) : on repart alors du début, sans erreur.
  useEffect(() => {
    try {
      const n = Number(window.localStorage.getItem(cleStockage(chapter.id)))
      if (Number.isInteger(n) && n > 0 && n < etapes.length - 1) setI(n)
    } catch {}
  }, [chapter.id, etapes.length])

  useEffect(() => {
    try {
      window.localStorage.setItem(cleStockage(chapter.id), String(i))
    } catch {}
    if (premierRendu.current) {
      premierRendu.current = false
      return
    }
    haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [i, chapter.id])

  const etape = etapes[i]

  useEffect(() => {
    if (etape?.type === 'fin' && !done) onTerminer()
  }, [etape, done, onTerminer])

  const aller = useCallback((n: number) => setI(Math.max(0, Math.min(n, etapes.length - 1))), [etapes.length])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null
      if (cible && ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) return
      if (e.key === 'ArrowRight') aller(i + 1)
      if (e.key === 'ArrowLeft') aller(i - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [i, aller])

  const resoudre = (activity: RegionActivity, ok: boolean) => {
    setResultats((r) => ({ ...r, [activity.id]: ok }))
    void enregistrerTentative(userId, activity.id, ok)
  }

  const notees = activities.filter(estNotee)
  const reussies = notees.filter((a) => resultats[a.id]).length

  return (
    <div ref={haut} className="scroll-mt-24 space-y-5">
      <Progression etapes={etapes} courante={i} onAller={aller} />

      <div key={i} className="etape-entre">
        {etape.type === 'intro' && <Intro chapter={chapter} />}
        {etape.type === 'section' && <EtapeSection section={etape.section} />}
        {etape.type === 'activite' && (
          <EtapeActivite activity={etape.activity} onResolved={(ok) => resoudre(etape.activity, ok)} />
        )}
        {etape.type === 'retenir' && <Retenir points={chapter.key_points} />}
        {etape.type === 'fin' && (
          <FinChapitre
            titre={chapter.title}
            partie={chapter.part}
            reussies={reussies}
            notees={notees.length}
            minutes={chapter.estimated_minutes}
            suivant={suivant}
            retourParcours={retourParcours}
            onRevoir={() => aller(0)}
          />
        )}
      </div>

      {etape.type !== 'fin' && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => aller(i - 1)}
            disabled={i === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </button>
          <span className="hidden text-xs text-slate-400 sm:block">Flèches du clavier pour avancer</span>
          <button
            type="button"
            onClick={() => aller(i + 1)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-700"
          >
            {etapes[i + 1]?.type === 'fin' ? 'Terminer le chapitre' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function Progression({ etapes, courante, onAller }: { etapes: Etape[]; courante: number; onAller: (n: number) => void }) {
  const couleur = (e: Etape, k: number) => {
    if (k > courante) return 'bg-slate-200'
    if (e.type === 'activite') return 'bg-amber-400'
    if (e.type === 'fin') return 'bg-emerald-500'
    return 'bg-violet-500'
  }
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          Étape {courante + 1} sur {etapes.length}
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-violet-500" /> Cours
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Exercice
          </span>
        </span>
      </div>
      <div className="flex gap-1">
        {etapes.map((e, k) => (
          <button
            key={k}
            type="button"
            onClick={() => onAller(k)}
            aria-label={`Aller à l’étape ${k + 1}`}
            className={`h-2 flex-1 rounded-full transition-colors ${couleur(e, k)} ${k === courante ? 'ring-2 ring-violet-300 ring-offset-1' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

function Intro({ chapter }: { chapter: RegionChapter }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {chapter.part && <span className="rounded-full bg-violet-600 px-2.5 py-1 text-white">{chapter.part}</span>}
            {chapter.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {chapter.estimated_minutes} min
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900">{chapter.title}</h1>
          {chapter.summary && <p className="text-slate-600">{chapter.summary}</p>}
          {chapter.objectives?.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Target className="h-4 w-4" />
                À la fin de ce chapitre, vous saurez
              </h2>
              <ul className="mt-2 space-y-1.5">
                {chapter.objectives.map((o, k) => (
                  <li key={k} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Scene className="flex min-h-[280px] flex-col justify-end gap-3 rounded-none px-5 pt-6">
          <Bulle qui="osteo" className="mr-10 self-start">
            {chapter.subtitle ? `On y va : ${chapter.subtitle.charAt(0).toLowerCase()}${chapter.subtitle.slice(1)}.` : 'On y va, une étape à la fois.'}
          </Bulle>
          <div className="w-60 self-end sm:w-72">
            <Personnage id="osteo" expression="sourire" />
          </div>
        </Scene>
      </div>
    </div>
  )
}

function EtapeSection({ section }: { section: RegionSection }) {
  const style = CALLOUTS[section.callout] || CALLOUTS.none
  const Icone = style.icone
  const texte = (
    <section className={`rounded-2xl border p-6 ${style.cadre}`}>
      {style.libelle && (
        <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {Icone && <Icone className="h-3.5 w-3.5" />}
          {style.libelle}
        </div>
      )}
      {section.title && <h2 className="mb-3 text-xl font-semibold text-slate-900">{section.title}</h2>}
      <div className="region-html text-slate-700" dangerouslySetInnerHTML={{ __html: section.body_html }} />
    </section>
  )

  if (!section.personnage) return texte

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 lg:order-1">{texte}</div>
      <Scene className="flex items-end gap-3 px-4 pb-4 pt-4 lg:sticky lg:top-24 lg:order-2 lg:flex-col lg:items-stretch lg:self-start">
        {section.replique && (
          <Bulle qui={section.personnage} declencheur={section.id} className="flex-1 text-sm lg:flex-none">
            {section.replique}
          </Bulle>
        )}
        <div className="w-28 shrink-0 self-end sm:w-36 lg:w-44">
          <Personnage id={section.personnage} expression={section.expression} declencheur={section.id} />
        </div>
      </Scene>
    </div>
  )
}

function EtapeActivite({ activity, onResolved }: { activity: RegionActivity; onResolved: (ok: boolean) => void }) {
  const estScene = activity.kind === 'scene'
  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 ${estScene ? 'border-violet-200 bg-white' : 'border-amber-200 bg-amber-50/40'}`}
    >
      {!estScene && (
        <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
          <Target className="h-3.5 w-3.5" />
          À vous
        </span>
      )}
      {activity.title && <h2 className="text-lg font-semibold text-slate-900">{activity.title}</h2>}
      {activity.prompt && <p className="mt-1.5 text-sm text-slate-700">{activity.prompt}</p>}
      <div className="mt-4">
        <ActiviteContenu activity={activity} onResolved={onResolved} />
      </div>
      {activity.explanation && estScene && (
        <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{activity.explanation}</p>
      )}
    </article>
  )
}

function Retenir({ points }: { points: string[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <section className="rounded-2xl bg-slate-900 p-6 text-white">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
          <Key className="h-4 w-4" />
          Ce qu’il faut retenir
        </h2>
        <ol className="mt-4 space-y-3">
          {points.map((p, k) => (
            <li
              key={k}
              className="etape-entre flex gap-3 rounded-xl bg-white/5 p-3 text-sm leading-relaxed text-slate-100"
              style={{ animationDelay: `${k * 120}ms`, animationFillMode: 'both' }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold text-violet-200">
                {k + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </section>
      <Scene className="hidden items-end justify-center px-4 pb-4 pt-6 lg:flex">
        <Personnage id="osteo" expression="debout" className="max-h-80 w-auto" />
      </Scene>
    </div>
  )
}
