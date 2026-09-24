'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { OFFERS, formatAmount } from '@/lib/offers'
import {
  activePromoExpiry,
  discountedAmount,
  promoCookieName,
  PROMO_MONTHS,
  PROMO_PERCENT,
} from '@/lib/funnels'
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Brain,
  TestTube2,
  BookOpen,
  FileText,
  Receipt,
  Activity,
} from 'lucide-react'

const features = [
  {
    icon: TestTube2,
    label: '200+ tests & raisonnement clinique',
    pillar: 'OsteoUpgrade',
    color: 'text-sky-300',
  },
  {
    icon: Brain,
    label: 'Flashcards & mémorisation active',
    pillar: 'OsteoUpgrade',
    color: 'text-sky-300',
  },
  {
    icon: BookOpen,
    label: 'Revue EBP synthétisée chaque mois',
    pillar: 'OsteoUpgrade',
    color: 'text-sky-300',
  },
  {
    icon: FileText,
    label: "Dictée vocale : l'IA rédige vos CR",
    pillar: 'MyOsteoflow',
    color: 'text-blue-300',
  },
  {
    icon: Receipt,
    label: 'Facturation & comptabilité automatisées',
    pillar: 'MyOsteoflow',
    color: 'text-blue-300',
  },
  {
    icon: Activity,
    label: 'Suivi patient automatique post-séance',
    pillar: 'MyOsteoflow',
    color: 'text-blue-300',
  },
]

/**
 * Redirection après authentification.
 *
 * Un visiteur venu d'une page funnel arrive ici avec l'offre qu'il a choisie
 * (`?plan=`) et le funnel d'origine (`?funnel=`). L'enchaînement attendu est
 * « je m'inscris puis je paie » : le renvoyer au tableau de bord lui ferait
 * rechercher lui-même l'offre qu'il venait d'accepter.
 *
 * Les paramètres sont lus depuis `window.location` plutôt qu'avec
 * `useSearchParams`, qui imposerait une frontière Suspense à toute la page.
 *
 * `planType` n'est pas validé ici : c'est /api/stripe/checkout qui fait
 * autorité sur les offres et refuse ce qu'il ne connaît pas. En cas d'échec on
 * retombe sur le tableau de bord : un compte créé ne doit jamais rester
 * bloqué sur une erreur de paiement.
 */
