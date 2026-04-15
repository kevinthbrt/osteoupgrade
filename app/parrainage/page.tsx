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

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      if (profileData?.role === 'premium' || profileData?.role === 'admin') {
        const [codeRes, earningsRes] = await Promise.all([fetch('/api/referrals/my-code'), fetch('/api/referrals/earnings')])
        if (codeRes.ok) { const d = await codeRes.json(); setReferralCode(d.referralCode) }
        if (earningsRes.ok) { const d = await earningsRes.json(); setEarnings(d) }
      }
    } finally { setLoading(false) }
  }

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareLink = () => {
    const url = `${window.location.origin}/settings/subscription?ref=${referralCode}`
    if (navigator.share) {
      navigator.share({ title: 'Rejoignez OsteoUpgrade Premium', text: 'Utilisez mon code de parrainage !', url }).catch(() => {})
    } else { copyToClipboard(url, 'link') }
  }

  if (loading) return (
    <AuthLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    </AuthLayout>
  )

  const isPremium = profile?.role === 'premium' || profile?.role === 'admin'
  const availableAmount = earnings?.summary?.available_amount || 0
  const totalReferrals = earnings?.summary?.total_referrals || 0
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/settings/subscription?ref=${referralCode}`
    : ''

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/8 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                  <Gift className="h-4 w-4" /> Programme ambassadeur
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-amber-100 to-yellow-200 bg-clip-text text-transparent">
                  Parrainage
                </h1>
                <p className="text-blue-300/70 text-sm mt-1.5">
                  Recommandez OsteoUpgrade et gagnez <strong className="text-amber-300">10% de commission</strong> sur chaque abonnement annuel
                </p>
              </div>
              {isPremium && availableAmount > 0 && (
                <div className="flex-shrink-0 flex items-center gap-2 bg-amber-400/20 backdrop-blur-sm border border-amber-300/30 rounded-2xl px-5 py-3">
                  <Wallet className="h-5 w-5 text-amber-300" />
                  <span className="font-bold text-xl text-white">{(availableAmount / 100).toFixed(2)}€</span>
                  <span className="text-amber-200/70 text-xs">disponibles</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-amber-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-8">

            {/* Comment ça marche */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Comment ça marche ?</h2>
              </div>
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="grid gap-6 sm:grid-cols-3 mb-6">
                  {[
                    { num: '1', title: 'Partagez votre code', text: 'En tant que membre Premium, vous disposez d\'un code unique à partager avec vos collègues ostéopathes.' },
                    { num: '2', title: 'Votre filleul s\'abonne', text: 'Il saisit votre code lors de son inscription et souscrit à un abonnement annuel Premium (240€).' },
                    { num: '3', title: 'Vous gagnez 10%', text: 'La commission est créditée immédiatement dans votre cagnotte. Demandez un virement dès 10€ accumulés.' },
                  ].map(({ num, title, text }) => (
                    <div key={num} className="flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-4 text-2xl font-bold text-white shadow-md">
                        {num}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                      <p className="text-sm text-slate-500">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-4 flex items-center gap-4 max-w-xs">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-sm">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Premium annuel parrainé</p>
                    <p className="text-2xl font-bold text-amber-700">+24€</p>
                    <p className="text-xs text-amber-600">10% de 240€</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Premium */}
            {isPremium && (
              <>
                {/* Code de parrainage */}
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Votre code de parrainage</h2>
                  </div>
                  <div className="rounded-2xl bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-xl ring-1 ring-inset ring-white/60 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-900" />
                      <p className="text-sm font-semibold text-amber-900">Code exclusif membre Premium</p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Votre code unique</p>
                          <p className="text-5xl font-bold text-slate-900 tracking-widest font-mono">
                            {referralCode || '...'}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => referralCode && copyToClipboard(referralCode, 'code')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/90 backdrop-blur-sm border border-amber-400/30 text-white text-sm font-semibold hover:bg-amber-500 shadow-sm transition-all"
                          >
                            {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied === 'code' ? 'Copié !' : 'Copier'}
                          </button>
                          <button
                            onClick={shareLink}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all"
                          >
                            <Share2 className="h-4 w-4" />
                            Partager
                          </button>
                        </div>
                      </div>
                      {referralLink && (
                        <div className="border-t border-amber-200/50 pt-5">
                          <p className="text-xs font-medium text-slate-600 mb-2">Lien de parrainage direct</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs text-slate-700 break-all border border-amber-200/50">
                              {referralLink}
                            </code>
                            <button
                              onClick={() => copyToClipboard(referralLink, 'link')}
                              className="p-2.5 bg-white/70 hover:bg-amber-50 rounded-xl border border-amber-200/50 transition-all flex-shrink-0"
                            >
                              {copied === 'link' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats cagnotte */}
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Tableau de bord</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'Disponible', value: `${(availableAmount / 100).toFixed(2)}€`, sub: 'Prêt à être retiré', gradient: 'from-emerald-500 to-teal-600', Icon: Wallet },
                      { label: 'Total gagné', value: `${((earnings?.summary?.total_earned || 0) / 100).toFixed(2)}€`, sub: 'Depuis le début', gradient: 'from-blue-500 to-cyan-600', Icon: TrendingUp },
                      { label: 'Parrainages', value: String(totalReferrals), sub: 'Personnes parrainées', gradient: 'from-violet-500 to-purple-600', Icon: Users },
                    ].map(({ label, value, sub, gradient, Icon }) => (
                      <div key={label} className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm font-medium text-slate-600">{label}</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        <p className="text-xs text-slate-500 mt-1">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA gestion */}
                <Link
                  href="/settings/referrals"
                  className="flex items-center justify-between rounded-2xl bg-white/85 backdrop-blur-2xl border border-amber-300/60 shadow-xl ring-1 ring-inset ring-white/60 p-5 hover:shadow-2xl hover:border-amber-400/80 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-sm">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Gérer ma cagnotte & demander un virement</p>
                      <p className="text-sm text-slate-500">Historique complet, demande de paiement, suivi des transactions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
                </Link>
              </>
            )}

            {/* Section Free */}
            {!isPremium && (
              <div className="rounded-2xl bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-xl ring-1 ring-inset ring-white/60 p-8">
                <div className="text-center max-w-xl mx-auto">
                  <div className="inline-flex p-4 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mb-4 shadow-md">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Devenez membre Premium pour participer</h2>
                  <p className="text-slate-600 mb-6">
                    Le programme de parrainage est exclusif aux membres <strong>Premium</strong>.
                    Abonnez-vous pour débloquer votre code et commencer à gagner des commissions.
                  </p>
                  <Link
                    href="/settings/subscription"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold hover:from-amber-600 hover:to-yellow-600 shadow-lg transition-all"
                  >
                    <Crown className="h-5 w-5" />
                    Découvrir l'offre Premium
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Règles */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Règles du programme
                </h2>
              </div>
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { title: 'Qui peut parrainer ?', text: 'Tous les membres Premium actifs. Le code est automatiquement généré à l\'activation de votre abonnement.' },
                    { title: 'Quels abonnements sont éligibles ?', text: 'Seuls les abonnements annuels génèrent une commission : Premium 240€/an → +24€ de commission.' },
                    { title: 'Combien de fois peut-on être parrainé ?', text: 'Un utilisateur ne peut être parrainé qu\'une seule fois au total, peu importe l\'abonnement choisi.' },
                    { title: 'Quand est crédité la commission ?', text: 'Immédiatement après la validation du paiement de votre filleul. Pas de délai de carence.' },
                    { title: 'Comment retirer ma cagnotte ?', text: 'Depuis la page "Gérer ma cagnotte", dès 10€ accumulés, en fournissant votre RIB. Virement sous 5-10 jours ouvrés.' },
                    { title: 'Y a-t-il une limite de parrainages ?', text: 'Non, vous pouvez parrainer autant de personnes que vous souhaitez et cumuler vos commissions sans limite.' }
                  ].map((faq) => (
                    <div key={faq.title} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100/60">
                      <p className="font-semibold text-slate-900 mb-1 text-sm">{faq.title}</p>
                      <p className="text-sm text-slate-500">{faq.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
