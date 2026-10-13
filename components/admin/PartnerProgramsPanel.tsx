'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Loader2, Copy, Check } from 'lucide-react'
import { OFFERS, formatAmount, PARTNER_ANNUAL_DISCOUNT_PERCENT } from '@/lib/offers'

interface PartnerProgram {
  id: string
  name: string
  accessCode: string
  active: boolean
  endsAt: string | null
  note: string | null
  createdAt: string
  members: number
}

/**
 * Écoles partenaires : leur code d'accès ouvre aux stagiaires les tarifs
 * annuels partenaires (-30 % sur l'annuel). Le stagiaire saisit le code sur
 * « Mon abonnement », ou suit le lien /settings/subscription?ecole=CODE.
 */
export default function PartnerProgramsPanel() {
  const [programs, setPrograms] = useState<PartnerProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [note, setNote] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/partner-programs')
    if (res.ok) setPrograms((await res.json()).programs || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/partner-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, accessCode, endsAt: endsAt || null, note })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setName('')
      setAccessCode('')
      setEndsAt('')
      setNote('')
      await load()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (program: PartnerProgram) => {
    await fetch('/api/admin/partner-programs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: program.id, active: !program.active })
    })
    await load()
  }

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/settings/subscription?ecole=${encodeURIComponent(code)}`)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-emerald-600" />
          Écoles partenaires
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Un code par école, à transmettre aux stagiaires. Il ouvre les tarifs annuels partenaires
          (-{PARTNER_ANNUAL_DISCOUNT_PERCENT} %) :{' '}
          {OFFERS.map((o) => `${o.name} ${formatAmount(o.partnerAnnualAmount)}/an`).join(' · ')}.
          Désactiver une école bloque les nouvelles souscriptions, pas les abonnements en cours.
        </p>
      </div>

      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l'école"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          placeholder="Code d'accès (6 caractères min.)"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
        />
        <label className="text-sm text-gray-600 flex items-center gap-2">
          Fin (optionnelle)
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note interne (optionnelle)"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !name.trim() || accessCode.trim().length < 6}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Ajouter l&apos;école
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      ) : programs.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune école partenaire pour l&apos;instant.</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {programs.map((p) => (
            <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {p.name}{' '}
                  <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.active ? 'Actif' : 'Désactivé'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Code <span className="font-mono">{p.accessCode}</span> · {p.members} stagiaire(s) rattaché(s)
                  {p.endsAt && ` · jusqu'au ${new Date(p.endsAt).toLocaleDateString('fr-FR')}`}
                  {p.note && ` · ${p.note}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyLink(p.accessCode)}
                className="text-xs font-semibold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                {copied === p.accessCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copier le lien
              </button>
              <button
                type="button"
                onClick={() => toggle(p)}
                className="text-xs font-semibold text-gray-600 hover:underline"
              >
                {p.active ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
