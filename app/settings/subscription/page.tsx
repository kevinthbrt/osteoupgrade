'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { Crown, Check, Sparkles, Loader2, ArrowLeft, ExternalLink, Gift, Shield, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [pendingPlanType, setPendingPlanType] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean
    message: string
    referrerName?: string
  } | null>(null)

  // Récupérer le code de parrainage depuis l'URL si présent
  useEffect(() => {
    const codeFromUrl = searchParams?.get('ref')
    if (codeFromUrl) {
      setReferralCode(codeFromUrl)
      validateReferralCode(codeFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setCodeValidation(null)
      return
    }

    setValidatingCode(true)
    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      })

      const data = await response.json()

      if (data.valid) {
        setCodeValidation({
          valid: true,
          message: `Code valide ! Parrainé par ${data.referrerName}`,
          referrerName: data.referrerName
        })
      } else {
        setCodeValidation({
          valid: false,
          message: data.error || 'Code de parrainage invalide'
        })
      }
    } catch (error) {
      console.error('Error validating referral code:', error)
      setCodeValidation({
        valid: false,
        message: 'Erreur lors de la validation du code'
      })
    } finally {
      setValidatingCode(false)
    }
  }

  const startCheckout = async (planType: string) => {
    if (!profile) return

    setProcessingPlan(planType)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          userId: profile.id,
          email: profile.email,
          referralCode: isReferralEligiblePlan(planType) && codeValidation?.valid ? referralCode : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Stripe error:', data)
        throw new Error(data.details || data.error || 'Erreur lors de la création de la session de paiement')
      }

      if (!data.url) {
        throw new Error('URL de paiement non reçue')
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
      setProcessingPlan(null)
    }
  }

  // Le parrainage ne s'applique pas à l'offre Fondateur, déjà à -50%
  const isReferralEligiblePlan = (planType: string) => planType !== 'founding_annual'

  const handleUpgrade = (planType: string) => {
    if (profile?.role === 'premium') {
      return
    }

    setPendingPlanType(planType)
  }

  const handleSkipReferral = async () => {
    if (!pendingPlanType) return

    const selectedPlan = pendingPlanType
    setPendingPlanType(null)
    setCodeValidation(null)
    setReferralCode('')
    await startCheckout(selectedPlan)
  }

  const handleContinueWithReferral = async () => {
    if (!pendingPlanType) return

    const selectedPlan = pendingPlanType
    setPendingPlanType(null)
    await startCheckout(selectedPlan)
  }

  const handleManageSubscription = async () => {
    setOpeningPortal(true)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ouverture du portail")
      }

      // Rediriger vers le portail Stripe
      window.location.href = data.url
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
      setOpeningPortal(false)
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

  const isPremium = profile?.role === 'premium' || profile?.role === 'admin'
  const pendingPlanSupportsReferral = pendingPlanType ? isReferralEligiblePlan(pendingPlanType) : false
  const isTrialing = isPremium && profile?.subscription_status === 'trialing'
  const isTrialEligible = !isPremium && !profile?.trial_used_at

  return (
    <AuthLayout>
      {pendingPlanType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-yellow-100 rounded-lg">
                <Gift className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {pendingPlanSupportsReferral
                    ? 'Avez-vous un code de parrainage ?'
                    : 'Information avant paiement'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingPlanSupportsReferral
                    ? "Avant de passer sur Stripe, renseignez votre code si vous en possédez un : vous et votre parrain bénéficierez chacun d'un mois offert. Vous pouvez aussi continuer sans code."
                    : "Vous pouvez continuer sans code de parrainage."}
                </p>
                {pendingPlanType === 'premium_monthly' && isTrialEligible && (
                  <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                    🎁 Votre carte sera enregistrée mais ne sera débitée qu'après vos 7 jours d'essai gratuit, sauf si vous annulez avant.
                  </p>
                )}
              </div>
            </div>

            {pendingPlanSupportsReferral && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Code de parrainage (optionnel)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase()
                      setReferralCode(code)
                      if (code.length >= 4) {
                        validateReferralCode(code)
                      } else {
                        setCodeValidation(null)
                      }
                    }}
                    placeholder="ex. KEVIN123"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent uppercase font-mono tracking-wider text-gray-900 placeholder:font-sans placeholder:tracking-normal"
                    maxLength={10}
                  />
                  {validatingCode && <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />}
                </div>

                {codeValidation && (
                  <div
                    className={`text-sm font-medium px-4 py-2 rounded-lg ${
                      codeValidation.valid
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {codeValidation.valid ? '✅' : '❌'} {codeValidation.message}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingPlanType(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              {pendingPlanSupportsReferral && (
                <button
                  type="button"
                  onClick={handleSkipReferral}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  Je n'ai pas de code
                </button>
              )}
              <button
                type="button"
                onClick={handleContinueWithReferral}
                disabled={pendingPlanSupportsReferral && (validatingCode || (!!referralCode && !codeValidation?.valid))}
                className="px-4 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer vers Stripe
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen -m-6 md:-m-8">
        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-4 transition"><ArrowLeft className="h-4 w-4" /> Retour au dashboard</button>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2"><Crown className="h-4 w-4" /> Premium</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">Abonnement Premium</h1>
              <p className="text-blue-300/70 text-sm mt-1.5">{isPremium ? 'Vous êtes actuellement abonné Premium. Merci de votre confiance !' : 'Choisissez la formule qui correspond le mieux à vos besoins et boostez votre pratique clinique.'}</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>
        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative space-y-6">

        {/* Current Status */}
        {isPremium && (
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Votre abonnement actuel</p>
                <p className="text-2xl font-bold text-gray-900">Premium</p>
              </div>
              {isTrialing ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  <Gift className="h-4 w-4" />
                  Essai gratuit
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  <Check className="h-4 w-4" />
                  Actif
                </span>
              )}
            </div>

            {/* Trial Information */}
            {isTrialing && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Période d'essai gratuit</h3>
                    <p className="text-sm text-gray-600">
                      {profile.trial_ends_at ? (
                        <>
                          Vous profitez de l'accès Premium gratuitement jusqu'au{' '}
                          <strong className="text-gray-900">
                            {new Date(profile.trial_ends_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </strong>
                          . Passé cette date, votre carte sera automatiquement débitée de 49,99€ pour le premier mois
                          d'abonnement, sauf si vous annulez avant.
                        </>
                      ) : (
                        <>
                          Vous profitez de l'accès Premium gratuitement. À la fin de l'essai, votre carte sera
                          automatiquement débitée pour le premier mois d'abonnement, sauf si vous annulez avant.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Commitment Information - Only for legacy users with commitment_end_date */}
            {profile.commitment_end_date && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Période d'engagement</h3>
                      {new Date() < new Date(profile.commitment_end_date) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          <Calendar className="h-3 w-3" />
                          En cours
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date() < new Date(profile.commitment_end_date) ? (
                        <>
                          Votre engagement se termine le{' '}
                          <strong className="text-gray-900">
                            {new Date(profile.commitment_end_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </strong>
                          . Vous pourrez annuler votre abonnement à partir de cette date.
                        </>
                      ) : (
                        <>
                          Votre période d'engagement est terminée. Vous pouvez annuler votre abonnement à tout moment.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Subscription Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-slate-700/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {openingPortal ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Ouverture...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    Gérer mon abonnement
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Accédez au portail de gestion pour mettre à jour vos informations de paiement, télécharger vos factures
                ou annuler votre abonnement.
              </p>
            </div>
          </div>
        )}

        {/* Referral Code Input - Only for non-premium users */}
        {!isPremium && (
          <div className="bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500 rounded-lg flex-shrink-0">
                <Gift className="h-6 w-6 text-yellow-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Vous avez un code de parrainage ?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Un collègue membre <strong>Premium</strong> vous a partagé son code ? Entrez-le ici — il sera
                  automatiquement appliqué à votre commande : <strong>vous et votre parrain recevrez chacun un mois offert</strong>.
                </p>

                {/* Bénéfice programme */}
                <div className="bg-white border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                  <Gift className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-900">
                    Un mois d'abonnement offert pour vous comme pour votre parrain — tout en rejoignant une communauté
                    d'entraide entre praticiens.
                  </p>
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase()
                      setReferralCode(code)
                      if (code.length >= 4) {
                        validateReferralCode(code)
                      } else {
                        setCodeValidation(null)
                      }
                    }}
                    placeholder="ex. KEVIN123"
                    className="flex-1 px-4 py-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent uppercase font-mono tracking-wider text-gray-900 placeholder:font-sans placeholder:tracking-normal"
                    maxLength={10}
                  />
                  {validatingCode && <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />}
                </div>

                {codeValidation && (
                  <div
                    className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg ${
                      codeValidation.valid
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {codeValidation.valid ? '✅' : '❌'} {codeValidation.message}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Pas de code ? <Link href="/parrainage" className="text-yellow-700 underline hover:text-yellow-900">En savoir plus sur le programme de parrainage</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section parrainage pour les membres Premium */}
        {isPremium && (
          <div className="bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500 rounded-lg flex-shrink-0">
                <Crown className="h-6 w-6 text-yellow-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Votre programme de parrainage</h3>
                <p className="text-sm text-gray-600 mb-4">
                  En tant que membre Premium, vous disposez d'un code de parrainage unique. Pour chaque collègue qui
                  s'abonne avec votre code, <strong>vous et votre filleul recevez chacun un mois offert</strong>.
                </p>
                <Link
                  href="/parrainage"
                  className="inline-flex items-center gap-2 bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-700 transition text-sm"
                >
                  <Gift className="h-4 w-4" />
                  Accéder à mon espace parrainage
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Plan Premium */}
        {!isPremium && (
          <div className="relative bg-white border-4 border-yellow-400 rounded-2xl shadow-2xl overflow-hidden max-w-2xl">
            <div className="absolute top-6 right-6 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Accès complet
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-yellow-900">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-yellow-900/20 rounded-lg">
                  <Crown className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">Premium</h2>
              </div>
              <p className="text-yellow-900/90">L'intégralité des outils cliniques, réunis dans une seule plateforme</p>
              <div className="mt-6">
                <div className="space-y-4">
                  {isTrialEligible && (
                    <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg p-4 border-2 border-blue-300 flex items-center gap-3">
                      <Gift className="h-5 w-5 flex-shrink-0 text-white" />
                      <p className="text-sm text-white font-semibold">7 jours d'essai gratuit, carte requise à l'inscription. Annulable à tout moment avant la fin de l'essai.</p>
                    </div>
                  )}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-bold">49,99€</span>
                      <span className="text-yellow-900/80">/mois</span>
                    </div>
                    <p className="text-sm text-yellow-900/70">
                      {isTrialEligible
                        ? 'Après 7 jours d\'essai gratuit • Sans engagement • Annulable à tout moment'
                        : 'Sans engagement • Prélevé chaque mois • Annulable à tout moment'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30 flex items-center gap-3">
                    <Gift className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm text-yellow-900/80">Parrainez un collègue : <strong>1 mois offert</strong> pour vous deux.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inclus dans l'abonnement :</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Tests orthopédiques + export PDF', desc: 'Fiches structurées, indications cliniques et documents prêts à partager.' },
                    { title: 'E-learning actualisé en continu', desc: 'Raisonnement clinique, protocoles, anatomie…' },
                    { title: 'Module pratique', desc: 'Techniques articulaires, musculaires, mobilisations, palpations.' },
                    { title: 'Créateur de fiches d\'exercices', desc: 'Personnalisation + export PDF pour tes patients.' },
                    { title: 'Topographies des pathologies', desc: 'Cartes symptomatiques détaillées + explications cliniques.' },
                    { title: 'Programme de parrainage', desc: 'Un mois offert pour vous et votre filleul à chaque parrainage.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700"><strong>{item.title}</strong> : {item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {profile?.is_founding_member && (
                  <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-900">
                      🌟 Offre Membre Fondateur : -50% à vie, 299,94€/an au lieu de 599,88€
                    </p>
                    <button
                      onClick={() => handleUpgrade('founding_annual')}
                      disabled={processingPlan !== null}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 py-4 px-6 rounded-lg font-bold hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-amber-400 shadow-lg"
                    >
                      {processingPlan === 'founding_annual' ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />Redirection...</>
                      ) : (
                        <><Crown className="h-5 w-5" />Choisir l&apos;offre Fondateur (299,94€/an)</>
                      )}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleUpgrade('premium_monthly')}
                  disabled={processingPlan !== null}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 py-4 px-6 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-yellow-400 shadow-lg"
                >
                  {processingPlan === 'premium_monthly' ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Redirection...</>
                  ) : isTrialEligible ? (
                    <><Gift className="h-5 w-5" />Démarrer les 7 jours d'essai gratuit</>
                  ) : (
                    <><Crown className="h-5 w-5" />Choisir Premium (49,99€/mois)</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ ou Notes */}
        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Bon à savoir</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>✅ Paiement sécurisé via Stripe</p>
            {isTrialEligible && (
              <p>✅ <strong>7 jours d'essai gratuit</strong> à la première souscription : carte requise, débitée automatiquement à la fin de l'essai sauf annulation</p>
            )}
            <p>✅ <strong>49,99€/mois, sans engagement</strong> : prélevé automatiquement chaque mois, annulable à tout moment</p>
            <p>✅ Renouvellement automatique (désactivable depuis votre compte)</p>
            <p>✅ Notification par email 7 jours avant chaque renouvellement</p>
            <p>✅ Accès immédiat à tous les contenus après validation du paiement</p>
            <p>✅ Droit de rétractation de 14 jours</p>
            <p>✅ <strong>Parrainage :</strong> 1 mois offert pour le parrain et le filleul à chaque parrainage validé</p>
            {!isPremium && (
              <p className="text-xs text-blue-700 mt-3 pt-3 border-t border-gray-300 flex items-center gap-1">
                💡 <span>Vous avez reçu un code d'un collègue Premium ? Saisissez-le ci-dessus pour que votre parrain soit crédité.</span>
              </p>
            )}
          </div>
        </div>

        {/* CGU Link */}
        <div className="text-center text-sm text-gray-600">
          <p>
            En souscrivant à un abonnement Premium, vous acceptez nos{' '}
            <a
              href="/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium inline-flex items-center gap-1"
            >
              Conditions Générales d'Utilisation
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

          </div>{/* end relative space-y-6 */}
        </div>{/* end body */}
      </div>{/* end min-h-screen */}
    </AuthLayout>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          </div>
        </AuthLayout>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}
