'use client'

import { useState } from 'react'
import { X, Loader2, ClipboardCheck } from 'lucide-react'
import {
  CANAUX_CONTACT,
  CANAL_LABELS,
  CHURN_REASONS,
  type CanalContact,
} from '@/lib/customer-tracking'

export type CibleConsignation = { id: string; email: string; full_name?: string | null }

type Action = CanalContact | 'motif_depart'

/**
 * Consigner ce qui s'est passé hors du module.
 *
 * Le rattrapage de la migration a reconstitué les dates portées par
 * `profiles`, mais rien des relances faites à la main avant sa mise en
 * service, ni des appels, ni des motifs de départ d'avant. Sans cette
 * saisie, la fiche affirme « jamais relancé » de quelqu'un que vous avez
 * relancé trois fois : elle ne se contente pas d'ignorer, elle induit en
 * erreur, et le filtre de travail le remonte en tête des comptes à contacter.
 */
export default function ConsignerAction({
  cibles,
  motifDepartPossible,
  onClose,
  onDone,
}: {
  cibles: CibleConsignation[]
  motifDepartPossible?: boolean
  onClose: () => void
  onDone: (resume: string) => void
}) {
  const [action, setAction] = useState<Action>('email')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const estMotif = action === 'motif_depart'
  const pret = estMotif ? Boolean(reason || comment.trim()) : true

  const enregistrer = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const res = await fetch('/api/admin/customers/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: cibles.map((c) => c.id),
          action,
          // Midi plutôt que minuit : une date saisie sans heure basculerait
          // la veille pour tout fuseau à l'est de UTC.
          date: `${date}T12:00:00`,
          subject: subject || undefined,
          reason: estMotif ? reason || undefined : undefined,
          comment: comment || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "L'enregistrement a échoué")
      onDone(
        estMotif
          ? `Motif de départ renseigné pour ${json.traites} compte(s).`
          : `${json.traites} action(s) consignée(s).`
      )
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" /> Consigner une action
            </h3>
            <p className="text-slate-300 text-xs mt-0.5">
              {cibles.length === 1 ? cibles[0].email : `${cibles.length} comptes sélectionnés`}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-500">
            À utiliser pour ce qui s'est passé en dehors du module : un email parti de votre boîte,
            un appel, une réponse reçue ailleurs. Rien n'est envoyé, la chronologie est seulement
            mise à jour.
          </p>

          <div className="space-y-2">
            {CANAUX_CONTACT.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAction(c)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  action === c
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
              >
                <span className="font-semibold text-slate-800">
                  {CANAL_LABELS[c].emoji} {CANAL_LABELS[c].label}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">{CANAL_LABELS[c].description}</span>
              </button>
            ))}

            {motifDepartPossible && (
              <button
                type="button"
                onClick={() => setAction('motif_depart')}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  estMotif ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <span className="font-semibold text-slate-800">🚪 Motif de départ</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Pour les résiliations antérieures au module : le motif saisi dans Stripe n'a jamais
                  été conservé, il est perdu et ne peut être que ressaisi.
                </span>
              </button>
            )}
          </div>

          {estMotif && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Motif</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">Non renseigné</option>
                {Object.entries(CHURN_REASONS).map(([cle, libelle]) => (
                  <option key={cle} value={cle}>
                    {libelle}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            {!estMotif && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Objet (facultatif)
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Relance après essai"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {estMotif ? 'Ce qu\'il vous a dit' : 'Ce qui a été dit ou écrit'} (facultatif)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>

          {action === 'email' && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Cet email comptera comme une relance dans les compteurs et les filtres. Il restera
              sans statut d'ouverture : rien ne peut être mesuré d'un message parti d'ailleurs.
            </p>
          )}

          {erreur && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erreur}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={envoi || !pret}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
