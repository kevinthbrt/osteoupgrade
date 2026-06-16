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
  Users,
  TrendingUp,
  Share2
} from 'lucide-react'

// Valeur d'un mois offert (en centimes), alignée sur l'offre Premium
const FREE_MONTH_AMOUNT = 4999

export default function ReferralsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<any>(null)
  const [copied, setCopied] = useState(false)

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

      // Load earnings / referral history
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
          text: 'Utilisez mon code de parrainage : un mois offert pour nous deux !',
          url
        })
        .catch((err) => console.log('Error sharing:', err))
    } else {
      copyToClipboard(url)
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

  const totalReferrals = earnings?.summary?.total_referrals || 0
  const freeMonthsValue = ((totalReferrals * FREE_MONTH_AMOUNT) / 100).toFixed(2)

  return (
    <AuthLayout>
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
              <p className="text-blue-300/70 text-sm mt-1.5">Partagez votre code : 1 mois offert pour vous et votre filleul à chaque parrainage validé !</p>
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
                  💡 <strong>Comment ça marche ?</strong> Partagez votre code avec vos collègues. À chaque abonnement
                  Premium souscrit avec votre code, <strong>vous et votre filleul recevez chacun 1 mois offert</strong>,
                  crédité automatiquement sur votre prochaine échéance.
                </p>
              </div>
            </div>

            {/* Overview */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Gift className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Mois offerts</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
                <p className="text-xs text-gray-500 mt-1">Crédités sur votre abonnement</p>
              </div>

              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Filleuls</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
                <p className="text-xs text-gray-500 mt-1">Personnes parrainées</p>
              </div>

              <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Économies</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{freeMonthsValue}€</p>
                <p className="text-xs text-gray-500 mt-1">Valeur des mois offerts</p>
              </div>
            </div>

            {/* Referral History */}
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
                          Récompense
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
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <Gift className="h-3.5 w-3.5" /> 1 mois offert
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.commission_status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {transaction.commission_status === 'available' ? 'Crédité' : 'En attente'}
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
                  <p className="text-sm text-gray-400 mt-1">Partagez votre code pour offrir un mois à vos collègues — et à vous-même !</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
