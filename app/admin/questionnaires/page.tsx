'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import { supabase } from '@/lib/supabase'
import { LIBELLES_LICENCE, type Questionnaire, type QuestionnaireItem } from '@/lib/questionnaires'
import { AlertTriangle, Check, ChevronDown, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'

/**
 * Administration des questionnaires.
 *
 * Elle existe pour une raison précise : le jour où une licence arrive avec la
 * traduction officiellement validée, il doit être possible de remplacer les
 * libellés sans écrire une migration ni attendre un déploiement. C'est aussi
 * l'endroit où se suit l'état des démarches, qui se perdrait ailleurs.
 */
export default function AdminQuestionnairesPage() {
  const router = useRouter()
  const [chargement, setChargement] = useState(true)
  const [liste, setListe] = useState<Questionnaire[]>([])
  const [items, setItems] = useState<Record<string, QuestionnaireItem[]>>({})
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [brouillons, setBrouillons] = useState<Record<string, string>>({})
  const [enregistre, setEnregistre] = useState<string | null>(null)
  const [occupe, setOccupe] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { data: profil } = await supabase.auth.getUser()
        if (!profil?.user) {
          router.push('/')
          return
        }
        const { data: p } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', profil.user.id)
          .maybeSingle()
        if (p?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        const { data } = await supabase
          .from('questionnaires')
          .select('*')
          .order('order_index', { ascending: true })
        setListe((data || []) as Questionnaire[])
      } finally {
        setChargement(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deplier = async (questionnaire: Questionnaire) => {
    if (ouvert === questionnaire.id) {
      setOuvert(null)
      return
    }
    setOuvert(questionnaire.id)
    if (items[questionnaire.id]) return

    const { data } = await supabase
      .from('questionnaire_items')
      .select('*')
      .eq('questionnaire_id', questionnaire.id)
      .order('order_index', { ascending: true })

    const lignes = (data || []) as QuestionnaireItem[]
    setItems((prev) => ({ ...prev, [questionnaire.id]: lignes }))
    setBrouillons((prev) => ({
      ...prev,
      ...Object.fromEntries(lignes.map((item) => [item.id, item.label])),
    }))
  }

  const majQuestionnaire = async (id: string, champs: Partial<Questionnaire>) => {
    setOccupe(id)
    const { error } = await supabase.from('questionnaires').update(champs).eq('id', id)
    setOccupe(null)
    if (error) {
      alert('Échec de la mise à jour : ' + error.message)
      return
    }
    setListe((prev) => prev.map((q) => (q.id === id ? { ...q, ...champs } : q)))
  }

  const enregistrerItem = async (item: QuestionnaireItem) => {
    const label = (brouillons[item.id] || '').trim()
    if (!label || label === item.label) return
    setOccupe(item.id)
    const { error } = await supabase.from('questionnaire_items').update({ label }).eq('id', item.id)
    setOccupe(null)
    if (error) {
      alert('Échec de l’enregistrement : ' + error.message)
      return
    }
    setItems((prev) => ({
      ...prev,
      [item.questionnaire_id]: (prev[item.questionnaire_id] || []).map((i) =>
        i.id === item.id ? { ...i, label } : i
      ),
    }))
    setEnregistre(item.id)
    setTimeout(() => setEnregistre(null), 1500)
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

  const aRegulariser = liste.filter(
    (q) => q.licence_statut !== 'libre' && q.licence_statut !== 'obtenue'
  )

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <AdminBackButton />

        <header>
          <h1 className="text-2xl font-bold text-slate-900">Questionnaires</h1>
          <p className="mt-1.5 text-slate-600">
            Suivi des licences et formulation des items. Remplacer un libellé par celui de la
            traduction officielle se fait ici, sans migration ni déploiement.
          </p>
        </header>

        {aRegulariser.length > 0 && (
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {aRegulariser.length} questionnaire{aRegulariser.length > 1 ? 's' : ''} en ligne dont
              la licence n’est pas réglée pour un usage commercial :{' '}
              {aRegulariser.map((q) => q.code).join(', ')}. Tant que ce n’est pas fait, les items
              reproduits ici le sont sans accord de leur détenteur.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {liste.map((questionnaire) => (
            <article key={questionnaire.id} className="rounded-2xl border border-slate-200 bg-white">
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                    {questionnaire.code}
                  </span>
                  <h2 className="font-semibold text-slate-900">{questionnaire.name}</h2>
                  {occupe === questionnaire.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-600">État de la licence</span>
                    <select
                      value={questionnaire.licence_statut}
                      onChange={(e) =>
                        majQuestionnaire(questionnaire.id, {
                          licence_statut: e.target.value as Questionnaire['licence_statut'],
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      {Object.entries(LIBELLES_LICENCE).map(([valeur, libelle]) => (
                        <option key={valeur} value={valeur}>
                          {libelle}
                        </option>
                      ))}
                    </select>
                    {questionnaire.licence && (
                      <span className="mt-1 block text-xs text-slate-500">
                        Détenteur : {questionnaire.licence}
                        {questionnaire.licence_url && (
                          <>
                            {' '}
                            <a
                              href={questionnaire.licence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline"
                            >
                              démarche
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </span>
                    )}
                  </label>

                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={questionnaire.traduction_officielle}
                        onChange={(e) =>
                          majQuestionnaire(questionnaire.id, {
                            traduction_officielle: e.target.checked,
                          })
                        }
                      />
                      <span className="text-slate-700">
                        Formulation officiellement validée
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={questionnaire.status === 'published'}
                        onChange={(e) =>
                          majQuestionnaire(questionnaire.id, {
                            status: e.target.checked ? 'published' : 'draft',
                          })
                        }
                      />
                      <span className="text-slate-700">Visible des abonnés</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => deplier(questionnaire)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700"
                >
                  {ouvert === questionnaire.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Formulation des items
                </button>
              </div>

              {ouvert === questionnaire.id && (
                <div className="space-y-2 border-t border-slate-100 p-5">
                  {(items[questionnaire.id] || []).map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <span className="mt-2 w-6 shrink-0 text-right text-xs text-slate-400">
                        {item.order_index}
                      </span>
                      <textarea
                        value={brouillons[item.id] ?? item.label}
                        onChange={(e) =>
                          setBrouillons((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onBlur={() => enregistrerItem(item)}
                        rows={2}
                        className="flex-1 rounded-lg border border-slate-200 p-2 text-sm"
                      />
                      <span className="mt-2 w-4 shrink-0">
                        {occupe === item.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                        {enregistre === item.id && <Check className="h-4 w-4 text-emerald-600" />}
                      </span>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-slate-400">
                    L’enregistrement se fait en quittant le champ. Les échelles de réponse ne sont
                    pas modifiables ici : changer une valeur changerait le score.
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
