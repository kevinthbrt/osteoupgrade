'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  likelihoodRatios,
  posteriorProbability,
  type ArbreNoeud,
  type ArbrePayload,
  type RegionActivity,
} from '@/lib/region-modules'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
  Stethoscope,
  Target,
  X,
} from 'lucide-react'

type Props = {
  activities: RegionActivity[]
  userId: string | null
  /** Activités déjà réussies, pour rouvrir le chapitre dans l'état où on l'a laissé. */
  solved: Set<string>
}

/**
 * Rendu des activités d'un chapitre.
 *
 * Le score n'est pas une note : il sert à savoir ce qui reste à revoir. Les
 * réponses sont donc enregistrées en dernier état, sans historique, et une
 * activité peut être refaite autant de fois qu'on veut.
 */
export default function ChapterActivities({ activities, userId, solved }: Props) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...solved].map((id) => [id, true]))
  )

  const record = async (activityId: string, isCorrect: boolean) => {
    setDone((prev) => ({ ...prev, [activityId]: isCorrect }))
    if (!userId) return
    try {
      await supabase
        .from('region_activity_attempts')
        .upsert(
          { user_id: userId, activity_id: activityId, is_correct: isCorrect, answered_at: new Date().toISOString() },
          { onConflict: 'user_id,activity_id' }
        )
    } catch (error) {
      // L'exercice reste jouable même si l'enregistrement échoue : ne rien
      // interrompre pour une progression non sauvegardée.
      console.error('Progression non enregistrée:', error)
    }
  }

  // Le calculateur et l'arbre ne sont pas des questions à réponse juste : on
  // les sort du compteur plutôt que de leur inventer un score.
  const scored = activities.filter(
    (a) => a.kind !== 'probabilite' && a.kind !== 'arbre_decision'
  )
  const correct = scored.filter((a) => done[a.id]).length

  if (activities.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Target className="h-4 w-4" />
          Exercez-vous
        </h2>
        {scored.length > 0 && (
          <span className="text-sm font-medium text-slate-500">
            {correct} / {scored.length} réussi{correct > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <article
            key={activity.id}
            className="overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/40"
          >
            <div className="p-5">
              {activity.title && (
                <h3 className="font-semibold text-slate-900">{activity.title}</h3>
              )}
              {activity.prompt && <p className="mt-1.5 text-sm text-slate-700">{activity.prompt}</p>}

              <div className="mt-4">
                {activity.kind === 'qcm' && (
                  <Qcm activity={activity} onResolved={(ok) => record(activity.id, ok)} />
                )}
                {activity.kind === 'vrai_faux' && (
                  <VraiFaux activity={activity} onResolved={(ok) => record(activity.id, ok)} />
                )}
                {activity.kind === 'tri_drapeaux' && (
                  <TriDrapeaux activity={activity} onResolved={(ok) => record(activity.id, ok)} />
                )}
                {activity.kind === 'cas_etape' && (
                  <CasEtape activity={activity} onResolved={(ok) => record(activity.id, ok)} />
                )}
                {activity.kind === 'probabilite' && <Probabilite activity={activity} />}
                {activity.kind === 'arbre_decision' && <ArbreDecision activity={activity} />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Explanation({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="mt-4 flex gap-2.5 rounded-xl bg-white/80 p-4 text-sm text-slate-700 ring-1 ring-violet-100">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
      <p>{text}</p>
    </div>
  )
}

function Feedback({ correct, text }: { correct: boolean; text?: string }) {
  if (!text) return null
  return (
    <p
      className={`mt-1.5 flex gap-1.5 text-sm ${
        correct ? 'text-emerald-700' : 'text-rose-700'
      }`}
    >
      {correct ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : (
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      {text}
    </p>
  )
}

function Qcm({ activity, onResolved }: { activity: RegionActivity; onResolved: (ok: boolean) => void }) {
  const options: any[] = activity.payload?.options || []
  const multiple: boolean = Boolean(activity.payload?.multiple)
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)

  const toggle = (index: number) => {
    if (checked) return
    setPicked((prev) =>
      multiple
        ? prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
        : [index]
    )
  }

  const submit = () => {
    const expected = options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0)
    const ok =
      picked.length === expected.length && expected.every((i) => picked.includes(i))
    setChecked(true)
    onResolved(ok)
  }

  const reset = () => {
    setPicked([])
    setChecked(false)
  }

  return (
    <div>
      {multiple && !checked && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600">
          Plusieurs réponses attendues
        </p>
      )}
      <div className="space-y-2">
        {options.map((option, index) => {
          const isPicked = picked.includes(index)
          const reveal = checked
          const tone = reveal
            ? option.correct
              ? 'border-emerald-300 bg-emerald-50'
              : isPicked
                ? 'border-rose-300 bg-rose-50'
                : 'border-slate-200 bg-white'
            : isPicked
              ? 'border-violet-400 bg-white ring-1 ring-violet-200'
              : 'border-slate-200 bg-white hover:border-violet-300'

          return (
            <button
              key={index}
              onClick={() => toggle(index)}
              disabled={checked}
              className={`w-full rounded-xl border p-3.5 text-left transition-colors ${tone} ${
                checked ? 'cursor-default' : ''
              }`}
            >
              <span className="flex items-start gap-2.5 text-sm text-slate-800">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                    multiple ? 'rounded' : 'rounded-full'
                  } ${isPicked ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}
                >
                  {isPicked && <Check className="h-3 w-3 text-white" />}
                </span>
                {option.label}
              </span>
              {checked && (isPicked || option.correct) && (
                <Feedback correct={Boolean(option.correct)} text={option.feedback} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex gap-3">
        {!checked ? (
          <button
            onClick={submit}
            disabled={picked.length === 0}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refaire
          </button>
        )}
      </div>

      {checked && <Explanation text={activity.explanation} />}
    </div>
  )
}

function VraiFaux({ activity, onResolved }: { activity: RegionActivity; onResolved: (ok: boolean) => void }) {
  const statements: any[] = activity.payload?.statements || []
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [checked, setChecked] = useState(false)

  const submit = () => {
    const ok = statements.every((s, i) => answers[i] === Boolean(s.correct))
    setChecked(true)
    onResolved(ok)
  }

  return (
    <div>
      <div className="space-y-2">
        {statements.map((statement, index) => {
          const answer = answers[index]
          const isRight = checked && answer === Boolean(statement.correct)

          return (
            <div
              key={index}
              className={`rounded-xl border p-3.5 ${
                checked
                  ? isRight
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-rose-300 bg-rose-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-sm text-slate-800">{statement.label}</p>
              <div className="mt-2.5 flex gap-2">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    onClick={() => !checked && setAnswers((prev) => ({ ...prev, [index]: value }))}
                    disabled={checked}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      answer === value
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } ${checked ? 'cursor-default' : ''}`}
                  >
                    {value ? 'Vrai' : 'Faux'}
                  </button>
                ))}
              </div>
              {checked && <Feedback correct={isRight} text={statement.feedback} />}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex gap-3">
        {!checked ? (
          <button
            onClick={submit}
            disabled={Object.keys(answers).length < statements.length}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={() => {
              setAnswers({})
              setChecked(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refaire
          </button>
        )}
      </div>

      {checked && <Explanation text={activity.explanation} />}
    </div>
  )
}

function TriDrapeaux({ activity, onResolved }: { activity: RegionActivity; onResolved: (ok: boolean) => void }) {
  const items: any[] = activity.payload?.items || []
  const niveaux: string[] = activity.payload?.niveaux || []
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)

  // Les catégories d'un tri ne sont pas toujours des degrés de gravité : classer
  // un mécanisme de douleur n'a pas d'ordre, et un dégradé rouge vers vert y
  // suggérerait une hiérarchie qui n'existe pas. On ne garde donc la palette
  // d'urgence que lorsque les niveaux en sont réellement.
  const urgencyScale = niveaux.some((n) => n.startsWith('Urgence'))
  const neutral = ['bg-violet-600', 'bg-sky-600', 'bg-teal-600', 'bg-slate-600']

  const tone = (niveau: string) => {
    if (!urgencyScale) return neutral[niveaux.indexOf(niveau) % neutral.length]
    if (niveau.startsWith('Urgence')) return 'bg-rose-600'
    if (niveau.startsWith('Avis')) return 'bg-amber-500'
    return 'bg-emerald-600'
  }

  const submit = () => {
    const ok = items.every((item, i) => answers[i] === item.niveau)
    setChecked(true)
    onResolved(ok)
  }

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const answer = answers[index]
          const isRight = checked && answer === item.niveau

          return (
            <div
              key={index}
              className={`rounded-xl border p-3.5 ${
                checked
                  ? isRight
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-rose-300 bg-rose-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-sm text-slate-800">{item.label}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {niveaux.map((niveau) => (
                  <button
                    key={niveau}
                    onClick={() => !checked && setAnswers((prev) => ({ ...prev, [index]: niveau }))}
                    disabled={checked}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      answer === niveau
                        ? `${tone(niveau)} text-white`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } ${checked ? 'cursor-default' : ''}`}
                  >
                    {niveau}
                  </button>
                ))}
              </div>
              {checked && !isRight && (
                <p className="mt-1.5 text-xs font-semibold text-rose-700">
                  Réponse attendue : {item.niveau}
                </p>
              )}
              {checked && <Feedback correct={isRight} text={item.feedback} />}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex gap-3">
        {!checked ? (
          <button
            onClick={submit}
            disabled={Object.keys(answers).length < items.length}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={() => {
              setAnswers({})
              setChecked(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refaire
          </button>
        )}
      </div>

      {checked && <Explanation text={activity.explanation} />}
    </div>
  )
}

function CasEtape({ activity, onResolved }: { activity: RegionActivity; onResolved: (ok: boolean) => void }) {
  const steps: any[] = activity.payload?.steps || []
  const [current, setCurrent] = useState(0)
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [mistakes, setMistakes] = useState(0)

  const step = steps[current]
  if (!step) return null

  const answered = picked[current] !== undefined
  const isLast = current === steps.length - 1

  const choose = (index: number) => {
    if (answered) return
    setPicked((prev) => ({ ...prev, [current]: index }))
    if (!step.options[index]?.correct) setMistakes((m) => m + 1)
    if (isLast) onResolved(mistakes === 0 && Boolean(step.options[index]?.correct))
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {steps.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < current ? 'bg-violet-500' : index === current ? 'bg-violet-300' : 'bg-slate-200'
            }`}
          />
        ))}
        <span className="text-xs font-medium text-slate-500">
          {current + 1} / {steps.length}
        </span>
      </div>

      <div className="rounded-xl bg-white p-4 text-sm text-slate-700 ring-1 ring-slate-200">
        {step.situation}
      </div>

      <p className="mt-3 font-medium text-slate-900">{step.question}</p>

      <div className="mt-2 space-y-2">
        {(step.options || []).map((option: any, index: number) => {
          const isPicked = picked[current] === index
          const tone = answered
            ? option.correct
              ? 'border-emerald-300 bg-emerald-50'
              : isPicked
                ? 'border-rose-300 bg-rose-50'
                : 'border-slate-200 bg-white'
            : 'border-slate-200 bg-white hover:border-violet-300'

          return (
            <button
              key={index}
              onClick={() => choose(index)}
              disabled={answered}
              className={`w-full rounded-xl border p-3.5 text-left text-sm text-slate-800 transition-colors ${tone}`}
            >
              {option.label}
              {answered && (isPicked || option.correct) && (
                <Feedback correct={Boolean(option.correct)} text={option.feedback} />
              )}
            </button>
          )
        })}
      </div>

      {answered && !isLast && (
        <button
          onClick={() => setCurrent((c) => c + 1)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Étape suivante
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {answered && isLast && (
        <>
          <Explanation text={activity.explanation} />
          <button
            onClick={() => {
              setPicked({})
              setCurrent(0)
              setMistakes(0)
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recommencer le cas
          </button>
        </>
      )}
    </div>
  )
}

function Probabilite({ activity }: { activity: RegionActivity }) {
  const prevalence: number = activity.payload?.prevalence ?? 30
  const tests: any[] = activity.payload?.tests || []
  const [results, setResults] = useState<Record<number, 'positif' | 'negatif' | null>>({})

  const { probability, ratios } = useMemo(() => {
    const applied: number[] = []
    tests.forEach((test, index) => {
      const state = results[index]
      if (!state) return
      const { positive, negative } = likelihoodRatios(test.se, test.sp)
      applied.push(state === 'positif' ? positive : negative)
    })
    return { probability: posteriorProbability(prevalence, applied), ratios: applied }
  }, [results, tests, prevalence])

  const format = (value: number) =>
    !Number.isFinite(value) ? '∞' : value >= 10 ? value.toFixed(0) : value.toFixed(2).replace('.', ',')

  return (
    <div>
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Probabilité du diagnostic
          </span>
          <span className="text-2xl font-bold text-slate-900">{probability.toFixed(0)} %</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              probability >= 70 ? 'bg-emerald-500' : probability >= 35 ? 'bg-amber-500' : 'bg-sky-500'
            }`}
            style={{ width: `${Math.min(Math.max(probability, 1), 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Départ : {prevalence} %
          {activity.payload?.prevalence_label ? ` (${activity.payload.prevalence_label})` : ''}
          {ratios.length > 0 && ` · ${ratios.length} test${ratios.length > 1 ? 's' : ''} pris en compte`}
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {tests.map((test, index) => {
          const { positive, negative } = likelihoodRatios(test.se, test.sp)
          const state = results[index]

          return (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{test.name}</span>
                <span className="text-xs text-slate-500">
                  RV+ {format(positive)} · RV- {format(negative)}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {(['positif', 'negatif'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setResults((prev) => ({ ...prev, [index]: prev[index] === value ? null : value }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      state === value
                        ? value === 'positif'
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {value === 'positif' ? 'Positif' : 'Négatif'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setResults({})}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Réinitialiser
      </button>

      <p className="mt-3 flex gap-2 text-xs text-slate-500">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        Les rapports de vraisemblance sont recalculés depuis la sensibilité et la spécificité des
        fiches de tests de la plateforme, pas saisis à part.
      </p>

      <Explanation text={activity.explanation} />
    </div>
  )
}

/**
 * Arbre de décision.
 *
 * On avance nœud par nœud en gardant la trace du chemin suivi, parce que c'est
 * le chemin qui enseigne quelque chose : au bout, le praticien voit sur quoi sa
 * décision s'est réellement jouée. Rien n'est noté, on peut remonter à
 * n'importe quelle étape et essayer l'autre branche.
 */
const ARBRE_TONS = {
  urgence: {
    carte: 'border-rose-300 bg-rose-50',
    titre: 'text-rose-900',
    pastille: 'bg-rose-600',
    icone: AlertTriangle,
    libelle: 'Urgence',
  },
  orienter: {
    carte: 'border-amber-300 bg-amber-50',
    titre: 'text-amber-900',
    pastille: 'bg-amber-500',
    icone: Send,
    libelle: 'Réorienter',
  },
  traiter: {
    carte: 'border-emerald-300 bg-emerald-50',
    titre: 'text-emerald-900',
    pastille: 'bg-emerald-600',
    icone: Stethoscope,
    libelle: 'Prendre en charge',
  },
} as const

function ArbreDecision({ activity }: { activity: RegionActivity }) {
  const arbre: ArbrePayload = activity.payload || { racine: '', noeuds: {} }
  const noeuds = arbre.noeuds || {}

  // Chaque pas retient le nœud quitté et l'option choisie : de quoi reconstituer
  // le fil, et de quoi revenir en arrière sans rejouer depuis le début.
  const [chemin, setChemin] = useState<{ de: string; label: string; axe?: string }[]>([])
  const [courant, setCourant] = useState<string>(arbre.racine)

  const noeud: ArbreNoeud | undefined = noeuds[courant]
  if (!noeud) return null

  const choisir = (option: { label: string; vers: string }) => {
    if (noeud.type !== 'question') return
    setChemin((prev) => [...prev, { de: courant, label: option.label, axe: noeud.axe }])
    setCourant(option.vers)
  }

  const revenirA = (index: number) => {
    const cible = chemin[index]
    if (!cible) return
    setChemin(chemin.slice(0, index))
    setCourant(cible.de)
  }

  const recommencer = () => {
    setChemin([])
    setCourant(arbre.racine)
  }

  return (
    <div>
      {chemin.length > 0 && (
        <ol className="mb-4 space-y-1.5">
          {chemin.map((pas, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <button
                onClick={() => revenirA(index)}
                className="text-left text-slate-600 hover:text-violet-700 hover:underline"
                title="Revenir à cette étape"
              >
                {pas.axe && (
                  <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-violet-500">
                    {pas.axe} :
                  </span>
                )}
                {pas.label}
              </button>
            </li>
          ))}
        </ol>
      )}

      {noeud.type === 'question' ? (
        <div>
          {noeud.axe && (
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {noeud.axe}
            </p>
          )}
          <p className="mt-1 font-medium text-slate-900">{noeud.texte}</p>

          <div className="mt-3 space-y-2">
            {noeud.options.map((option, index) => (
              <button
                key={index}
                onClick={() => choisir(option)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left text-sm text-slate-800 transition-colors hover:border-violet-300 hover:bg-violet-50/60"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Conclusion noeud={noeud} />
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {chemin.length > 0 && (
          <>
            <button
              onClick={() => revenirA(chemin.length - 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Étape précédente
            </button>
            <button
              onClick={recommencer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Repartir du début
            </button>
          </>
        )}
      </div>

      {noeud.type === 'conclusion' && <Explanation text={activity.explanation} />}
    </div>
  )
}

function Conclusion({ noeud }: { noeud: Extract<ArbreNoeud, { type: 'conclusion' }> }) {
  const ton = ARBRE_TONS[noeud.ton] || ARBRE_TONS.traiter
  const Icone = ton.icone

  return (
    <div className={`rounded-2xl border p-5 ${ton.carte}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${ton.pastille}`}
      >
        <Icone className="h-3.5 w-3.5" />
        {ton.libelle}
      </span>

      <h4 className={`mt-2.5 text-lg font-semibold ${ton.titre}`}>{noeud.titre}</h4>
      <p className="mt-2 text-sm text-slate-700">{noeud.conduite}</p>

      {noeud.pourquoi && (
        <p className="mt-3 border-t border-white/70 pt-3 text-sm italic text-slate-600">
          {noeud.pourquoi}
        </p>
      )}
    </div>
  )
}
