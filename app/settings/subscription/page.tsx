'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { Crown, Check, Sparkles, Users, Loader2, ArrowLeft, ExternalLink, Gift } from 'lucide-react'

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
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

  const handleUpgrade = async (planType: string) => {
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
          referralCode: codeValidation?.valid ? referralCode : undefined
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

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold'

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

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Abonnement Premium</h1>
          </div>
          <p className="text-purple-100 max-w-3xl">
            {isPremium
              ? 'Vous êtes actuellement abonné Premium. Merci de votre confiance !'
              : 'Choisissez la formule qui correspond le mieux à vos besoins et boostez votre pratique clinique.'}
          </p>
        </div>

        {/* Current Status */}
        {isPremium && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Votre abonnement actuel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.role === 'premium_gold' ? 'Premium Gold' : 'Premium Silver'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                <Check className="h-4 w-4" />
                Actif
              </span>
            </div>

            {/* Manage Subscription Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                Accédez au portail de gestion pour mettre à jour vos informations de paiement, télécharger vos factures,
                ou annuler votre abonnement à tout moment.
              </p>
            </div>
          </div>
        )}

        {/* Referral Code Input (only for non-premium users) */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Vous avez un code de parrainage ?</h3>
            </div>
            <p className="text-sm text-green-800 mb-4">
              Saisissez le code de parrainage d'un membre Premium Gold pour soutenir votre parrain.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ex: OSTEO1234"
                value={referralCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  setReferralCode(value)
                  if (value.length >= 4) {
                    validateReferralCode(value)
                  } else {
                    setCodeValidation(null)
                  }
                }}
                className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={20}
              />
              {validatingCode && <Loader2 className="h-10 w-10 animate-spin text-green-600" />}
            </div>
            {codeValidation && (
              <div
                className={`mt-3 p-3 rounded-lg ${
                  codeValidation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                <p className="text-sm font-medium">{codeValidation.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Plans Comparison */}
        <div className="space-y-6">
          {/* Premium Silver */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">Premium Silver</h2>
              </div>
              <p className="text-blue-100">L'essentiel des outils cliniques, sans engagement</p>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-700">
                La formule Premium Silver donne accès à l'intégralité des modules digitaux d'OsteoUpgrade, conçus pour
                structurer votre raisonnement clinique et améliorer vos prises en charge.
              </p>

              {/* Pricing Options */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Monthly */}
                <div className="border-2 border-blue-300 rounded-lg p-4 hover:border-blue-500 transition">
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">29€</span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Sans engagement</p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('premium_silver_monthly')}
                    disabled={
                      processingPlan !== null || profile?.role === 'premium_silver' || profile?.role === 'premium_gold'
                    }
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingPlan === 'premium_silver_monthly' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirection...
                      </>
                    ) : profile?.role === 'premium_silver' ? (
                      'Votre abonnement'
                    ) : profile?.role === 'premium_gold' ? (
                      'Vous avez Gold'
                    ) : (
                      'Choisir Mensuel'
                    )}
                  </button>
                </div>

                {/* Annual */}
                <div className="border-2 border-blue-500 rounded-lg p-4 relative bg-blue-50">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ÉCONOMISEZ 108€
                    </span>
                  </div>
                  <div className="mb-3 mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">240€</span>
                      <span className="text-gray-600">/an</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Sans engagement • 20€/mois</p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('premium_silver_annual')}
                    disabled={
                      processingPlan !== null || profile?.role === 'premium_silver' || profile?.role === 'premium_gold'
                    }
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingPlan === 'premium_silver_annual' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirection...
                      </>
                    ) : profile?.role === 'premium_silver' ? (
                      'Votre abonnement'
                    ) : profile?.role === 'premium_gold' ? (
                      'Vous avez Gold'
                    ) : (
                      'Choisir Annuel'
                    )}
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Inclus dans l'abonnement :</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Tests orthopédiques</strong> + export PDF
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>E-learning</strong> actualisé en continu
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Module pratique</strong> : techniques et mobilisations
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Créateur de fiches d'exercices</strong> avec export PDF
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Topographies des pathologies</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Gold */}
          <div className="relative bg-white border-4 border-yellow-400 rounded-2xl shadow-2xl overflow-hidden">
            {/* Badge "Recommandé" */}
            <div className="absolute top-6 right-6 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Recommandé
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-yellow-900">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-yellow-900/20 rounded-lg">
                  <Crown className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">Premium Gold</h2>
              </div>
              <p className="text-yellow-900/90">L'expérience complète : outils avancés + formation présentielle</p>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">499€</span>
                  <span className="text-yellow-900/80">/an</span>
                </div>
                <p className="text-sm text-yellow-900/70 mt-2">Sans engagement • Inclut le séminaire annuel</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-700">
                La formule Premium Gold est conçue pour les praticiens qui souhaitent aller plus loin. Elle inclut tout
                le contenu digital de la plateforme et une expérience de formation unique en présentiel.
              </p>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inclus dans l'abonnement :</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">Tout le contenu Premium Silver</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Code de parrainage personnalisé</strong> pour gagner des commissions
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-yellow-700" />
                    <p className="text-sm font-bold text-yellow-900">+ L'exclusivité Gold :</p>
                  </div>
                  <div className="space-y-2 mt-3">
                    <p className="text-sm font-bold text-yellow-900">Séminaire présentiel annuel (2 jours)</p>
                    <p className="text-sm text-yellow-800">
                      Une immersion complète avec l'équipe OsteoUpgrade : échanges cliniques, techniques avancées,
                      ateliers pratiques, mises en situation, networking entre thérapeutes motivés.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleUpgrade('premium_gold_annual')}
                disabled={processingPlan !== null || profile?.role === 'premium_gold'}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 py-4 px-6 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {processingPlan === 'premium_gold_annual' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirection...
                  </>
                ) : profile?.role === 'premium_gold' ? (
                  'Votre abonnement actuel'
                ) : (
                  <>
                    <Crown className="h-5 w-5" />
                    Choisir Gold
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ ou Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Bon à savoir</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>✅ Paiement sécurisé via Stripe</p>
            <p>✅ <strong>Aucun engagement</strong> : annulation possible à tout moment</p>
            <p>✅ Accès immédiat à tous les contenus après validation du paiement</p>
            <p>✅ Droit de rétractation de 14 jours</p>
            <p>✅ Factures téléchargeables depuis votre espace client</p>
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
      </div>
    </AuthLayout>
  )
}
