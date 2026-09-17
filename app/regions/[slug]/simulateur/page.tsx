'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { fetchProfilePayload } from '@/lib/profile-client'
import {
  EXAMS,
  EXAM_GROUPS,
  type SimulationConclusion,
  type SimulationExam,
  type SimulationTurn,
} from '@/lib/region-simulation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Play,
  Send,
  Stethoscope,
  UserRound,
  XCircle,
} from 'lucide-react'

type Presentation = {
  prenom: string
  age: number
  sexe?: string
  profession: string
  motif: string
  contexte?: string
}

export default function SimulateurPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const [chargement, setChargement] = useState(true)
  const [demarrage, setDemarrage] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [conclusions, setConclusions] = useState<SimulationConclusion[]>([])
  const [restantes, setRestantes] = useState(0)

  const [transcript, setTranscript] = useState<SimulationTurn[]>([])
  const [question, setQuestion] = useState('')
  const [attente, setAttente] = useState(false)
  const [examens, setExamens] = useState<SimulationExam[]>([])
  const [examenEnCours, setExamenEnCours] = useState<string | null>(null)

  const [conclusionOuverte, setConclusionOuverte] = useState(false)
  const [choix, setChoix] = useState('')
  const [plan, setPlan] = useState('')
  const [verdict, setVerdict] = useState<any>(null)

  const finDuFil = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      const payload = await fetchProfilePayload()
      if (!payload?.user) {
        router.push('/')
        return
      }
      setChargement(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    finDuFil.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, attente])

  const appeler = async (corps: any) => {
    const res = await fetch('/api/regions/simulateur', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corps),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Erreur du simulateur')
    return data
  }

  const demarrer = async () => {
    setDemarrage(true)
    setErreur(null)
    try {
      const data = await appeler({ action: 'start', module: slug })
      setSessionId(data.sessionId)
      setPresentation(data.presentation)
      setConclusions(data.conclusions || [])
      setRestantes(data.restantes)
      setTranscript([])
      setExamens([])
      setVerdict(null)
      setChoix('')
      setPlan('')
    } catch (error: any) {
      setErreur(error.message)
    } finally {
      setDemarrage(false)
    }
  }

  const poser = async () => {
    const texte = question.trim()
    if (!texte || attente || !sessionId) return
    setQuestion('')
    setTranscript((prev) => [...prev, { role: 'praticien', texte }])
    setAttente(true)
    try {
      const data = await appeler({ action: 'ask', sessionId, question: texte })
      setTranscript((prev) => [...prev, { role: 'patient', texte: data.reponse }])
      setRestantes(data.restantes)
    } catch (error: any) {
      setErreur(error.message)
    } finally {
      setAttente(false)
    }
  }

  const faireExamen = async (code: string) => {
    if (!sessionId || examenEnCours) return
    if (examens.some((e) => e.code === code)) return
    setExamenEnCours(code)
    try {
      const data = await appeler({ action: 'exam', sessionId, code })
      setExamens((prev) => [...prev, data])
    } catch (error: any) {
      setErreur(error.message)
    } finally {
      setExamenEnCours(null)
    }
  }

  const conclure = async () => {
    if (!sessionId || !choix) return
    setAttente(true)
    try {
      const data = await appeler({ action: 'conclude', sessionId, issue: choix, plan })
      setVerdict(data.verdict)
      setConclusionOuverte(false)
    } catch (error: any) {
      setErreur(error.message)
    } finally {
      setAttente(false)
    }
  }

  if (chargement) {
    return (
      <AuthLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href={`/regions/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au parcours
        </Link>

        {erreur && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {!sessionId && <Accueil onStart={demarrer} loading={demarrage} />}

        {sessionId && presentation && (
          <>
            <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="font-semibold text-slate-900">
                      {presentation.prenom}, {presentation.age} ans
                    </h1>
                    <p className="text-sm text-slate-600">{presentation.profession}</p>
                    <p className="mt-1.5 text-sm text-slate-800">
                      <span className="font-medium">Motif : </span>
                      {presentation.motif}
                    </p>
                    {presentation.contexte && (
                      <p className="mt-1 text-sm italic text-slate-500">{presentation.contexte}</p>
                    )}
                  </div>
                </div>
                {!verdict && (
                  <button
                    onClick={() => setConclusionOuverte(true)}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Conclure la consultation
                  </button>
                )}
              </div>
            </header>

            {verdict ? (
              <Debriefing verdict={verdict} onRejouer={demarrer} chargement={demarrage} />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                <section className="flex flex-col rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Stethoscope className="h-4 w-4 text-violet-500" />
                      Anamnèse
                      <span className="ml-auto text-xs font-normal text-slate-400">
                        {restantes} question{restantes > 1 ? 's' : ''} restante
                        {restantes > 1 ? 's' : ''}
                      </span>
                    </h2>
                  </div>

                  <div className="max-h-[52vh] flex-1 space-y-3 overflow-y-auto p-5">
                    {transcript.length === 0 && (
                      <p className="text-sm text-slate-400">
                        Posez vos questions comme en consultation. Le patient ne dira que ce que
                        vous lui demandez.
                      </p>
                    )}
                    {transcript.map((tour, index) => (
                      <div
                        key={index}
                        className={tour.role === 'praticien' ? 'flex justify-end' : 'flex'}
                      >
                        <p
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            tour.role === 'praticien'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {tour.texte}
                        </p>
                      </div>
                    ))}
                    {attente && (
                      <div className="flex">
                        <span className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </span>
                      </div>
                    )}
                    <div ref={finDuFil} />
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 p-4">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void poser()
                        }
                      }}
                      placeholder="Votre question au patient"
                      disabled={attente || restantes <= 0}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none disabled:bg-slate-50"
                    />
                    <button
                      onClick={poser}
                      disabled={attente || !question.trim() || restantes <= 0}
                      className="rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-700 disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-3">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <ClipboardList className="h-4 w-4 text-violet-500" />
                        Examen clinique
                      </h2>
                    </div>
                    <div className="max-h-[40vh] space-y-3 overflow-y-auto p-4">
                      {EXAM_GROUPS.map((groupe) => (
                        <div key={groupe}>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {groupe}
                          </p>
                          <div className="space-y-1">
                            {EXAMS.filter((e) => e.group === groupe).map((examen) => {
                              const fait = examens.some((e) => e.code === examen.code)
                              return (
                                <button
                                  key={examen.code}
                                  onClick={() => faireExamen(examen.code)}
                                  disabled={fait || examenEnCours !== null}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    fait
                                      ? 'cursor-default bg-emerald-50 text-emerald-800'
                                      : 'text-slate-700 hover:bg-violet-50'
                                  }`}
                                >
                                  {examenEnCours === examen.code ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    examen.label
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {examens.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h2 className="mb-3 text-sm font-semibold text-slate-700">Vos résultats</h2>
                      <ol className="space-y-2.5">
                        {examens.map((examen) => (
                          <li key={examen.code} className="text-sm">
                            <p className="font-medium text-slate-800">{examen.libelle}</p>
                            <p className="text-slate-600">{examen.resultat}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {conclusionOuverte && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
              <h2 className="font-semibold text-slate-900">Votre conclusion</h2>
              <p className="mt-1 text-sm text-slate-600">
                Choisissez la feuille de l’arbre de décision qui correspond à ce patient, puis
                écrivez ce que vous feriez aujourd’hui.
              </p>

              <div className="mt-4 space-y-4">
                {(['urgence', 'orienter', 'traiter'] as const).map((ton) => {
                  const items = conclusions.filter((c) => c.ton === ton)
                  if (!items.length) return null
                  const titre =
                    ton === 'urgence'
                      ? 'Urgence'
                      : ton === 'orienter'
                        ? 'Réorienter'
                        : 'Prendre en charge'
                  return (
                    <div key={ton}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {titre}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button
                            key={item.cle}
                            onClick={() => setChoix(item.cle)}
                            className={`w-full rounded-lg border p-2.5 text-left text-sm ${
                              choix === item.cle
                                ? 'border-violet-400 bg-violet-50 text-slate-900'
                                : 'border-slate-200 text-slate-700 hover:border-violet-300'
                            }`}
                          >
                            {item.titre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={4}
                placeholder="Ce que vous faites aujourd’hui, ce que vous dites au patient, ce que vous prévoyez"
                className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-violet-400 focus:outline-none"
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setConclusionOuverte(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Continuer l’examen
                </button>
                <button
                  onClick={conclure}
                  disabled={!choix || attente}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
                >
                  {attente && <Loader2 className="h-4 w-4 animate-spin" />}
                  Valider ma conclusion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

function Accueil({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-slate-900">Simulateur de consultation</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Un patient est tiré au sort parmi les tableaux du parcours. Vous menez l’anamnèse en posant
        vos questions, il répond comme le ferait un patient : il ne dit que ce qu’on lui demande.
        Vous décidez ensuite des examens à réaliser, et vous concluez quand vous estimez en savoir
        assez.
      </p>
      <ul className="mt-5 max-w-2xl space-y-2 text-sm text-slate-600">
        <li className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
          Les résultats d’examen sont fixés à l’avance : un test donne le même résultat à chaque
          fois, et deux praticiens trouvent la même chose.
        </li>
        <li className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
          Votre conclusion est corrigée sur la feuille de l’arbre de décision attendue, pas sur une
          appréciation.
        </li>
        <li className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
          Le débriefing vous dit ce qui a manqué, y compris la question que vous n’avez pas posée.
        </li>
      </ul>
      <button
        onClick={onStart}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Recevoir un patient
      </button>
    </div>
  )
}

function Debriefing({
  verdict,
  onRejouer,
  chargement,
}: {
  verdict: any
  onRejouer: () => void
  chargement: boolean
}) {
  const juste = verdict.juste
  const danger = !juste && verdict.attendu?.ton === 'urgence'

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border p-6 ${
          juste
            ? 'border-emerald-300 bg-emerald-50'
            : danger
              ? 'border-rose-300 bg-rose-50'
              : 'border-amber-300 bg-amber-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {juste ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{verdict.commentaire}</h2>
            <p className="mt-1.5 text-sm text-slate-700">
              Tableau du patient : <strong>{verdict.tableau}</strong>
            </p>
            <p className="text-sm text-slate-700">
              Conclusion attendue : <strong>{verdict.attendu?.titre || 'non déterminée'}</strong>
              {!juste && verdict.choisi && <> · la vôtre : {verdict.choisi.titre}</>}
            </p>
          </div>
        </div>
      </div>

      {verdict.examensManques?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Examens décisifs que vous n’avez pas faits
          </h3>
          <ul className="mt-2 space-y-1">
            {verdict.examensManques.map((examen: any) => (
              <li key={examen.code} className="flex gap-2 text-sm text-slate-600">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                {examen.libelle}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.debrief && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Débriefing</h3>
          <div className="space-y-3 text-sm text-slate-700">
            {String(verdict.debrief)
              .split('\n')
              .filter((paragraphe) => paragraphe.trim())
              .map((paragraphe, index) => (
                <p key={index}>{paragraphe}</p>
              ))}
          </div>
        </div>
      )}

      {verdict.enseignement && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-violet-900">Ce que ce cas enseigne</h3>
          <p className="text-sm text-slate-700">{verdict.enseignement}</p>
        </div>
      )}

      <button
        onClick={onRejouer}
        disabled={chargement}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {chargement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Recevoir un autre patient
      </button>
    </div>
  )
}
