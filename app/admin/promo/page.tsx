'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Tag,
  Plus,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  couponId: string
  amountOff: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  active: boolean
  created: number
}

export default function AdminPromoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [generating, setGenerating] = useState(false)
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Formulaire
  const [formCode, setFormCode] = useState('')
  const [formMaxUses, setFormMaxUses] = useState('1')
  const [formAmountOff, setFormAmountOff] = useState('100')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    await loadPromoCodes()
    setLoading(false)
  }

  const loadPromoCodes = async () => {
    const res = await fetch('/api/admin/generate-promo')
    if (res.ok) {
      const data = await res.json()
      setPromoCodes(data.promoCodes || [])
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    setSuccess(null)

    const maxUses = parseInt(formMaxUses, 10)
    if (isNaN(maxUses) || maxUses < 1 || maxUses > 1000) {
      setError('Le nombre d\'utilisations doit être entre 1 et 1000.')
      setGenerating(false)
      return
    }

    const amountOffEuros = parseFloat(formAmountOff)
    if (isNaN(amountOffEuros) || amountOffEuros < 1 || amountOffEuros > 1000) {
      setError('Le montant de la réduction doit être entre 1€ et 1000€.')
      setGenerating(false)
      return
    }

    try {
      const res = await fetch('/api/admin/generate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode.trim() || undefined,
          maxRedemptions: maxUses,
          amountOff: Math.round(amountOffEuros * 100) // en centimes
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(`Code "${data.promoCode.code}" créé avec succès ! (-${(data.promoCode.amountOff / 100).toFixed(0)}€)`)
      setFormCode('')
      setFormMaxUses('1')
      setFormAmountOff('100')
      await loadPromoCodes()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du code')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeactivate = async (promoCodeId: string, code: string) => {
    if (!confirm(`Désactiver le code "${code}" ? Cette action est irréversible.`)) return
    setDeactivating(promoCodeId)
    try {
      const res = await fetch('/api/admin/generate-promo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCodeId })
      })
      if (!res.ok) throw new Error('Erreur lors de la désactivation')
      await loadPromoCodes()
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  const remainingByCode = (pc: PromoCode) =>
    pc.maxRedemptions != null ? pc.maxRedemptions - pc.timesRedeemed : '∞'

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          {/* Animated blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

          {/* Glass panel */}
          <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour admin
              </button>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Tag className="h-4 w-4" /> Admin — Codes Promo
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Codes Promo
              </h1>
              <p className="text-white/60 text-sm mt-2">
                Générez des codes de réduction avec un montant personnalisable.
                Les codes sont saisis par les utilisateurs directement dans la page de paiement Stripe.
              </p>
            </div>
          </div>

          {/* Bottom glow lines */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>

        {/* Light body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          {/* Animated blobs */}
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6">

            {/* Formulaire de création */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Générer un nouveau code
              </h2>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code personnalisé <span className="text-gray-400 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="ex. GOLD399 (auto-généré si vide)"
                      maxLength={20}
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Réduction (€) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formAmountOff}
                        onChange={(e) => setFormAmountOff(e.target.value)}
                        min="1"
                        max="1000"
                        step="1"
                        required
                        className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ex. 100 → -100€ sur le prix</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre d'utilisations max <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formMaxUses}
                      onChange={(e) => setFormMaxUses(e.target.value)}
                      min="1"
                      max="1000"
                      required
                      className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">1 = usage unique, 10 = 10 personnes, etc.</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Le code généré sera une réduction de <strong>-{formAmountOff || '?'}€</strong> applicable sur un abonnement.
                      L'utilisateur saisit ce code dans le champ "Code promo" lors du paiement sur Stripe.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    ❌ {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    ✅ {success}
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
                      <Tag className="h-5 w-5" />
                      Générer le code
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Liste des codes actifs */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-600" />
                Codes actifs ({promoCodes.length})
              </h2>

              {promoCodes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aucun code promo Gold actif pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promoCodes.map((pc) => {
                    const remaining = remainingByCode(pc)
                    const usagePercent = pc.maxRedemptions
                      ? Math.round((pc.timesRedeemed / pc.maxRedemptions) * 100)
                      : 0

                    return (
                      <div
                        key={pc.id}
                        className="bg-white/70 backdrop-blur-sm border border-blue-100/60 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
                      >
                        {/* Code */}
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 rounded-lg p-2">
                            <Tag className="h-5 w-5 text-purple-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xl font-bold text-gray-900 tracking-wider">
                                {pc.code}
                              </span>
                              <button
                                onClick={() => copyCode(pc.code)}
                                className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-blue-100/50 hover:bg-white transition"
                                title="Copier le code"
                              >
                                {copiedCode === pc.code
                                  ? <Check className="h-4 w-4 text-green-600" />
                                  : <Copy className="h-4 w-4 text-gray-500" />
                                }
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              -{(pc.amountOff ?? 10000) / 100}€ •{' '}
                              Créé le {new Date(pc.created * 1000).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {/* Usage */}
                        <div className="flex-1 min-w-[140px] max-w-[200px]">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{pc.timesRedeemed} utilisé{pc.timesRedeemed > 1 ? 's' : ''}</span>
                            <span>{remaining} restant{typeof remaining === 'number' && remaining > 1 ? 's' : ''}</span>
                          </div>
                          {pc.maxRedemptions && (
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 100 ? 'bg-red-500' :
                                  usagePercent >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleDeactivate(pc.id, pc.code)}
                          disabled={deactivating === pc.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deactivating === pc.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                          Désactiver
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Aide */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 text-sm text-blue-900">
              <p className="font-semibold mb-2">Comment partager un code promo ?</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Générez un code ci-dessus (ex. <code className="bg-blue-100 px-1 rounded">GOLD399</code>)</li>
                <li>Envoyez ce code à la personne ciblée (email, SMS, messagerie)</li>
                <li>Elle choisit Gold sur <strong>/settings/subscription</strong></li>
                <li>Au moment du paiement Stripe, elle saisit le code dans le champ "Code promo"</li>
                <li>Le prix passe automatiquement de 499€ à 399€</li>
              </ol>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
