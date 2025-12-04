'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { AlertCircle, BookOpen, CheckCircle, GraduationCap, Mail, Play, Video } from 'lucide-react'

export default function ElearningPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
              <GraduationCap className="h-5 w-5" />
              E-learning
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
            <p className="text-gray-600">
              Accès réservé aux membres Premium. Nous préparons une nouvelle bibliothèque vidéo et les notifications email
              intégrées (Resend & Brevo) pour le lancement.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 shadow-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                <AlertCircle className="h-4 w-4" />
                Accès Premium requis
              </div>
              <h2 className="text-3xl font-bold mb-4">Passez Premium pour être averti dès la mise en ligne</h2>
              <p className="text-white/90 text-lg mb-6">
                De nouvelles formations seront hébergées sur Vimeo avec une expérience de visionnage fluide et des
                rappels par email envoyés via Resend/Brevo.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Streaming Vimeo</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Notifications email intégrées</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Tests 3D & topographie</span>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                Activer Premium
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
            <GraduationCap className="h-5 w-5" />
            E-learning
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bibliothèque vidéo en préparation</h1>
          <p className="text-gray-600">
            Nous migrons nos formations vers une expérience intégrée : hébergement vidéo sur Vimeo et notifications
            transactionnelles via Resend et Brevo. Les contenus premium arriveront très bientôt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold">
              <Video className="h-4 w-4" />
              Lecteur optimisé
            </div>
            <p className="text-sm text-gray-700">
              Les prochaines vidéos seront hébergées sur Vimeo pour un streaming rapide, des sous-titres et une qualité
              adaptative.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold">
              <Mail className="h-4 w-4" />
              Emails intégrés
            </div>
            <p className="text-sm text-gray-700">
              Les rappels de module et confirmations d'inscription seront envoyés via Resend et Brevo selon la
              disponibilité des services.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold">
              <BookOpen className="h-4 w-4" />
              Parcours guidés
            </div>
            <p className="text-sm text-gray-700">
              Nous ajouterons des parcours de cours thématiques avec suivi d'avancement directement dans l'application.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <CheckCircle className="h-4 w-4" />
              Mise à jour en cours
            </div>
            <p className="text-sm text-gray-700">
              Vous recevrez une notification dès que les nouvelles formations seront publiées. Aucune action n'est
              nécessaire de votre part.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            <Play className="h-4 w-4" />
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
