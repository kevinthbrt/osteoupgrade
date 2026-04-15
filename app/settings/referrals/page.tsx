'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Crown,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Gift,
  Wallet,
  Users,
  TrendingUp,
  Calendar,
  Share2
} from 'lucide-react'

export default function ReferralsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [ribFile, setRibFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      setProfile(profileData)

      // Check if user is Premium
      if (profileData?.role !== 'premium' && profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Load referral code
      const codeResponse = await fetch('/api/referrals/my-code')
      if (codeResponse.ok) {
        const codeData = await codeResponse.json()
        setReferralCode(codeData.referralCode)
      }

      // Load earnings
      const earningsResponse = await fetch('/api/referrals/earnings')
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()
        setEarnings(earningsData)
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferralLink = () => {
    const url = `${window.location.origin}/settings/subscription?ref=${referralCode}`
    if (navigator.share) {
      navigator
        .share({
          title: 'Rejoignez OsteoUpgrade Premium',
          text: 'Utilisez mon code de parrainage pour vous inscrire !',
          url
        })
        .catch((err) => console.log('Error sharing:', err))
    } else {
      copyToClipboard(url)
    }
  }

  const handleRequestPayoutClick = () => {
    if (!earnings?.summary?.available_amount || earnings.summary.available_amount < 1000) {
      alert('Vous devez avoir au moins 10€ de gains disponibles pour demander un paiement.')
      return
    }
    setShowPayoutModal(true)
  }

  const handleRibFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('Veuillez uploader un fichier PDF, JPG ou PNG')
        return
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5MB')
        return
      }
      setRibFile(file)
    }
  }

  const handleSubmitPayout = async () => {
    if (!ribFile) {
      alert('Veuillez joindre votre RIB')
      return
    }

    setRequestingPayout(true)

    try {
      // Convertir le fichier en base64
      const reader = new FileReader()
      reader.readAsDataURL(ribFile)

      reader.onload = async () => {
        try {
          const response = await fetch('/api/referrals/request-payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payoutMethod: 'bank_transfer',
              ribFile: {
                name: ribFile.name,
                data: reader.result,
                size: ribFile.size,
                type: ribFile.type
              }
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la demande de paiement')
          }

          alert('Votre demande de paiement a été enregistrée ! Vous recevrez le paiement sous 5-10 jours ouvrés.')
          setShowPayoutModal(false)
          setRibFile(null)
          loadData() // Reload data
        } catch (error: any) {
          alert(`Erreur: ${error.message}`)
        } finally {
          setRequestingPayout(false)
        }
      }

      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier')
        setRequestingPayout(false)
      }
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
      setRequestingPayout(false)
    }
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

  const availableAmount = earnings?.summary?.available_amount || 0
  const pendingAmount = earnings?.summary?.pending_amount || 0
  const paidAmount = earnings?.summary?.paid_amount || 0
  const totalReferrals = earnings?.summary?.total_referrals || 0

  return (
    <AuthLayout>
      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Demande de paiement</h2>

            <div className="space-y-4">
              <div className="bg-sky-100/80 backdrop-blur-sm border border-sky-200/60 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Montant à recevoir :</strong> {(availableAmount / 100).toFixed(2)}€
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Le virement sera effectué sous 5-10 jours ouvrés après validation de votre demande.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joindre votre RIB <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleRibFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG - Max 5MB</p>
                {ribFile && (
                  <p className="text-sm text-green-600 mt-2 font-medium">✓ {ribFile.name} sélectionné</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Important :</strong> Assurez-vous que votre RIB est lisible et que les informations
                  bancaires sont bien visibles. Le nom sur le RIB doit correspondre au nom de votre compte OsteoUpgrade.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPayoutModal(false)
                  setRibFile(null)
                }}
                disabled={requestingPayout}
                className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 hover:bg-white/90 px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitPayout}
                disabled={!ribFile || requestingPayout}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-600/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer la demande'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen -m-6 md:-m-8">
        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-4 transition"><ArrowLeft className="h-4 w-4" /> Retour au dashboard</button>
              <p className="text-amber-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2"><Gift className="h-4 w-4" /> Programme de Parrainage</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-amber-100 to-yellow-200 bg-clip-text text-transparent">Mon Parrainage</h1>
              <p className="text-blue-300/70 text-sm mt-1.5">Partagez votre code et gagnez 10% sur chaque abonnement annuel souscrit grâce à vous !</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative space-y-6">

            {/* Referral Code Card */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Votre code de parrainage</h2>
              </div>

              <div className="bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-md ring-1 ring-inset ring-white/60 rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Votre code unique :</p>
                    <p className="text-4xl font-bold text-yellow-900 tracking-wider">{referralCode || 'Chargement...'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => referralCode && copyToClipboard(referralCode)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/90 backdrop-blur-sm border border-amber-400/30 text-white font-semibold hover:bg-amber-600/90 shadow-sm transition-all"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                    <button
                      onClick={shareReferralLink}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-500/90 backdrop-blur-sm border border-sky-400/30 text-white font-semibold hover:bg-sky-600/90 shadow-sm transition-all"
                    >
                      <Share2 className="h-5 w-5" />
                      Partager
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-yellow-300">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Lien de parrainage personnalisé :</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/70 backdrop-blur-sm border border-amber-100/50 px-4 py-2 rounded-lg text-sm text-gray-800 break-all">
                      {referralCode && `${window.location.origin}/settings/subscription?ref=${referralCode}`}
                    </code>
                    <button
                      onClick={() =>
                        referralCode &&
                        copyToClipboard(`${window.location.origin}/settings/subscription?ref=${referralCode}`)
                      }
                      className="p-2 hover:bg-yellow-200 rounded transition"
                    >
                      {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-sky-100/80 backdrop-blur-sm border border-sky-200/60 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Comment ça marche ?</strong> Partagez votre code avec vos collègues et connaissances. À chaque
                  abonnement annuel Premium souscrit avec votre code, vous gagnez 10% du montant de l'abonnement
                  dans votre cagnotte.
                </p>
              </div>
            </div>

            {/* Earnings Overview */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Disponible</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{(availableAmount / 100).toFixed(2)}€</p>
                <p className="text-xs text-gray-500 mt-1">Prêt à être retiré</p>
              </div>

              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{(pendingAmount / 100).toFixed(2)}€</p>
                <p className="text-xs text-gray-500 mt-1">En cours de traitement</p>
              </div>

              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Total payé</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{(paidAmount / 100).toFixed(2)}€</p>
                <p className="text-xs text-gray-500 mt-1">Déjà reçu</p>
              </div>

              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Parrainages</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
                <p className="text-xs text-gray-500 mt-1">Personnes parrainées</p>
              </div>
            </div>

            {/* Request Payout Button */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Demander un paiement</h3>
                  <p className="text-sm text-gray-600">
                    Montant minimum : 10€ • Paiement sous 5-10 jours ouvrés par virement bancaire
                  </p>
                </div>
                <button
                  onClick={handleRequestPayoutClick}
                  disabled={requestingPayout || availableAmount < 1000}
                  className="inline-flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingPayout ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      Demander le paiement
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des parrainages</h3>

              {earnings?.transactions && earnings.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Filleul
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earnings.transactions.map((transaction: any) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {transaction.referred_user?.email || 'Utilisateur'}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Premium • Annuel
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                            {(transaction.commission_amount / 100).toFixed(2)}€
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.commission_status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : transaction.commission_status === 'paid'
                                  ? 'bg-blue-100 text-blue-800'
                                  : transaction.commission_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {transaction.commission_status === 'available'
                                ? 'Disponible'
                                : transaction.commission_status === 'paid'
                                ? 'Payé'
                                : transaction.commission_status === 'pending'
                                ? 'En attente'
                                : transaction.commission_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun parrainage pour le moment</p>
                  <p className="text-sm text-gray-400 mt-1">Partagez votre code pour commencer à gagner des commissions !</p>
                </div>
              )}
            </div>

            {/* Payout History */}
            {earnings?.payouts && earnings.payouts.length > 0 && (
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des paiements</h3>

                <div className="space-y-4">
                  {earnings.payouts.map((payout: any) => (
                    <div key={payout.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{(payout.amount / 100).toFixed(2)}€</p>
                          <p className="text-sm text-gray-600">
                            Demandé le {new Date(payout.requested_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            payout.payout_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payout.payout_status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : payout.payout_status === 'requested'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payout.payout_status === 'completed'
                            ? 'Complété'
                            : payout.payout_status === 'processing'
                            ? 'En cours'
                            : payout.payout_status === 'requested'
                            ? 'Demandé'
                            : 'Échoué'}
                        </span>
                      </div>
                      {payout.completed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Complété le {new Date(payout.completed_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
