'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { Crown, Check, Sparkles, Users, Loader2, ArrowLeft, ExternalLink, Calendar, Shield } from 'lucide-react'

export default function SubscriptionPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [acceptedCommitment, setAcceptedCommitment] = useState(false)

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

  const handleUpgrade = async (planType: 'premium_silver' | 'premium_gold') => {
    if (!profile) return

    setProcessingPlan(planType)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          userId: profile.id,
          email: profile.email
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
        throw new Error(data.error || 'Erreur lors de l\'ouverture du portail')
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

            {/* Commitment Information */}
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
                    {profile.commitment_cycle_number && profile.commitment_cycle_number > 1 && (
                      <p className="text-xs text-gray-500">
                        Cycle n°{profile.commitment_cycle_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                Accédez au portail de gestion pour mettre à jour vos informations de paiement, télécharger vos factures
                {new Date() >= new Date(profile.commitment_end_date || 0) && ', ou annuler votre abonnement'}.
              </p>
            </div>
          </div>
        )}

        {/* Plans Comparison */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Premium Silver */}
          <div className="relative bg-white border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">Premium Silver</h2>
              </div>
              <p className="text-blue-100">L'essentiel des outils cliniques, réunis dans une seule plateforme</p>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">29,99€</span>
                  <span className="text-blue-100">/mois</span>
                </div>
                <p className="text-sm text-blue-200 mt-2">Engagement 12 mois • 359,88€/an</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-700">
                La formule Premium Silver donne accès à l'intégralité des modules digitaux d'OsteoUpgrade, conçus pour structurer ton raisonnement clinique, gagner du temps en consultation et améliorer la qualité de tes prises en charge.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inclus dans l'abonnement :</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Tests orthopédiques + export PDF</strong> : fiches structurées, indications cliniques et documents prêts à partager.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>E-learning actualisé en continu</strong> : raisonnement clinique, protocoles, anatomie, cas pratiques…
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Module pratique</strong> : techniques articulaires, musculaires, mobilisations, palpations.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Créateur de fiches d'exercices</strong> : personnalisation + export PDF pour tes patients.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Topographies des pathologies</strong> : cartes symptomatiques détaillées + explications cliniques.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Pour qui ?</p>
                <p className="text-sm text-blue-800">
                  Pour les thérapeutes qui veulent un outil complet, fiable et évolutif pour améliorer leur pratique au quotidien.
                </p>
              </div>

              {!isPremium && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedCommitment}
                      onChange={(e) => setAcceptedCommitment(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-amber-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-amber-900">
                        Je reconnais avoir été informé(e) de l'engagement de 12 mois minimum
                      </span>
                      <p className="text-amber-800 mt-1">
                        En cochant cette case, je confirme avoir lu et compris les conditions d'engagement. Mon abonnement sera facturé mensuellement avec un engagement minimum de 12 mois.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <button
                onClick={() => handleUpgrade('premium_silver')}
                disabled={processingPlan !== null || profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || !acceptedCommitment}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPlan === 'premium_silver' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirection...
                  </>
                ) : profile?.role === 'premium_silver' ? (
                  'Votre abonnement actuel'
                ) : profile?.role === 'premium_gold' ? (
                  'Vous avez déjà Gold'
                ) : (
                  'Choisir Silver'
                )}
              </button>
            </div>
          </div>

          {/* Premium Gold - HIGHLIGHTED */}
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
                  <span className="text-5xl font-bold">49,99€</span>
                  <span className="text-yellow-900/80">/mois</span>
                </div>
                <p className="text-sm text-yellow-900/70 mt-2">Engagement 12 mois • 599,88€/an</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-700">
                La formule Premium Gold est conçue pour les praticiens qui souhaitent aller plus loin. Elle inclut tout le contenu digital de la plateforme et une expérience de formation unique en présentiel.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inclus dans l'abonnement :</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">Tests orthopédiques avec PDF</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">E-learning mis à jour</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">Module pratique</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">Fiches d'exercices patients avec PDF</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">Topographies des pathologies</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-yellow-700" />
                  <p className="text-sm font-bold text-yellow-900">+ L'exclusivité Gold :</p>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-yellow-900">Séminaire présentiel annuel (2 jours)</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Une immersion complète avec l'équipe OsteoUpgrade : échanges cliniques, techniques avancées, ateliers pratiques, mises en situation, networking entre thérapeutes motivés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Pour qui ?</p>
                <p className="text-sm text-yellow-800">
                  Pour les praticiens qui veulent progresser plus vite, affiner leur expertise et rejoindre un groupe réduit engagé dans l'amélioration continue.
                </p>
              </div>

              {!isPremium && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedCommitment}
                      onChange={(e) => setAcceptedCommitment(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-amber-300 text-yellow-600 focus:ring-yellow-500 flex-shrink-0"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-amber-900">
                        Je reconnais avoir été informé(e) de l'engagement de 12 mois minimum
                      </span>
                      <p className="text-amber-800 mt-1">
                        En cochant cette case, je confirme avoir lu et compris les conditions d'engagement. Mon abonnement sera facturé mensuellement avec un engagement minimum de 12 mois.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <button
                onClick={() => handleUpgrade('premium_gold')}
                disabled={processingPlan !== null || profile?.role === 'premium_gold' || !acceptedCommitment}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 py-4 px-6 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {processingPlan === 'premium_gold' ? (
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
            <p>✅ <strong>Facturation mensuelle avec engagement de 12 mois</strong></p>
            <p>✅ Renouvellement automatique après la période d'engagement</p>
            <p>✅ Notification par email 7 jours avant chaque renouvellement</p>
            <p>✅ Annulation possible après les 12 mois d'engagement</p>
            <p>✅ Accès immédiat à tous les contenus après validation du paiement</p>
            <p>✅ Droit de rétractation de 14 jours</p>
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
              ℹ️ Les abonnements sont facturés mensuellement avec un engagement minimum de 12 mois.
              Après cette période, vous pouvez annuler à tout moment.
            </p>
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
