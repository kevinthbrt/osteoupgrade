'use client'

import { useMemo, useState } from 'react'
import {
  calculer,
  LIBELLES_LICENCE,
  TONS_NIVEAU,
  type Questionnaire,
  type QuestionnaireItem,
} from '@/lib/questionnaires'
import { AlertTriangle, Check, ChevronDown, ChevronRight, Copy, ExternalLink, RotateCcw } from 'lucide-react'

type Props = {
  questionnaire: Questionnaire
  items: QuestionnaireItem[]
  /** Dans un chapitre, le questionnaire s'ouvre replié pour ne pas couper la lecture. */
  replie?: boolean
  note?: string | null
}

/**
 * Passation d'un questionnaire, avec calcul en direct.
 *
 * Rien n'est enregistré : le score s'affiche, se copie en une ligne sans donnée
 * identifiante, et disparaît avec la page. Une plateforme de formation n'a pas
 * à devenir un dossier patient.
 */
export default function Passation({ questionnaire, items, replie = false, note }: Props) {
  const [ouvert, setOuvert] = useState(!replie)
  // On retient la position choisie, pas la valeur : deux options peuvent
  // partager la même valeur, le neuvième item du STarT Back par exemple, où
  // « pas du tout » et « modérément » valent zéro tous les deux.
  const [choix, setChoix] = useState<Record<string, number>>({})
  const [copie, setCopie] = useState(false)

  const reponses = useMemo(() => {
    const valeurs: Record<string, number> = {}
    for (const item of items) {
      const position = choix[item.id]
      if (position !== undefined && item.echelle[position]) {
        valeurs[item.id] = item.echelle[position].valeur
      }
    }
    return valeurs
  }, [items, choix])

  const resultat = useMemo(
    () => calculer(questionnaire, items, reponses),
    [questionnaire, items, reponses]
  )

  const repondus = Object.keys(reponses).length
  const complet = repondus === items.length
  const licenceAsignaler =
    questionnaire.licence_statut !== 'libre' && questionnaire.licence_statut !== 'obtenue'

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(resultat.resume)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Le presse-papiers peut être refusé : le résumé reste lisible à l'écran.
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/40">
      <button
        onClick={() => setOuvert(!ouvert)}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        {ouvert ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-violet-500" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-500" />
        )}
        <span className="flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
              {questionnaire.code}
            </span>
            <span className="font-semibold text-slate-900">{questionnaire.name}</span>
            {questionnaire.duration_minutes && (
              <span className="text-xs text-slate-400">{questionnaire.duration_minutes} min</span>
            )}
          </span>
          <span className="mt-1 block text-sm text-slate-600">{note || questionnaire.purpose}</span>
        </span>
      </button>

      {ouvert && (
        <div className="border-t border-violet-100 p-5">
          {questionnaire.instructions && (
            <p className="mb-4 rounded-xl bg-white p-3 text-sm text-slate-600">
              {questionnaire.instructions}
            </p>
          )}

          {(!questionnaire.traduction_officielle || licenceAsignaler) && (
            <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-1">
                {!questionnaire.traduction_officielle && (
                  <p>
                    Formulation fidèle à l’instrument, mais ce n’est pas la traduction
                    officiellement validée. Le score et les seuils sont ceux de la version publiée.
                  </p>
                )}
                {licenceAsignaler && (
                  <p>
                    {LIBELLES_LICENCE[questionnaire.licence_statut]}
                    {questionnaire.licence ? ` auprès de ${questionnaire.licence}` : ''}.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id}>
                {item.aide && (
                  <p className="mb-1.5 mt-3 text-sm font-semibold text-violet-700">{item.aide}</p>
                )}
                <div className="rounded-xl bg-white p-3.5">
                  <p className="text-sm font-medium text-slate-900">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    {item.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.echelle.map((option, position) => (
                      <button
                        key={position}
                        onClick={() => setChoix((prev) => ({ ...prev, [item.id]: position }))}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                          choix[item.id] === position
                            ? 'border-violet-400 bg-violet-50 font-medium text-violet-900'
                            : 'border-slate-200 text-slate-600 hover:border-violet-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    {choix[item.id] !== undefined && (
                      <button
                        onClick={() =>
                          setChoix((prev) => {
                            const suite = { ...prev }
                            delete suite[item.id]
                            return suite
                          })
                        }
                        className="px-1.5 py-1 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {repondus} / {items.length} rempli{repondus > 1 ? 's' : ''}
              </p>
              {repondus > 0 && (
                <button
                  onClick={() => setChoix({})}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Recommencer
                </button>
              )}
            </div>

            {repondus > 0 && (
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-900">
                  {resultat.score}
                  {resultat.unite === '%' ? ' %' : ` / ${resultat.sur}`}
                </p>
                {resultat.sousScores.map((sous) => (
                  <p key={sous.cle} className="text-sm text-slate-500">
                    {sous.libelle} : {sous.valeur} sur {sous.sur}
                  </p>
                ))}

                {!complet && questionnaire.methode !== 'odi' && (
                  <p className="mt-2 text-xs text-amber-700">
                    Score partiel : les items non remplis comptent pour zéro.
                  </p>
                )}

                {resultat.niveau && (
                  <div className={`mt-3 rounded-xl border p-3.5 ${TONS_NIVEAU[resultat.niveau.ton]}`}>
                    <p className="text-sm font-semibold">{resultat.niveau.libelle}</p>
                    <p className="mt-1 text-sm opacity-90">{resultat.niveau.conduite}</p>
                  </div>
                )}

                <button
                  onClick={copier}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {copie ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copie ? 'Copié' : 'Copier le résultat'}
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Rien n’est enregistré : le résultat disparaît avec la page.
                </p>
              </div>
            )}
          </div>

          {questionnaire.source_citation && (
            <p className="mt-3 text-xs text-slate-500">
              {questionnaire.source_citation}
              {questionnaire.source_url && (
                <>
                  {' '}
                  <a
                    href={questionnaire.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline"
                  >
                    source
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
