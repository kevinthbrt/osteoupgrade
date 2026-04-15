'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import {
  Gift,
  Crown,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Wallet,
  Users,
  TrendingUp,
  Share2,
  ChevronRight,
  Star
} from 'lucide-react'

export default function ParrainagePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<any>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.role === 'premium' || profileData?.role === 'admin') {
        const [codeRes, earningsRes] = await Promise.all([
          fetch('/api/referrals/my-code'),
          fetch('/api/referrals/earnings')
        ])
        if (codeRes.ok) {
          const d = await codeRes.json()
          setReferralCode(d.referralCode)
        }
        if (earningsRes.ok) {
          const d = await earningsRes.json()
          setEarnings(d)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareLink = () => {
    const url = `${window.location.origin}/settings/subscription?ref=${referralCode}`
    if (navigator.share) {
      navigator.share({
        title: 'Rejoignez OsteoUpgrade Premium',
        text: 'Utilisez mon code de parrainage pour vous inscrire à OsteoUpgrade !',
        url
      }).catch(() => {})
    } else {
      copyToClipboard(url, 'link')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
        </div>
      </AuthLayout>
    )
  }

  const isPremium = profile?.role === 'premium' || profile?.role === 'admin'
  const isFree = !isPremium

  const availableAmount = earnings?.summary?.available_amount || 0
  const totalReferrals = earnings?.summary?.total_referrals || 0
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/settings/subscription?ref=${referralCode}`
    : ''

  return (
    <AuthLayout>
      <div className="space-y-8 max-w-4xl">

        {/* ─── HERO ─── */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-8 text-yellow-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="h-9 w-9" />
              <h1 className="text-3xl font-bold">Programme de Parrainage</h1>
            </div>
            <p className="text-yellow-900/80 text-lg max-w-2xl">
              Recommandez OsteoUpgrade à vos collègues et gagnez <strong>10% de commission</strong> sur
              chaque abonnement annuel souscrit grâce à vous.
            </p>
            {isPremium && availableAmount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-yellow-900/20 border border-yellow-900/30 rounded-full px-4 py-2">
                <Wallet className="h-5 w-5" />
                <span className="font-bold text-lg">{(availableAmount / 100).toFixed(2)}€</span>
                <span className="text-sm">disponibles dans votre cagnotte</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── COMMENT ÇA MARCHE ─── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Comment ça marche ?</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4 text-2xl font-bold text-yellow-700">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Partagez votre code</h3>
              <p className="text-sm text-gray-600">
                En tant que membre <strong>Premium</strong>, vous disposez d'un code unique à partager avec vos collègues ostéopathes.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4 text-2xl font-bold text-yellow-700">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Votre filleul s'abonne</h3>
              <p className="text-sm text-gray-600">
                Il saisit votre code lors de son inscription et souscrit à un abonnement annuel Premium (240€).
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4 text-2xl font-bold text-yellow-700">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Vous gagnez 10%</h3>
              <p className="text-sm text-gray-600">
                La commission est créditée immédiatement dans votre cagnotte.
                Demandez un virement dès 10€ accumulés.
              </p>
            </div>
          </div>

          {/* Exemple de gain */}
          <div className="mt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4 max-w-xs">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900">Premium annuel parrainé</p>
                <p className="text-2xl font-bold text-yellow-700">+24€</p>
                <p className="text-xs text-yellow-600">10% de 240€</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION PREMIUM : code + cagnotte ─── */}
        {isPremium && (
          <>
            {/* Votre code */}
            <div className="bg-white border-2 border-yellow-400 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Votre code de parrainage</h2>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Votre code unique</p>
                    <p className="text-5xl font-bold text-yellow-900 tracking-widest">
                      {referralCode || '...'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => referralCode && copyToClipboard(referralCode, 'code')}
                      className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
                    >
                      {copied === 'code' ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      {copied === 'code' ? 'Copié !' : 'Copier le code'}
                    </button>
                    <button
                      onClick={shareLink}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      <Share2 className="h-5 w-5" />
                      Partager
                    </button>
                  </div>
                </div>

                {referralLink && (
                  <div className="mt-6 pt-6 border-t border-yellow-300">
                    <p className="text-sm font-medium text-gray-700 mb-2">Lien de parrainage direct :</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-4 py-2.5 rounded-lg text-xs text-gray-700 break-all border border-yellow-200">
                        {referralLink}
                      </code>
                      <button
                        onClick={() => copyToClipboard(referralLink, 'link')}
                        className="p-2.5 hover:bg-yellow-200 rounded-lg transition flex-shrink-0"
                      >
                        {copied === 'link'
                          ? <Check className="h-4 w-4 text-green-600" />
                          : <Copy className="h-4 w-4 text-gray-600" />
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tableau de bord cagnotte */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg"><Wallet className="h-5 w-5 text-green-600" /></div>
                  <p className="text-sm font-medium text-gray-600">Disponible</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{(availableAmount / 100).toFixed(2)}€</p>
                <p className="text-xs text-gray-500 mt-1">Prêt à être retiré</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
                  <p className="text-sm font-medium text-gray-600">Total gagné</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {((earnings?.summary?.total_earned || 0) / 100).toFixed(2)}€
                </p>
                <p className="text-xs text-gray-500 mt-1">Depuis le début</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-600" /></div>
                  <p className="text-sm font-medium text-gray-600">Parrainages</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
                <p className="text-xs text-gray-500 mt-1">Personnes parrainées</p>
              </div>
            </div>

            {/* CTA vers la gestion complète */}
            <Link
              href="/settings/referrals"
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:border-yellow-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-yellow-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Gérer ma cagnotte & demander un virement</p>
                  <p className="text-sm text-gray-500">Historique complet, demande de paiement, suivi des transactions</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-600 transition-colors" />
            </Link>
          </>
        )}

        {/* ─── SECTION FREE ─── */}
        {isFree && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8">
            <div className="text-center max-w-xl mx-auto">
              <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Devenez membre Premium pour participer
              </h2>
              <p className="text-gray-600 mb-6">
                Le programme de parrainage est exclusif aux membres <strong>Premium</strong>.
                Abonnez-vous pour débloquer votre code et commencer à gagner des commissions.
              </p>
              <Link
                href="/settings/subscription"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 px-8 py-4 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition shadow-lg"
              >
                <Crown className="h-5 w-5" />
                Découvrir l'offre Premium
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

        {/* ─── RÈGLES & FAQ ─── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Règles du programme
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Qui peut parrainer ?',
                text: 'Tous les membres Premium actifs. Le code est automatiquement généré à l\'activation de votre abonnement.'
              },
              {
                title: 'Quels abonnements sont éligibles ?',
                text: 'Seuls les abonnements annuels génèrent une commission : Premium 240€/an → +24€ de commission.'
              },
              {
                title: 'Combien de fois peut-on être parrainé ?',
                text: 'Un utilisateur ne peut être parrainé qu\'une seule fois au total, peu importe l\'abonnement choisi.'
              },
              {
                title: 'Quand est crédité la commission ?',
                text: 'Immédiatement après la validation du paiement de votre filleul. Pas de délai de carence.'
              },
              {
                title: 'Comment retirer ma cagnotte ?',
                text: 'Depuis la page "Gérer ma cagnotte", dès 10€ accumulés, en fournissant votre RIB. Virement sous 5-10 jours ouvrés.'
              },
              {
                title: 'Y a-t-il une limite de parrainages ?',
                text: 'Non, vous pouvez parrainer autant de personnes que vous souhaitez et cumuler vos commissions sans limite.'
              }
            ].map((faq) => (
              <div key={faq.title} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1 text-sm">{faq.title}</p>
                <p className="text-sm text-gray-600">{faq.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
