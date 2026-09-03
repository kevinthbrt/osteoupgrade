'use client'

import { useState } from 'react'
import { Loader2, Check, ArrowRight } from 'lucide-react'
import type { Utm } from '@/lib/utm'

type Props = {
  slug: string
  title: string
  text?: string
  buttonLabel?: string
  askName: boolean
  consentText?: string
  successMessage?: string
  utm: Utm
  visitorId: string
  /** Remonte l'échéance individuelle renvoyée par le serveur (mode relatif). */
  onOptin?: (deadlineAt: string | null) => void
}

export default function OptinForm({
  slug,
  title,
  text,
  buttonLabel,
  askName,
  consentText,
  successMessage,
  utm,
  visitorId,
  onOptin,
}: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('loading')

    try {
      const res = await fetch('/api/funnels/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          email: email.trim(),
          full_name: askName ? fullName.trim() : undefined,
          utm,
          visitor_id: visitorId,
          landing_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Inscription impossible')

      setStatus('done')
      onOptin?.(data.deadline_at ?? null)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-6 w-6 text-white" />
        </div>
        <p className="font-semibold text-emerald-900">
          {successMessage || 'C’est noté ! Vérifiez votre boîte mail.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h3>
      {text && <p className="mt-2 text-slate-600">{text}</p>}

      <form onSubmit={submit} className="mt-5 space-y-3">
        {askName && (
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre prénom"
            autoComplete="given-name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre adresse email"
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="flow-gradient flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {buttonLabel || 'Je m’inscris'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        {consentText ||
          'En validant, vous acceptez de recevoir nos emails. Désinscription en un clic dans chaque message.'}
      </p>
    </div>
  )
}
