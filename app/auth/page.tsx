'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
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
    label: "Dictée vocale — l'IA rédige vos CR",
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
          router.push('/dashboard')
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
                  metadata: { full_name: fullName },
                }),
              }),
              fetch('/api/automations/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'user_registered',
                  contact_email: email,
                  metadata: { full_name: fullName },
                }),
              }),
            ])
          } catch (err) {
            console.error('Erreur lors du déclenchement des automatisations:', err)
          }

          setSuccess('Compte créé avec succès ! Vous allez être redirigé...')
          setTimeout(() => router.push('/dashboard'), 2000)
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
              Deux outils pensés pour l&apos;ostéopathe d&apos;aujourd&apos;hui — monter en compétences cliniques et simplifier la gestion du cabinet.
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
                  {isLogin
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
                  isLogin ? 'Se connecter' : 'Créer mon compte'
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
