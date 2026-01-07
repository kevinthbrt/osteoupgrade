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

      // Check if user is Premium Gold
      if (profileData?.role !== 'premium_gold') {
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
          title: 'Rejoignez OsteoUpgrade Premium Gold',
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </button>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-sm p-8 text-yellow-900">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Programme de Parrainage</h1>
          </div>
          <p className="text-yellow-900/90 max-w-3xl">
            Partagez votre code de parrainage et gagnez 10% sur chaque abonnement annuel souscrit grâce à vous !
          </p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white border-2 border-yellow-300 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Votre code de parrainage</h2>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Votre code unique :</p>
                <p className="text-4xl font-bold text-yellow-900 tracking-wider">{referralCode || 'Chargement...'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => referralCode && copyToClipboard(referralCode)}
                  className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                <button
                  onClick={shareReferralLink}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
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
                <code className="flex-1 bg-white px-4 py-2 rounded text-sm text-gray-800 break-all">
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

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Comment ça marche ?</strong> Partagez votre code avec vos collègues et connaissances. À chaque
              abonnement annuel (Silver ou Gold) souscrit avec votre code, vous gagnez 10% du montant de l'abonnement
              dans votre cagnotte.
            </p>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Disponible</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(availableAmount / 100).toFixed(2)}€</p>
            <p className="text-xs text-gray-500 mt-1">Prêt à être retiré</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(pendingAmount / 100).toFixed(2)}€</p>
            <p className="text-xs text-gray-500 mt-1">En cours de traitement</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Total payé</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(paidAmount / 100).toFixed(2)}€</p>
            <p className="text-xs text-gray-500 mt-1">Déjà reçu</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
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
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.subscription_type === 'premium_gold'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {transaction.subscription_type === 'premium_gold' ? 'Gold' : 'Silver'} • Annuel
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
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

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Demande de paiement</h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitPayout}
                  disabled={!ribFile || requestingPayout}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
      </div>
    </AuthLayout>
  )
}
