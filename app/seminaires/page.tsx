'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, User, Plus, CheckCircle, Users, PenSquare, AlertTriangle } from 'lucide-react'

interface Seminar {
  id: string
  title: string
  date: string
  location: string
  theme: string | null
  facilitator: string | null
  created_by?: string | null
  capacity?: number | null
}

interface SeminarRegistration {
  id: string
  seminar_id: string
  registeredAt: string
  user_id?: string | null
  user_name?: string | null
  user_email?: string | null
}

export default function SeminarsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [newSeminar, setNewSeminar] = useState<Seminar>({
    id: '',
    title: '',
    date: '',
    location: '',
    theme: '',
    facilitator: '',
    capacity: null
  })
  const [userRegistrations, setUserRegistrations] = useState<SeminarRegistration[]>([])
  const [allRegistrations, setAllRegistrations] = useState<SeminarRegistration[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)

  const fallbackSeminars: Seminar[] = [
    {
      id: 'fallback-1',
      title: 'Séminaire clinique - Membres supérieurs',
      date: '2025-04-18',
      location: 'Lyon',
      theme: 'Épaule & coude : trajectoires décisionnelles',
      facilitator: 'Gérald Stoppini',
      capacity: 28
    },
    {
      id: 'fallback-2',
      title: 'Rachis et chaînes fasciales',
      date: '2025-06-12',
      location: 'Bordeaux',
      theme: 'Rachis lombaire et thoracique - cas complexes',
      facilitator: 'Kevin Thubert',
      capacity: 22
    }
  ]

  useEffect(() => {
    const loadData = async () => {
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

      const { data: seminarsData, error: seminarsError } = await supabase
        .from('seminars')
        .select('*')
        .order('date', { ascending: true })

      if (seminarsError) {
        console.warn('Chargement des séminaires en mode secours :', seminarsError.message)
        setLoadingError('Les séminaires utilisent un jeu de données local car la table Supabase est absente ou inaccessible.')
        setSeminars(fallbackSeminars)
      } else {
        setSeminars(seminarsData || [])
      }

      const { data: registrationsData, error: regError } = await supabase
        .from('seminar_registrations')
        .select('*')
        .eq('user_id', user.id)

      if (!regError && registrationsData) {
        setUserRegistrations(
          registrationsData.map((r: any) => ({
            id: r.id,
            seminar_id: r.seminar_id,
            registeredAt: r.registered_at || r.created_at,
            user_id: r.user_id
          }))
        )
      }

      const { data: allRegistrationsData, error: allRegError } = await supabase
        .from('seminar_registrations')
        .select('id, seminar_id, user_id, registered_at, created_at, profiles(full_name, email)')

      if (!allRegError && allRegistrationsData) {
        setAllRegistrations(
          allRegistrationsData.map((r: any) => ({
            id: r.id,
            seminar_id: r.seminar_id,
            registeredAt: r.registered_at || r.created_at,
            user_id: r.user_id,
            user_name: r.profiles?.full_name,
            user_email: r.profiles?.email
          }))
        )
      } else {
        setAllRegistrations([])
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const yearlyRegistrations = userRegistrations.filter((r) => new Date(r.registeredAt).getFullYear() === currentYear)
  const hasReachedLimit = yearlyRegistrations.length >= 2

  const handleRegister = async (id: string) => {
    if (profile?.role !== 'premium' && profile?.role !== 'admin') {
      alert('Inscription réservée aux membres Premium')
      return
    }

    if (hasReachedLimit) {
      alert('Vous avez atteint la limite de 2 séminaires pour cette année')
      return
    }

    const targetSeminar = seminars.find((seminar) => seminar.id === id)
    const seminarRegistrations = allRegistrations.filter((registration) => registration.seminar_id === id)

    if (targetSeminar?.capacity && seminarRegistrations.length >= targetSeminar.capacity) {
      alert('Il ne reste plus de places pour ce séminaire')
      return
    }

    const registrationPayload = {
      seminar_id: id,
      user_id: profile?.id,
      registered_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('seminar_registrations').insert(registrationPayload).select('*').single()

    if (error) {
      console.warn('Enregistrement en local faute de table Supabase :', error.message)
    }

    const registrationRecord: SeminarRegistration = {
      id: data?.id || `${Date.now()}`,
      seminar_id: id,
      registeredAt: registrationPayload.registered_at,
      user_id: profile?.id,
      user_name: profile?.full_name || profile?.email,
      user_email: profile?.email
    }

    setUserRegistrations((prev) => [...prev, registrationRecord])
    setAllRegistrations((prev) => [...prev, registrationRecord])
    alert('Inscription confirmée !')
  }

  const handleUnregister = async (id: string) => {
    const registrationToRemove = userRegistrations.find((registration) => registration.seminar_id === id)

    if (!registrationToRemove) {
      alert("Vous n'êtes pas inscrit à ce séminaire")
      return
    }

    const { error } = await supabase.from('seminar_registrations').delete().eq('id', registrationToRemove.id)

    if (error) {
      console.warn('Suppression locale faute de table Supabase :', error.message)
    }

    setUserRegistrations((prev) => prev.filter((registration) => registration.seminar_id !== id))
    setAllRegistrations((prev) =>
      prev.filter(
        (registration) =>
          !(registration.id === registrationToRemove.id) &&
          !(registration.seminar_id === id && registration.user_id === profile?.id)
      )
    )
    alert('Votre inscription a été annulée')
  }

  const handleAddSeminar = async () => {
    if (profile?.role !== 'admin') return
    if (!newSeminar.title || !newSeminar.date) {
      alert('Merci de renseigner un titre et une date')
      return
    }

    const capacity = newSeminar.capacity ?? null

    const payload = {
      title: newSeminar.title,
      date: newSeminar.date,
      location: newSeminar.location,
      theme: newSeminar.theme,
      facilitator: newSeminar.facilitator,
      capacity,
      created_by: profile?.id
    }

    const { data, error } = await supabase.from('seminars').insert(payload).select('*').single()

    if (error) {
      console.warn('Ajout du séminaire en mode local :', error.message)
      setSeminars((prev) => [
        ...prev,
        { ...newSeminar, id: `${Date.now()}`, capacity }
      ])
    } else if (data) {
      setSeminars((prev) => [...prev, data])
    }

    setNewSeminar({ id: '', title: '', date: '', location: '', theme: '', facilitator: '', capacity: null })
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

  const isFree = profile?.role === 'free'

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold">
            <Calendar className="h-5 w-5" />
            Séminaires présentiels
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rencontres en présentiel (2 incluses/an)</h1>
          <p className="text-gray-600">Réservés aux abonnés Premium pour rencontrer Gérald Stoppini et Kevin Thubert. Limite de 2 inscriptions par année civile.</p>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Users className="h-4 w-4 text-primary-600" />
            <span>{yearlyRegistrations.length}/2 inscriptions cette année</span>
            {hasReachedLimit && <span className="text-red-600 font-semibold">Limite atteinte</span>}
          </div>
          {loadingError && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4" />
              {loadingError}
            </div>
          )}
        </div>

        {isFree && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/80">Accès Premium requis</p>
              <h2 className="text-xl font-bold">2 séminaires inclus par an</h2>
              <p className="text-white/90 mt-2">Passez Premium (50€/mois facturés annuellement) pour réserver vos places en présentiel.</p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="bg-white text-amber-600 px-5 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
            >
              Activer le Premium
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seminars.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-5 text-gray-600">
              Aucun séminaire n'est disponible pour le moment.
            </div>
          )}

          {seminars.map((seminar) => {
            const isRegistered = userRegistrations.some((r) => r.seminar_id === seminar.id || r.id === seminar.id)
            const seminarRegistrations = allRegistrations.filter((registration) => registration.seminar_id === seminar.id)
            const isFull = seminar.capacity ? seminarRegistrations.length >= seminar.capacity : false
            return (
              <div key={seminar.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{seminar.theme}</p>
                    <h3 className="font-semibold text-gray-900">{seminar.title}</h3>
                  </div>
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span>{new Date(seminar.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span>{seminar.location}</span>
                </div>
                <div className="text-sm text-gray-700">Encadrement : {seminar.facilitator}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Inscription limitée à 2 séminaires/an</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-4 w-4 text-primary-600" />
                  <span>
                    {seminar.capacity
                      ? `${seminarRegistrations.length}/${seminar.capacity} places réservées`
                      : `${seminarRegistrations.length} inscription${seminarRegistrations.length > 1 ? 's' : ''}`}
                  </span>
                  {isFull && <span className="text-red-600 font-semibold">Complet</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isRegistered ? (
                    <button
                      onClick={() => handleRegister(seminar.id)}
                      disabled={isFree || hasReachedLimit || isFull}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition flex items-center justify-center gap-2 ${
                        isFree
                          ? 'border-dashed border-gray-200 text-gray-400'
                          : hasReachedLimit
                            ? 'border-red-200 text-red-600 bg-red-50'
                            : isFull
                              ? 'border-red-200 text-red-600 bg-red-50'
                              : 'border-primary-200 text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      {isFree ? 'Premium requis' : hasReachedLimit ? 'Limite atteinte' : isFull ? 'Complet' : 'Réserver ma place'}
                    </button>
                  ) : (
                    <>
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 cursor-default"
                      >
                        Déjà inscrit
                      </button>
                      <button
                        onClick={() => handleUnregister(seminar.id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                      >
                        Se désinscrire
                      </button>
                    </>
                  )}
                </div>
                {profile?.role === 'admin' && (
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Inscriptions ({seminarRegistrations.length}{seminar.capacity ? `/${seminar.capacity}` : ''})</div>
                    {seminarRegistrations.length === 0 ? (
                      <p className="text-xs text-gray-500">Aucun inscrit pour le moment.</p>
                    ) : (
                      <ul className="space-y-1">
                        {seminarRegistrations.map((registration) => (
                          <li key={registration.id} className="flex items-center justify-between text-sm text-gray-700">
                            <span>{registration.user_name || 'Participant'}</span>
                            {registration.user_email && <span className="text-gray-500 text-xs">{registration.user_email}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {profile?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <PenSquare className="h-4 w-4 text-primary-600" />
              Ajouter un séminaire
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Titre"
                value={newSeminar.title}
                onChange={(e) => setNewSeminar({ ...newSeminar, title: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={newSeminar.date}
                onChange={(e) => setNewSeminar({ ...newSeminar, date: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Lieu"
                value={newSeminar.location}
                onChange={(e) => setNewSeminar({ ...newSeminar, location: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Thème"
                value={newSeminar.theme || ''}
                onChange={(e) => setNewSeminar({ ...newSeminar, theme: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Encadré par"
                value={newSeminar.facilitator || ''}
                onChange={(e) => setNewSeminar({ ...newSeminar, facilitator: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                min={1}
                placeholder="Nombre de places"
                value={newSeminar.capacity ?? ''}
                onChange={(e) =>
                  setNewSeminar({ ...newSeminar, capacity: e.target.value ? parseInt(e.target.value, 10) : null })
                }
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handleAddSeminar}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
            >
              <Plus className="h-4 w-4" />
              Publier le séminaire
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
