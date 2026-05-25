'use client'

import { useState } from 'react'
import { X, Bug, Send, CheckCircle } from 'lucide-react'

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  if (dismissed) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(false)
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      setTimeout(() => {
        setShowModal(false)
        setSent(false)
        setMessage('')
        setEmail('')
      }, 2500)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="w-full bg-amber-400 text-slate-900 py-2 px-4 flex items-center gap-3 text-sm font-medium z-[60] relative">
        <div className="flex-1 text-center">
          <span className="font-bold">Bêta</span> — La plateforme est en phase de test active. Des améliorations arrivent régulièrement.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-slate-900/10 hover:bg-slate-900/20 px-3 py-1 rounded-lg transition-colors text-xs font-semibold whitespace-nowrap"
          >
            <Bug className="h-3.5 w-3.5" />
            Signaler un problème
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="hover:opacity-60 transition-opacity p-0.5"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Signaler un problème</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-slate-900">Merci pour votre signalement !</p>
                <p className="text-sm text-slate-500">Nous vous répondrons dans les meilleurs délais.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Votre email <span className="text-slate-400 font-normal">(optionnel, pour vous répondre)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description du problème <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Décrivez le problème rencontré, la page concernée, ce que vous faisiez..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">
                    Une erreur est survenue. Vous pouvez aussi écrire directement à{' '}
                    <a href="mailto:contact@osteo-upgrade.fr" className="underline">contact@osteo-upgrade.fr</a>.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Envoi en cours...' : 'Envoyer le signalement'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
