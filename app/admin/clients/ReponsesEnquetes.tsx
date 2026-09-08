'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquareQuote } from 'lucide-react'
import { SURVEY_DEFINITIONS, type SurveyKind } from '@/lib/customer-tracking'
import { planLabel } from '@/lib/entitlements'

/**
 * Toutes les réponses aux enquêtes, dans l'ordre d'arrivée.
 *
 * Séparé de la liste de comptes à dessein : « pourquoi partent-ils ? » est
 * une question qui se lit sur l'ensemble des réponses, pas fiche par fiche.
 * Le regroupement par motif en tête donne la réponse en un coup d'œil.
 */
export default function ReponsesEnquetes() {
  const [enquetes, setEnquetes] = useState<any[]>([])
  const [chargement, setChargement] = useState(true)
  const [statut, setStatut] = useState<'repondu' | 'en_attente'>('repondu')

  useEffect(() => {
    let annule = false
    setChargement(true)
    fetch(`/api/admin/customers/surveys?statut=${statut}`)
      .then((r) => (r.ok ? r.json() : { enquetes: [] }))
      .then((j) => {
        if (!annule) setEnquetes(j.enquetes || [])
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [statut])

  const motifs: Record<string, number> = {}
  for (const e of enquetes) {
    if (e.choice) motifs[e.choice] = (motifs[e.choice] || 0) + 1
  }
  const motifsTries = Object.entries(motifs).sort((a, b) => b[1] - a[1])

  const notes = enquetes.map((e) => e.rating).filter((n): n is number => typeof n === 'number')
  const moyenne = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : null

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['repondu', 'en_attente'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatut(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              statut === s
                ? 'bg-violet-600 text-white border-violet-500'
                : 'bg-white/70 text-slate-700 border-violet-200/60'
            }`}
          >
            {s === 'repondu' ? 'Réponses reçues' : 'Sans réponse'}
          </button>
        ))}
      </div>

      {statut === 'repondu' && (motifsTries.length > 0 || moyenne) && (
        <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Ce qui revient le plus
          </p>
          {moyenne && (
            <p className="text-sm text-slate-700 mb-3">
              Satisfaction moyenne : <span className="font-bold">{moyenne}/5</span> sur {notes.length} note(s)
            </p>
          )}
          <div className="space-y-1.5">
            {motifsTries.map(([motif, n]) => (
              <div key={motif} className="flex items-center gap-3">
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center px-2"
                    style={{ width: `${Math.max(12, (n / motifsTries[0][1]) * 100)}%` }}
                  >
                    <span className="text-xs text-white font-semibold truncate">{motif}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700 w-8 text-right">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chargement ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : enquetes.length === 0 ? (
        <p className="text-center text-slate-500 py-12">
          {statut === 'repondu'
            ? "Aucune réponse pour l'instant. Envoyez une enquête depuis une fiche client ou une sélection."
            : 'Aucune enquête en attente de réponse.'}
        </p>
      ) : (
        <div className="space-y-3">
          {enquetes.map((e) => (
            <div key={e.id} className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {e.profil?.full_name || e.email}
                  </p>
                  <p className="text-xs text-slate-400">
                    {e.email}
                    {e.profil ? ` · ${planLabel(e.profil.plan)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(e.responded_at || e.sent_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <p className="text-xs text-violet-600 font-semibold mt-3 inline-flex items-center gap-1.5">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                {SURVEY_DEFINITIONS[e.kind as SurveyKind]?.label || e.kind}
              </p>
              <p className="text-sm text-slate-500 mt-1">{e.question}</p>

              {e.choice && (
                <p className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800 text-sm font-semibold">
                  {e.choice}
                </p>
              )}
              {typeof e.rating === 'number' && (
                <p className="mt-2 text-sm text-slate-700">Note : {e.rating}/5</p>
              )}
              {e.answer && (
                <p className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  « {e.answer} »
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