async function redirectAfterAuth(router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(window.location.search)
  const planType = params.get('plan')
  const funnelSlug = params.get('funnel')

  if (!planType) {
    router.push('/dashboard')
    return
  }

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType, funnelSlug: funnelSlug || undefined }),
    })
    const data = await res.json()
    if (res.ok && data.url) {
      window.location.href = data.url
      return
    }
    console.error('Checkout depuis un funnel impossible:', data.error)
  } catch (err) {
    console.error('Checkout depuis un funnel impossible:', err)
  }

  router.push('/dashboard')
}

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [acceptCgu, setAcceptCgu] = useState(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  /** Offre choisie en amont (`?plan=`) : la page devient alors l'étape avant le paiement. */
  const [offre, setOffre] = useState<string | null>(null)
  const [depuisFunnel, setDepuisFunnel] = useState(false)
  /** Échéance de la remise du visiteur, lue dans le cookie posé à l'inscription au funnel. */
  const [promoExpire, setPromoExpire] = useState<Date | null>(null)

  // Arrivée avec une offre : on est presque toujours face à quelqu'un qui n'a
  // pas encore de compte, d'où le formulaire d'inscription par défaut. Et s'il
  // est déjà connecté, lui faire remplir un formulaire serait absurde : il part
  // directement au paiement.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan')
    if (!plan) return
    setOffre(plan)
    const funnel = params.get('funnel')
    setDepuisFunnel(Boolean(funnel))
    setIsLogin(false)

    // Affichage seulement : le prix remisé montré ici n'engage rien, c'est le
    // serveur qui retrouve le code au paiement, à partir de l'adresse.
    if (funnel) {
      const nom = promoCookieName(funnel)
      const brut = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${nom}=`))
        ?.slice(nom.length + 1)
      setPromoExpire(activePromoExpiry(brut))
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSuccess('Vous êtes déjà connecté. Redirection vers le paiement sécurisé...')
        void redirectAfterAuth(router)
      }
    })
  }, [router])

  // Changer d'offre réécrit l'URL plutôt qu'un état à part : c'est elle que
  // `redirectAfterAuth` relit après l'inscription, et un rechargement de page
  // retrouve ainsi le bon choix.
  const choisirOffre = (planType: string) => {
    setOffre(planType)
    const url = new URL(window.location.href)
    url.searchParams.set('plan', planType)
    window.history.replaceState(null, '', url.toString())
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess('Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception.')
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          await redirectAfterAuth(router)
        }
      } else {
        if (!acceptCgu) {
          setError("Vous devez accepter les Conditions Générales d'Utilisation et de Vente pour créer un compte.")
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          await supabase.from('profiles').update({
            full_name: fullName,
            newsletter_opt_in: newsletterOptIn,
            cgu_accepted_at: new Date().toISOString(),
          }).eq('id', data.user.id)

          try {
            await Promise.all([
              fetch('/api/automations/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'Inscription',
                  contact_email: email,
                  full_name: fullName,
                  metadata: { full_name: fullName },
                }),
              }),
              fetch('/api/automations/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'user_registered',
                  contact_email: email,
                  full_name: fullName,
                  metadata: { full_name: fullName },
                }),
              }),
            ])
          } catch (err) {
            console.error('Erreur lors du déclenchement des automatisations:', err)
          }

          // Avec une offre choisie, l'attente n'apporte rien : la personne
          // vient de dire ce qu'elle voulait, on l'y emmène.
          if (offre) {
            setSuccess('Compte créé. Redirection vers le paiement sécurisé...')
            await redirectAfterAuth(router)
          } else {
            setSuccess('Compte créé avec succès ! Vous allez être redirigé...')
            setTimeout(() => { void redirectAfterAuth(router) }, 2000)
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL – marketing ── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Ambient glows */}
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-sky-500/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo + brand */}
          <div className="flex items-center gap-3 mb-auto">
            <Image
              src="/logo.svg"
              alt="OsteoUpgrade"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-white font-bold text-lg tracking-tight">OsteoUpgrade</span>
          </div>

          {/* Main pitch */}
          <div className="mb-10">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              La plateforme qui fait grandir{' '}
              <span className="text-sky-400">votre pratique</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Deux outils pensés pour l&apos;ostéopathe d&apos;aujourd&apos;hui : monter en compétences cliniques et simplifier la gestion du cabinet.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 mb-10">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-200 text-sm font-medium">{f.label}</span>
                    <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${f.color} opacity-70`}>{f.pillar}</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-400/70 flex-shrink-0" />
                </div>
              )
            })}
          </div>

          {/* Social proof */}
          <div className="border-t border-white/10 pt-8 flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-xs text-slate-400 mt-0.5">ostéopathes</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1 500+</div>
              <div className="text-xs text-slate-400 mt-0.5">flashcards</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">200+</div>
              <div className="text-xs text-slate-400 mt-0.5">tests cliniques</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL – form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        {/* Mobile logo (visible only < lg) */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <Image src="/logo.svg" alt="OsteoUpgrade" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-bold text-slate-800 text-lg">OsteoUpgrade</span>
        </div>

        <div className="w-full max-w-sm">
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Mot de passe oublié</h2>
                <p className="text-sm text-slate-500">
                  Saisissez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm"
              >
                {loading ? (
                  <><Loader2 className="animate-spin h-4 w-4 mr-2" />Envoi en cours...</>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccess(null) }}
                className="w-full text-sm text-primary-600 hover:underline text-center"
              >
                Retour à la connexion
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {isLogin ? 'Connexion' : 'Créer un compte'}
                </h2>
                <p className="text-sm text-slate-500">
                  {offre
                    ? 'Dernière étape avant le paiement sécurisé.'
                    : isLogin
                      ? 'Accédez à votre espace OsteoUpgrade'
                      : 'Rejoignez 500+ ostéopathes sur la plateforme'}
                </p>
              </div>

              {/* Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    isLogin ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    !isLogin ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Créer un compte
                </button>
              </div>

              {offre && (
                // `min-w-0` : un fieldset prend par défaut la largeur de son
                // contenu le plus long et déborde de l'écran sur mobile.
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-semibold text-slate-700">Votre abonnement</legend>
                  <div className="space-y-2">
                    {OFFERS.map((o) => {
                      const choisie = offre === o.planType
                      return (
                        <label
                          key={o.planType}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
                            choisie
                              ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="offre"
                            value={o.planType}
                            checked={choisie}
                            onChange={() => choisirOffre(o.planType)}
                            className="sr-only"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">{o.name}</span>
                            <span className="block text-xs text-slate-500">{o.tagline}</span>
                          </span>
                          <span className="whitespace-nowrap text-right text-sm font-bold text-slate-900">
                            {promoExpire ? (
                              <>
                                <span className="mr-1 text-xs font-normal text-slate-400 line-through">
                                  {formatAmount(o.monthlyAmount)}
                                </span>
                                {formatAmount(discountedAmount(o.monthlyAmount))}
                              </>
                            ) : (
                              formatAmount(o.monthlyAmount)
                            )}
                            <span className="text-xs font-normal text-slate-500"> / mois</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {promoExpire && (
                    <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-900">
                      <strong>Votre remise de {PROMO_PERCENT} % pendant {PROMO_MONTHS} mois</strong> est
                      appliquée automatiquement au paiement, jusqu’au{' '}
                      {promoExpire.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.
                      Créez votre compte avec l’adresse laissée sur la page.
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Sans engagement, 7 jours d’essai gratuit pour un premier abonnement.
                    {depuisFunnel &&
                      !promoExpire &&
                      ' Si vous avez reçu un code de remise, il s’applique tout seul au paiement, à condition d’utiliser l’adresse laissée sur la page.'}
                  </p>
                </fieldset>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                    placeholder="Jean Dupont"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(null); setSuccess(null) }}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptCgu}
                      onChange={(e) => setAcceptCgu(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      required
                    />
                    <span className="text-xs text-slate-600">
                      J&apos;accepte les{' '}
                      <Link href="/cgu" target="_blank" className="text-primary-600 hover:underline font-medium">
                        CGU &amp; CGV
                      </Link>{' '}et la{' '}
                      <Link href="/politique-confidentialite" target="_blank" className="text-primary-600 hover:underline font-medium">
                        Politique de Confidentialité
                      </Link>
                      {' '}<span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={(e) => setNewsletterOptIn(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-slate-600">
                      J&apos;accepte de recevoir la newsletter et les communications marketing d&apos;OsteoUpgrade (facultatif)
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!isLogin && !acceptCgu)}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm"
              >
                {loading ? (
                  <><Loader2 className="animate-spin h-4 w-4 mr-2" />Chargement...</>
                ) : (
                  offre
                    ? isLogin ? 'Se connecter et continuer' : 'Créer mon compte et continuer'
                    : isLogin ? 'Se connecter' : 'Créer mon compte'
                )}
              </button>
            </form>
          )}

          <p className="text-center mt-8 text-slate-400 text-xs">
            © 2025 OsteoUpgrade. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}
