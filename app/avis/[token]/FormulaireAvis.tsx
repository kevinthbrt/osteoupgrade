'use client'

import { useState } from 'react'

/**
 * Formulaire de réponse : un motif à cocher (optionnel), une note (quand
 * l'enquête en demande une) et un champ libre. Volontairement court : la
 * longueur du formulaire est le premier motif d'abandon.
 */
export default function FormulaireAvis({
  token,
  choices,
  askRating,
}: {
  token: string
  choices: string[]
  askRating: boolean
}) {
  const [choice, setChoice] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const vide = !choice && !rating && !answer.trim()

  const envoyer = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/avis/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice, rating, answer }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "L'envoi a échoué")
      setEnvoye(true)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  if (envoye) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">🙏</div>
        <p className="text-slate-700 font-semibold">Merci, c'est enregistré.</p>
        <p className="text-slate-500 text-sm mt-2">
          Votre retour est lu par l'équipe. Il oriente directement ce que nous corrigeons ensuite.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {choices.length > 0 && (
        <div className="space-y-2">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(choice === c ? null : c)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                choice === c
                  ? 'border-violet-500 bg-violet-50 text-violet-900 font-semibold'
                  : 'border-slate-200 hover:border-violet-300 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {askRating && (
        <div>
          <p className="text-sm text-slate-600 mb-2">Votre satisfaction globale</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  rating === n
                    ? 'border-violet-500 bg-violet-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-violet-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Pas du tout satisfait</span>
            <span>Très satisfait</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-600 mb-2">
          Ce que vous voulez ajouter (facultatif)
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Dites-nous tout, même ce qui fâche."
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="button"
        onClick={envoyer}
        disabled={envoi || vide}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white font-semibold text-sm disabled:opacity-50 transition-all"
      >
        {envoi ? 'Envoi...' : 'Envoyer ma réponse'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Votre réponse reste interne et ne sera jamais publiée.
      </p>
    </div>
  )
}
