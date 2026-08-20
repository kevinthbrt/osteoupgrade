'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { Crown, Check, Sparkles, Loader2, ArrowLeft, ExternalLink, Gift, Shield, Calendar, ChevronRight, Stethoscope, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { planOf, planLabel } from '@/lib/entitlements'
import { OFFERS, formatAmount, offerOf, upgradeTargetsFor, BUNDLE_SAVING, type Offer } from '@/lib/offers'

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

  // Le parrainage ne s'applique pas aux offres Fondateur, déjà à -50%
  const isReferralEligiblePlan = (planType: string) => !planType.startsWith('founding_')

  const handleUpgrade = (planType: string) => {

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

  // L'offre souscrite pilote toute la page. L'état d'essai se lit sur le
  // statut d'abonnement, jamais sur le rôle : `trial` est devenu le rôle
  // miroir permanent de l'offre MyOsteoFlow seul.
  const plan = planOf(profile)
  const currentOffer = offerOf(plan)
  const isSubscribed = plan !== 'free'
  const isTrialing = profile?.subscription_status === 'trialing'
  const upgradeTargets = upgradeTargetsFor(plan)
  const isFounder = Boolean(profile?.is_founding_member)

  const pendingPlanSupportsReferral = pendingPlanType ? isReferralEligiblePlan(pendingPlanType) : false
  const isTrialEligible = plan === 'free' && !profile?.trial_used_at && !isFounder

  const planTypeFor = (offer: Offer) => (isFounder ? offer.foundingPlanType : offer.planType)
  const amountFor = (offer: Offer) => (isFounder ? offer.foundingAnnualAmount : offer.monthlyAmount)
  const intervalFor = () => (isFounder ? '/an' : '/mois')

  const OfferIcon = ({ id, className }: { id: string; className?: string }) =>
    id === 'osteoflow' ? <Stethoscope className={className} />
      : id === 'osteoupgrade' ? <GraduationCap className={className} />
      : <Crown className={className} />

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
                {isTrialEligible && pendingPlanSupportsReferral && (
                  <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                    🎁 Votre carte sera enregistrée mais ne sera débitée qu&apos;après vos 7 jours d&apos;essai gratuit,
                    sauf si vous annulez avant. Vous avez accès à toutes les fonctionnalités de l&apos;offre pendant l&apos;essai.
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
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2"><Crown className="h-4 w-4" /> Abonnement</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                {isSubscribed ? `Votre offre ${currentOffer?.name ?? ''}`.trim() : 'Choisir votre offre'}
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                {isTrialing
                  ? `Vous testez l'offre ${currentOffer?.name ?? ''} gratuitement. Vous avez accès à toutes ses fonctionnalités pendant l'essai.`
                  : isSubscribed
                    ? 'Merci de votre confiance ! Vous pouvez faire évoluer votre offre à tout moment.'
                    : 'Trois formules, sans engagement. Prenez seulement ce dont vous avez besoin.'}
              </p>
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
        {isSubscribed && (
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{isTrialing ? 'Votre essai en cours' : 'Votre abonnement actuel'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentOffer?.name ?? planLabel(plan)}
                  {isTrialing && ' — Essai gratuit'}
                </p>
                {currentOffer && !isTrialing && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatAmount(currentOffer.monthlyAmount)}/mois · sans engagement
                  </p>
                )}
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
                      Vous avez accès à <strong>l'intégralité de l'offre {currentOffer?.name ?? ''}</strong>
                      {profile.trial_ends_at ? (
                        <>
                          {' '}jusqu'au{' '}
                          <strong className="text-gray-900">
                            {new Date(profile.trial_ends_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </strong>
                          . Passé cette date, votre carte sera automatiquement débitée de{' '}
                          {currentOffer ? formatAmount(currentOffer.monthlyAmount) : ''} pour le premier mois,
                          sauf si vous annulez avant.
                        </>
                      ) : (
                        <>
                          . À la fin de l'essai, votre carte sera automatiquement débitée pour le premier mois,
                          sauf si vous annulez avant.
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

        {/* Referral Code Input - Only for non-premium, non-trial users */}
        {!isSubscribed && (
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
                  Un collègue abonné vous a partagé son code ? Entrez-le ici — il sera
                  automatiquement appliqué à votre commande : <strong>vous et votre parrain recevrez chacun un mois offert</strong>,
                  à hauteur de l&apos;offre que vous choisissez.
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
        {isSubscribed && !isTrialing && (
          <div className="bg-amber-100/85 backdrop-blur-2xl border border-amber-300/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500 rounded-lg flex-shrink-0">
                <Crown className="h-6 w-6 text-yellow-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Votre programme de parrainage</h3>
                <p className="text-sm text-gray-600 mb-4">
                  En tant qu&apos;abonné, vous disposez d&apos;un code de parrainage unique. Pour chaque collègue qui
                  s&apos;abonne avec votre code, <strong>vous et votre filleul recevez chacun un mois offert</strong>.
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

        {/* ── Grille des trois offres (comptes sans abonnement) ── */}
        {!isSubscribed && (
          <div className="space-y-4">
            {isFounder && (
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/90 backdrop-blur-2xl p-5 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Offre Membre Fondateur — -50 % à vie</p>
                  <p className="text-sm text-amber-800/90 mt-0.5">
                    Les tarifs ci-dessous sont vos tarifs fondateur, en facturation annuelle.
                    Ils s&apos;appliquent à l&apos;offre de votre choix.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {OFFERS.map((offer) => {
                const planType = planTypeFor(offer)
                const enCours = processingPlan === planType
                return (
                  <div
                    key={offer.id}
                    className={`relative rounded-2xl bg-white/90 backdrop-blur-2xl shadow-xl ring-1 ring-inset ring-white/60 p-6 flex flex-col ${
                      offer.highlighted ? 'border-4 border-yellow-400 lg:-mt-3 lg:pb-8' : 'border border-white/70'
                    }`}
                  >
                    {offer.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                          Le plus complet · -{BUNDLE_SAVING.savedPercent} %
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1 mt-1">
                      <div className={`p-2 rounded-lg ${offer.highlighted ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                        <OfferIcon id={offer.id} className={`h-5 w-5 ${offer.highlighted ? 'text-yellow-700' : 'text-slate-600'}`} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">{offer.name}</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{offer.tagline}</p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">{formatAmount(amountFor(offer))}</span>
                        <span className="text-gray-500 text-sm">{intervalFor()}</span>
                      </div>
                      {isFounder ? (
                        <p className="text-xs text-amber-700 font-semibold mt-1">
                          Tarif fondateur · -50 % à vie · au lieu de {formatAmount(offer.monthlyAmount * 12)}/an
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Sans engagement · annulable à tout moment</p>
                      )}
                      {offer.highlighted && !isFounder && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          {formatAmount(BUNDLE_SAVING.savedAmount)}/mois économisés vs les deux offres séparées
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {offer.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${offer.highlighted ? 'text-yellow-600' : 'text-slate-400'}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isTrialEligible && (
                      <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 flex items-start gap-2">
                        <Gift className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 font-medium">
                          7 jours d&apos;essai gratuit, accès complet à cette offre. Carte requise, annulable avant la fin.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleUpgrade(planType)}
                      disabled={processingPlan !== null}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        offer.highlighted
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 hover:from-yellow-600 hover:to-yellow-700 border-2 border-yellow-400 shadow-lg'
                          : 'bg-slate-800 text-white hover:bg-slate-700 shadow'
                      }`}
                    >
                      {enCours ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Redirection...</>
                      ) : isTrialEligible ? (
                        <><Gift className="h-4 w-4" />Essayer 7 jours</>
                      ) : (
                        <>Choisir {offer.name}</>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Faire évoluer son offre (abonnés MyOsteoFlow ou OsteoUpgrade) ── */}
        {isSubscribed && upgradeTargets.length > 0 && (
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
            {upgradeTargets.map((cible) => (
              <div key={cible.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 self-start">
                  <Crown className="h-6 w-6 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Passer à l&apos;offre {cible.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vous avez {currentOffer?.name}. Ajoutez{' '}
                    {plan === 'osteoflow' ? 'OsteoUpgrade' : 'MyOsteoFlow'} pour{' '}
                    {formatAmount(cible.monthlyAmount - (currentOffer?.monthlyAmount ?? 0))} de plus par mois —
                    soit {formatAmount(BUNDLE_SAVING.savedAmount)} de moins que les deux offres séparées.
                    Le changement est immédiat et proratisé par Stripe.
                    {isTrialing && (
                      <>
                        {' '}
                        <strong className="text-amber-700">
                          Attention : changer d&apos;offre pendant l&apos;essai y met fin — le premier prélèvement
                          a lieu tout de suite, au tarif de la nouvelle offre.
                        </strong>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={openingPortal}
                  className="sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 font-bold hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-400 shadow-lg flex-shrink-0"
                >
                  {openingPortal ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Ouverture...</>
                  ) : (
                    <><Sparkles className="h-5 w-5" />Changer d&apos;offre</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FAQ ou Notes */}
        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Bon à savoir</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>✅ Paiement sécurisé via Stripe</p>
            {isTrialEligible && (
              <p>✅ <strong>7 jours d&apos;essai gratuit</strong> à la première souscription, sur l&apos;offre de votre choix : carte requise, débitée automatiquement à la fin de l&apos;essai sauf annulation. Accès complet à l&apos;offre pendant l&apos;essai. Un seul essai par compte.</p>
            )}
            <p>✅ <strong>Sans engagement</strong> : {OFFERS.map((o) => `${o.name} ${formatAmount(o.monthlyAmount)}/mois`).join(' · ')}. Prélevé automatiquement chaque mois, annulable à tout moment.</p>
            <p>✅ <strong>Changement d&apos;offre à tout moment</strong> depuis « Gérer mon abonnement » — Stripe calcule le prorata automatiquement</p>
            {isTrialing && (
              <p>⚠️ <strong>Pendant l&apos;essai</strong>, changer d&apos;offre met fin à la période gratuite et déclenche le premier prélèvement immédiatement. Pour profiter de vos jours restants, attendez la fin de l&apos;essai avant de changer.</p>
            )}
            <p>✅ Renouvellement automatique (désactivable depuis votre compte)</p>
            <p>✅ Notification par email 7 jours avant chaque renouvellement</p>
            <p>✅ Accès immédiat à tous les contenus après validation du paiement</p>
            <p>✅ Droit de rétractation de 14 jours</p>
            <p>✅ <strong>Parrainage :</strong> 1 mois offert pour le parrain et le filleul à chaque parrainage validé</p>
            {!isSubscribed && (
              <p className="text-xs text-blue-700 mt-3 pt-3 border-t border-gray-300 flex items-center gap-1">
                💡 <span>Vous avez reçu un code d'un collègue Premium ? Saisissez-le ci-dessus pour que votre parrain soit crédité.</span>
              </p>
            )}
          </div>
        </div>

        {/* CGU Link */}
        <div className="text-center text-sm text-gray-600">
          <p>
            En souscrivant à un abonnement, vous acceptez nos{' '}
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
