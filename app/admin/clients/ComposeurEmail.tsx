'use client'

import { useState } from 'react'
import { Send, X, Loader2, MessageSquareQuote, Mail } from 'lucide-react'
import {
  EMAIL_CATEGORIES,
  EMAIL_CATEGORY_LABELS,
  SURVEY_DEFINITIONS,
  SURVEY_KINDS,
  type EmailCategory,
  type SurveyKind,
} from '@/lib/customer-tracking'

export type Destinataire = { id: string; email: string; full_name?: string | null }

/**
 * Composeur d'email de la fiche client.
 *
 * Deux modes distincts plutôt qu'un éditeur libre :
 *   * un message écrit à la main, avec trois champs de fusion ;
 *   * une enquête, qui crée un lien de réponse personnel par destinataire.
 *
 * Le second n'est pas un simple gabarit : c'est lui qui produit les réponses
 * remontées dans l'onglet « Réponses ». Un email de relance écrit à la main
 * qui poserait la même question ne serait jamais rattaché à rien.
 */
export default function ComposeurEmail({
  destinataires,
  suggestion,
  onClose,
  onSent,
}: {
  destinataires: Destinataire[]
  suggestion?: SurveyKind | null
  onClose: () => void
  onSent: (resume: string) => void
}) {
  const [mode, setMode] = useState<'message' | 'enquete'>(suggestion ? 'enquete' : 'message')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<EmailCategory>('relance')
  const [surveyKind, setSurveyKind] = useState<SurveyKind>(suggestion || 'satisfaction')
  const [question, setQuestion] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const def = SURVEY_DEFINITIONS[surveyKind]
  const pret = mode === 'enquete' ? true : Boolean(subject.trim() && message.trim())

  const envoyer = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const res = await fetch('/api/admin/customers/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: destinataires.map((d) => d.id),
          mode,
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
          category,
          surveyKind: mode === 'enquete' ? surveyKind : undefined,
          question: mode === 'enquete' ? question.trim() || undefined : undefined,
          ctaLabel: mode === 'message' ? ctaLabel : undefined,
          ctaUrl: mode === 'message' ? ctaUrl : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "L'envoi a échoué")

      const echecs = json.echecs?.length
        ? ` ${json.echecs.length} échec(s) : ${json.echecs.map((e: any) => e.email).join(', ')}`
        : ''
      onSent(`${json.envoyes}/${json.total} email(s) envoyé(s).${echecs}`)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Écrire aux clients</h3>
            <p className="text-violet-100 text-xs mt-0.5">
              {destinataires.length === 1
                ? destinataires[0].email
                : `${destinataires.length} destinataires sélectionnés`}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('message')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                mode === 'message'
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              <Mail className="h-4 w-4" /> Message
            </button>
            <button
              onClick={() => setMode('enquete')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                mode === 'enquete'
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              <MessageSquareQuote className="h-4 w-4" /> Enquête
            </button>
          </div>

          {mode === 'enquete' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Question posée</label>
                <select
                  value={surveyKind}
                  onChange={(e) => setSurveyKind(e.target.value as SurveyKind)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {SURVEY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {SURVEY_DEFINITIONS[k].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-sm text-slate-700 space-y-2">
                <p className="font-semibold text-violet-900">{question.trim() || def.question}</p>
                {def.choices.length > 0 && (
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                    {def.choices.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
                {def.askRating && <p className="text-xs text-slate-600">Une note de 1 à 5 est demandée.</p>}
                <p className="text-xs text-slate-500">
                  Chaque destinataire reçoit un lien personnel. La réponse ne demande aucune connexion et
                  remonte dans l'onglet « Réponses ».
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Reformuler la question (facultatif)
                </label>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={def.question}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Remplacer le texte d'introduction (facultatif)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={def.intro}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sujet</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Une question sur votre essai, {{prenom}}"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EmailCategory)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {EMAIL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {EMAIL_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder={"Bonjour,\n\nVous avez essayé MyOsteoflow le mois dernier..."}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Champs de fusion disponibles : <code>{'{{prenom}}'}</code>, <code>{'{{nom}}'}</code>,{' '}
                  <code>{'{{offre}}'}</code>. Le gabarit maison (bandeau violet, pied de page, lien de
                  désinscription) est ajouté automatiquement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Bouton (facultatif)
                  </label>
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Reprendre mon abonnement"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lien du bouton</label>
                  <input
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://www.osteo-upgrade.fr/settings"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {erreur && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erreur}</p>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {destinataires.length > 1
              ? `Un email distinct part vers chacun des ${destinataires.length} destinataires.`
              : 'Envoi transactionnel, avec suivi des ouvertures.'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Annuler
            </button>
            <button
              onClick={envoyer}
              disabled={envoi || !pret}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
