'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { BookOpen, Brain, CheckCircle, Lock, Sparkles, ChevronRight, ImageOff } from 'lucide-react'

interface ZoneGuide {
  id: string
  name: string
  region: string
  description: string | null
  image_url: string | null
  is_active: boolean | null
}

export default function ElearningPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<ZoneGuide[]>([])
  const [zonesLoading, setZonesLoading] = useState(true)

  useEffect(() => {
    const loadProfileAndGuides = async () => {
      const { data: { user } } = await supabase.auth.getUser()

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
      setLoading(false)

      const { data: zoneData, error } = await supabase
        .from('topographic_zones')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Erreur de chargement des guides topographiques :', error)
      } else {
        setZones(zoneData || [])
      }

      setZonesLoading(false)
    }

    loadProfileAndGuides()
  }, [router])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  const isFree = profile?.role === 'free'

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold">
              <BookOpen className="h-5 w-5" />
              E-Learning topographique
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Guides de diagnostic par zones</h1>
            <p className="text-gray-600 mt-1">Préparez vos consultations avec des parcours cliniques structurés, adaptés aux zones anatomiques.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Nouveaux guides en préparation
          </div>
        </div>

        {isFree && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/80">Accès réservé</p>
                <h2 className="text-xl font-bold">Passez Premium pour débloquer les guides</h2>
                <p className="text-white/90 mt-2 max-w-2xl">50€/mois facturés annuellement, avec accès complet aux guides topographiques et 2 séminaires présentiels inclus.</p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="bg-white text-amber-600 px-5 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                Activer le Premium
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zonesLoading && (
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              Chargement des zones topographiques...
            </div>
          )}

          {!zonesLoading && zones.length === 0 && (
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm p-6 text-center text-gray-500 flex flex-col items-center gap-2">
              <ImageOff className="h-6 w-6 text-gray-400" />
              <p>Aucune zone topographique active trouvée dans Supabase.</p>
            </div>
          )}

          {!zonesLoading && zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 capitalize">{zone.region}</p>
                  <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                </div>
                {zone.is_active ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Lock className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 flex-1">{zone.description || 'Guide en préparation pour cette zone.'}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary-600" />
                  <span className="text-gray-700">Arbres décisionnels liés</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${zone.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {zone.is_active ? 'Disponible' : 'Bientôt'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (isFree) {
                    alert('Passez Premium pour ouvrir les guides topographiques')
                    return
                  }

                  if (!zone.is_active) {
                    alert('Ce guide est en préparation')
                    return
                  }

                  router.push(`/trees?zone=${zone.id}`)
                }}
                className={`flex items-center justify-between w-full px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                  !isFree && zone.is_active
                    ? 'border-primary-200 text-primary-700 hover:bg-primary-50'
                    : 'border-dashed border-gray-200 text-gray-400'
                }`}
                disabled={isFree || !zone.is_active}
              >
                <span>{zone.is_active ? 'Ouvrir les guides' : 'En cours de rédaction'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
