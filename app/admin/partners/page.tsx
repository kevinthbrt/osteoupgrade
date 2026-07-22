'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import {
  HeartHandshake,
  Plus,
  Copy,
  Check,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface PartnerCode {
  id: string
  code: string
  partner: string
  note: string | null
  percentOff: number | null
  durationInMonths: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  active: boolean
  created: number
}

export default function AdminPartnersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<PartnerCode[]>([])
  const [generating, setGenerating] = useState(false)
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedBatch, setGeneratedBatch] = useState<string[] | null>(null)

  // Formulaire
  const [formPartner, setFormPartner] = useState('IFCOPS')
  const [formPercentOff, setFormPercentOff] = useState('10')
  const [formDuration, setFormDuration] = useState('12')
  const [formCount, setFormCount] = useState('20')
  const [formNote, setFormNote] = useState('')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    await loadCodes()
    setLoading(false)
  }

  const loadCodes = async () => {
    const res = await fetch('/api/admin/partner-codes')
    if (res.ok) {
      const data = await res.json()
      setCodes(data.codes || [])
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    setGeneratedBatch(null)

    const percentOff = parseInt(formPercentOff, 10)
    const durationInMonths = parseInt(formDuration, 10)
    const count = parseInt(formCount, 10)

    if (!formPartner.trim()) {
      setError('Le nom du partenaire est requis.')
      setGenerating(false)
      return
    }
    if (isNaN(percentOff) || percentOff < 1 || percentOff > 100) {
      setError('La réduction doit être entre 1 et 100%.')
      setGenerating(false)
      return
    }
    if (isNaN(durationInMonths) || durationInMonths < 1 || durationInMonths > 60) {
      setError('La durée doit être entre 1 et 60 mois.')
      setGenerating(false)
      return
    }
    if (isNaN(count) || count < 1 || count > 200) {
      setError('Le nombre de codes doit être entre 1 et 200.')
      setGenerating(false)
      return
    }

    try {
      const res = await fetch('/api/admin/partner-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner: formPartner.trim(),
          percentOff,
          durationInMonths,
          count,
          note: formNote.trim() || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setGeneratedBatch((data.codes || []).map((c: { code: string }) => c.code))
      setFormNote('')
      await loadCodes()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création des codes')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeactivate = async (promoCodeId: string, code: string) => {
    if (!confirm(`Désactiver le code "${code}" ? Cette action est irréversible.`)) return
    setDeactivating(promoCodeId)
    try {
      const res = await fetch('/api/admin/partner-codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCodeId })
      })
      if (!res.ok) throw new Error('Erreur lors de la désactivation')
      await loadCodes()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeactivating(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyBatch = () => {
    if (!generatedBatch) return
    navigator.clipboard.writeText(generatedBatch.join('\n'))
    setCopiedCode('__batch__')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

          <AdminBackButton />
          <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <HeartHandshake className="h-4 w-4" /> Admin — Partenaires
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Codes partenaires
              </h1>
              <p className="text-white/60 text-sm mt-2">
                Générez des lots de codes à usage unique pour vos partenaires (ex. IFCOPS).
                Réservés aux nouveaux clients, saisis dans le champ "Code promo" au paiement Stripe.
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
        </div>

        {/* Light body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

          <div className="relative space-y-6">

            {/* Formulaire de génération */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Générer un lot de codes
              </h2>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partenaire <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formPartner}
                      onChange={(e) => setFormPartner(e.target.value)}
                      placeholder="ex. IFCOPS"
                      maxLength={40}
                      required
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Réduction (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formPercentOff}
                      onChange={(e) => setFormPercentOff(e.target.value)}
                      min="1"
                      max="100"
                      required
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (mois) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      min="1"
                      max="60"
                      required
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de codes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formCount}
                      onChange={(e) => setFormCount(e.target.value)}
                      min="1"
                      max="200"
                      required
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note <span className="text-gray-400 font-normal">(optionnel, ex. "Session du 22/07/2026")</span>
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Pour retrouver facilement ce lot dans la liste ci-dessous"
                    maxLength={80}
                    className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Chaque code généré est à <strong>usage unique</strong> et réservé aux{' '}
                      <strong>nouveaux clients</strong> (vérifié nativement par Stripe). Il applique
                      <strong> -{formPercentOff || '?'}%</strong> pendant <strong>{formDuration || '?'} mois</strong>,
                      puis le tarif repasse au plein prix.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    ❌ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="h-5 w-5" />
                      Générer les codes
                    </>
                  )}
                </button>
              </form>

              {generatedBatch && generatedBatch.length > 0 && (
                <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-800">
                      ✅ {generatedBatch.length} code{generatedBatch.length > 1 ? 's' : ''} généré{generatedBatch.length > 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={copyBatch}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-green-300 text-green-700 text-xs font-semibold hover:bg-green-100 transition"
                    >
                      {copiedCode === '__batch__' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copier tout
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedBatch.join('\n')}
                    rows={Math.min(generatedBatch.length, 8)}
                    className="w-full font-mono text-xs bg-white border border-green-200 rounded-lg p-3 text-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Liste des codes */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-purple-600" />
                Codes partenaires ({codes.length})
              </h2>

              {codes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <HeartHandshake className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aucun code partenaire pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {codes.map((pc) => {
                    const used = pc.timesRedeemed > 0
                    return (
                      <div
                        key={pc.id}
                        className="bg-white/70 backdrop-blur-sm border border-blue-100/60 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`rounded-lg p-2 flex-shrink-0 ${used ? 'bg-slate-100' : 'bg-purple-100'}`}>
                            <HeartHandshake className={`h-4 w-4 ${used ? 'text-slate-400' : 'text-purple-700'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-gray-900 tracking-wider">
                                {pc.code}
                              </span>
                              <button
                                onClick={() => copyCode(pc.code)}
                                className="p-1 rounded-md bg-white/80 border border-blue-100/50 hover:bg-white transition"
                                title="Copier le code"
                              >
                                {copiedCode === pc.code
                                  ? <Check className="h-3.5 w-3.5 text-green-600" />
                                  : <Copy className="h-3.5 w-3.5 text-gray-500" />
                                }
                              </button>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                used ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {used ? 'Utilisé' : 'Disponible'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {pc.partner} · -{pc.percentOff ?? '?'}% pendant {pc.durationInMonths ?? '?'} mois
                              {pc.note ? ` · ${pc.note}` : ''} · Créé le {new Date(pc.created * 1000).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {!used && (
                          <button
                            onClick={() => handleDeactivate(pc.id, pc.code)}
                            disabled={deactivating === pc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-300/30 text-red-600 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {deactivating === pc.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                            Désactiver
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Aide */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 text-sm text-blue-900">
              <p className="font-semibold mb-2">Comment ça marche ?</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Générez un lot de codes ci-dessus (ex. 20 codes pour une session IFCOPS)</li>
                <li>Copiez la liste et remettez-la au formateur, qui la distribue en fin de session</li>
                <li>Chaque diplômé saisit son code dans le champ "Code promo" au moment du paiement Stripe</li>
                <li>Le tarif passe automatiquement à -{formPercentOff}% pendant {formDuration} mois, puis repasse au plein tarif</li>
                <li>Un code déjà utilisé ou un abonné existant ne peut pas le réutiliser (vérifié par Stripe)</li>
              </ol>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
