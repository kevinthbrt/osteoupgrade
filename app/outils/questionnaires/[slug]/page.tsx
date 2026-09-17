'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { hasOsteoupgrade } from '@/lib/entitlements'
import {
  calculer,
  LIBELLES_LICENCE,
  TONS_NIVEAU,
  type Questionnaire,
  type QuestionnaireItem,
} from '@/lib/questionnaires'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
} from 'lucide-react'

export default function PassationPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const [chargement, setChargement] = useState(true)
  const [autorise, setAutorise] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [items, setItems] = useState<QuestionnaireItem[]>([])
  // On retient la position choisie, pas la valeur : deux options peuvent
  // partager la même valeur, le neuvième item du STarT Back par exemple, où
  // « pas du tout » et « modérément » valent zéro tous les deux. Les valeurs
  // pour le calcul se déduisent des positions juste en dessous.
  const [choix, setChoix] = useState<Record<string, number>>({})
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (!slug) return
    void (async () => {
      try {
        const payload = await fetchProfilePayload()
        if (!payload?.user) {
          router.push('/')
          return
        }
        setAutorise(hasOsteoupgrade(payload.profile))

        const { data: q } = await supabase
          .from('questionnaires')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()
        if (!q) return
        setQuestionnaire(q as Questionnaire)

        const { data: lignes } = await supabase
          .from('questionnaire_items')
          .select('*')
          .eq('questionnaire_id', q.id)
          .order('order_index', { ascending: true })
        setItems((lignes || []) as QuestionnaireItem[])
      } catch (error) {
        console.error('Chargement du questionnaire:', error)
      } finally {
        setChargement(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

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
    () => (questionnaire ? calculer(questionnaire, items, reponses) : null),
    [questionnaire, items, reponses]
  )

  const repondus = Object.keys(reponses).length
  const complet = repondus === items.length

  const copier = async () => {
    if (!resultat) return
    try {
      await navigator.clipboard.writeText(resultat.resume)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Le presse-papiers peut être refusé : le résumé reste lisible à l'écran.
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

  if (!questionnaire) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">Questionnaire introuvable.</p>
          <Link href="/outils/questionnaires" className="mt-4 inline-block text-sm font-semibold text-violet-700">
            Retour aux questionnaires
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (!autorise) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">
            Les questionnaires sont réservés aux abonnés OsteoUpgrade.
          </p>
          <Link href="/settings/subscription" className="mt-4 inline-block text-sm font-semibold text-violet-700">
            Voir les offres
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const licenceAsignaler =
    questionnaire.licence_statut !== 'libre' && questionnaire.licence_statut !== 'obtenue'

  return (
    <AuthLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-10">
        <Link
          href="/outils/questionnaires"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Questionnaires
        </Link>

        <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
          <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
            {questionnaire.code}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{questionnaire.name}</h1>
          <p className="mt-2 text-slate-700">{questionnaire.purpose}</p>
          {questionnaire.instructions && (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-slate-600">
              {questionnaire.instructions}
            </p>
          )}
        </header>

        {(!questionnaire.traduction_officielle || licenceAsignaler) && (
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              {!questionnaire.traduction_officielle && (
                <p>
                  La formulation ci-dessous est fidèle à l'instrument, mais ce n'est pas la
                  traduction officiellement validée. Le score et les seuils sont ceux de la
                  version publiée ; pour un usage de recherche ou d'expertise, utilisez la
                  version officielle.
                </p>
              )}
              {licenceAsignaler && (
                <p>
                  {LIBELLES_LICENCE[questionnaire.licence_statut]}
                  {questionnaire.licence ? ` auprès de ${questionnaire.licence}` : ''}.
                  {questionnaire.licence_url && (
                    <>
                      {' '}
                      <a
                        href={questionnaire.licence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                      >
                        Faire la démarche
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id}>
              {item.aide && (
                <p className="mb-1.5 mt-4 text-sm font-semibold text-violet-700">{item.aide}</p>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">
                  <span className="mr-2 text-slate-400">{index + 1}.</span>
                  {item.label}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {item.echelle.map((option, position) => {
                    const actif = choix[item.id] === position
                    return (
                      <button
                        key={position}
                        onClick={() => setChoix((prev) => ({ ...prev, [item.id]: position }))}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          actif
                            ? 'border-violet-400 bg-violet-50 font-medium text-violet-900'
                            : 'border-slate-200 text-slate-600 hover:border-violet-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                  {choix[item.id] !== undefined && (
                    <button
                      onClick={() =>
                        setChoix((prev) => {
                          const suite = { ...prev }
                          delete suite[item.id]
                          return suite
                        })
                      }
                      className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
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

          {resultat && repondus > 0 && (
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">
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
                <div className={`mt-3 rounded-xl border p-4 ${TONS_NIVEAU[resultat.niveau.ton]}`}>
                  <p className="font-semibold">{resultat.niveau.libelle}</p>
                  <p className="mt-1 text-sm opacity-90">{resultat.niveau.conduite}</p>
                </div>
              )}

              <button
                onClick={copier}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {copie ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copie ? 'Copié' : 'Copier le résultat'}
              </button>
            </div>
          )}
        </div>

        {questionnaire.source_citation && (
          <footer className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Source</p>
            <p>{questionnaire.source_citation}</p>
            {questionnaire.source_url && (
              <a
                href={questionnaire.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-medium text-sky-700 hover:underline"
              >
                Voir la source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Aucune réponse n'est enregistrée. Rien de ce qui est saisi ici ne quitte votre
              navigateur, et rien ne permet d'identifier un patient.
            </p>
          </footer>
        )}
      </div>
    </AuthLayout>
  )
}
