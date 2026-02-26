'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [acceptCgu, setAcceptCgu] = useState(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)

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
        // Validate CGU acceptance
        if (!acceptCgu) {
          setError('Vous devez accepter les Conditions Générales d\'Utilisation et de Vente pour créer un compte.')
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
          // Update profile with full name, newsletter preference, and CGU acceptance
          await supabase.from('profiles').update({
            full_name: fullName,
            newsletter_opt_in: newsletterOptIn,
            cgu_accepted_at: new Date().toISOString(),
          }).eq('id', data.user.id)

          // Trigger welcome email automations (Inscription + user_registered)
          try {
            await Promise.all([
              fetch('/api/automations/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'Inscription',
                  contact_email: email,
                  metadata: { full_name: fullName }
                })
              }),
              fetch('/api/automations/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'user_registered',
                  contact_email: email,
                  metadata: { full_name: fullName }
                })
              })
            ])
          } catch (err) {
            console.error('Erreur lors du déclenchement des automatisations:', err)
          }

          setSuccess('Compte créé avec succès ! Vous allez être redirigé...')

          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/logo.svg"
                alt="OsteoUpgrade Logo"
                width={128}
                height={128}
                className="h-32 w-32 object-contain"
                style={{ objectPosition: 'center' }}
              />
            </div>
            <h1 className="text-3xl font-bold text-center">OsteoUpgrade</h1>
            <p className="text-center mt-2 text-blue-100">
              Plateforme d&apos;aide au diagnostic
            </p>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Créer un compte
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Jean Dupont"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* CGU/CGV and Newsletter checkboxes - only shown on registration */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptCgu}
                    onChange={(e) => setAcceptCgu(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    J&apos;accepte les{' '}
                    <Link href="/cgu" target="_blank" className="text-primary-600 hover:underline font-medium">
                      Conditions Générales d&apos;Utilisation et de Vente
                    </Link>{' '}
                    et la{' '}
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
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">
                    J&apos;accepte de recevoir la newsletter et les communications marketing d&apos;OsteoUpgrade (facultatif, modifiable à tout moment)
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !acceptCgu)}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Chargement...
                </>
              ) : (
                isLogin ? 'Se connecter' : 'Créer mon compte'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-600 text-sm">
          © 2025 OsteoUpgrade. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
