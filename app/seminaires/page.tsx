'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, User, Plus, CheckCircle, Users, PenSquare, AlertTriangle, Info, X } from 'lucide-react'
import { formatCycleWindow, getCurrentSubscriptionCycle, isDateWithinCycle } from '@/utils/subscriptionCycle'

// Fonction pour extraire l'ID Vimeo de l'URL
const extractVimeoId = (url: string): string | null => {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

interface Seminar {
  id: string
  title: string
  date: string
  start_date?: string | null
  end_date?: string | null
  location: string
  theme: string | null
  facilitator: string | null
  created_by?: string | null
  capacity?: number | null
  image_url?: string | null
  program?: string | null
  teaser_video_url?: string | null
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
  const [editingSeminarId, setEditingSeminarId] = useState<string | null>(null)
  const [editedSeminar, setEditedSeminar] = useState<Seminar | null>(null)
  const [newSeminar, setNewSeminar] = useState<Seminar>({
    id: '',
    title: '',
    date: '',
    start_date: '',
    end_date: '',
    location: '',
    theme: '',
    facilitator: '',
    capacity: null,
    image_url: '',
    program: '',
    teaser_video_url: ''
  })
  const [userRegistrations, setUserRegistrations] = useState<SeminarRegistration[]>([])
  const [allRegistrations, setAllRegistrations] = useState<SeminarRegistration[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false)
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false)
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null)

  const fallbackSeminars: Seminar[] = [
    {
      id: 'fallback-1',
      title: 'Séminaire clinique - Membres supérieurs',
      date: '2025-04-18',
      start_date: '2025-04-18',
      end_date: '2025-04-19',
      location: 'Lyon',
      theme: 'Épaule & coude : trajectoires décisionnelles',
      facilitator: 'Gérald Stoppini',
      capacity: 28
    },
    {
      id: 'fallback-2',
      title: 'Rachis et chaînes fasciales',
      date: '2025-06-12',
      start_date: '2025-06-12',
      end_date: '2025-06-14',
      location: 'Bordeaux',
      theme: 'Rachis lombaire et thoracique - cas complexes',
      facilitator: 'Kevin Thubert',
      capacity: 22
    }
  ]

  const uploadSeminarImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/seminar-image-upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Le téléchargement a échoué')
    }

    const data = await response.json()
    return data.url as string
  }

  const formatSeminarDates = (seminar: Seminar) => {
    const startDate = seminar.start_date || seminar.date
    const endDate = seminar.end_date

    if (!startDate) return 'Dates à confirmer'

    const start = new Date(startDate)

    if (!endDate) {
      return start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const end = new Date(endDate)
    const sameMonthAndYear =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()

    if (sameMonthAndYear) {
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric' })} - ${end.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`
    }

    const sameYear = start.getFullYear() === end.getFullYear()

    if (sameYear) {
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`
    }

    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString(
      'fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' }
    )}`
  }

  const handleNewImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingNewImage(true)
    try {
      const imageUrl = await uploadSeminarImage(file)
      setNewSeminar((prev) => ({ ...prev, image_url: imageUrl }))
    } catch (err) {
      console.error("Erreur lors de l'upload de l'image du séminaire:", err)
      alert("Impossible de téléverser l'image pour le moment. Merci de réessayer plus tard.")
    } finally {
      setIsUploadingNewImage(false)
      event.target.value = ''
    }
  }

  const handleEditImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editedSeminar) return

    setIsUploadingEditImage(true)
    try {
      const imageUrl = await uploadSeminarImage(file)
      setEditedSeminar((prev) => (prev ? { ...prev, image_url: imageUrl } : prev))
    } catch (err) {
      console.error("Erreur lors de l'upload de l'image du séminaire:", err)
      alert("Impossible de téléverser l'image pour le moment. Merci de réessayer plus tard.")
    } finally {
      setIsUploadingEditImage(false)
      event.target.value = ''
    }
  }

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

      if (seminarsError) {
        console.warn('Chargement des séminaires en mode secours :', seminarsError.message)
        setLoadingError('Les séminaires utilisent un jeu de données local car la table Supabase est absente ou inaccessible.')
        setSeminars(fallbackSeminars)
      } else {
        const sortedSeminars = (seminarsData || []).sort((a: Seminar, b: Seminar) => {
          const startA = a.start_date || a.date
          const startB = b.start_date || b.date

          if (!startA || !startB) return 0
          return new Date(startA).getTime() - new Date(startB).getTime()
        })

        setSeminars(sortedSeminars)
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

  const currentCycle = useMemo(
    () => getCurrentSubscriptionCycle(profile?.subscription_start_date || profile?.created_at),
    [profile?.subscription_start_date, profile?.created_at]
  )
  const cycleRegistrations = userRegistrations.filter((r) => isDateWithinCycle(r.registeredAt, currentCycle))
  const hasReachedLimit = cycleRegistrations.length >= 1

  // Vérifier si l'abonnement Gold est actif
  const isGoldActive = useMemo(() => {
    if (profile?.role === 'admin') return true
    if (profile?.role !== 'premium_gold') return false

    const isActive = profile?.subscription_status === 'active'
    const now = new Date()
    const endDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null
    const isExpired = endDate && now > endDate

    return isActive && !isExpired
  }, [profile?.role, profile?.subscription_status, profile?.subscription_end_date])

  const handleRegister = async (id: string) => {
    // Vérifier le rôle Gold (admin toujours autorisé)
    if (profile?.role !== 'premium_gold' && profile?.role !== 'admin') {
      alert('Inscription réservée aux membres Premium Gold uniquement')
      return
    }

    // Vérifier que l'abonnement Gold est actif (sauf pour admin)
    if (profile?.role === 'premium_gold') {
      const isActive = profile?.subscription_status === 'active'
      const now = new Date()
      const endDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null
      const isExpired = endDate && now > endDate

      if (!isActive || isExpired) {
        alert('Votre abonnement Premium Gold a expiré. Veuillez renouveler votre abonnement pour accéder aux séminaires.')
        return
      }
    }

    if (hasReachedLimit) {
      alert("Vous avez atteint la limite d'1 séminaire (2 jours) pour ce cycle d'abonnement")
      return
    }

    const targetSeminar = seminars.find((seminar) => seminar.id === id)
    const seminarRegistrations = allRegistrations.filter((registration) => registration.seminar_id === id)
    const seminarDateLabel = targetSeminar ? formatSeminarDates(targetSeminar) : undefined

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

    // Déclencher l'automatisation "Inscription à un séminaire"
    try {
      await fetch('/api/automations/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id,
          triggerEvent: 'Inscription à un séminaire',
          metadata: {
            seminar_id: id,
            seminar_title: targetSeminar?.title,
            seminar_date: seminarDateLabel
          }
        })
      })
    } catch (err) {
      console.error('Erreur lors du déclenchement de l\'automatisation:', err)
    }

    alert('Inscription confirmée !')
  }

  const handleUnregister = async (id: string) => {
    const registrationToRemove = userRegistrations.find((registration) => registration.seminar_id === id)

    if (!registrationToRemove) {
      alert("Vous n'êtes pas inscrit à ce séminaire")
      return
    }

    const targetSeminar = seminars.find((seminar) => seminar.id === id)
    const seminarDateLabel = targetSeminar ? formatSeminarDates(targetSeminar) : undefined

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

    // Déclencher l'automatisation "Désinscription d'un séminaire"
    try {
      await fetch('/api/automations/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id,
          triggerEvent: 'Désinscription d\'un séminaire',
          metadata: {
            seminar_id: id,
            seminar_title: targetSeminar?.title,
            seminar_date: seminarDateLabel
          }
        })
      })
    } catch (err) {
      console.error('Erreur lors du déclenchement de l\'automatisation:', err)
    }

    alert('Votre inscription a été annulée')
  }

  const handleAddSeminar = async () => {
    if (profile?.role !== 'admin') return
    const startDate = newSeminar.start_date || newSeminar.date
    const endDate = newSeminar.end_date

    if (!newSeminar.title || !startDate) {
      alert('Merci de renseigner un titre et une date de début')
      return
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert('La date de fin doit être postérieure ou égale à la date de début')
      return
    }

    const capacity = newSeminar.capacity ?? null

    const payload = {
      title: newSeminar.title,
      date: startDate,
      start_date: startDate,
      end_date: endDate || null,
      location: newSeminar.location,
      theme: newSeminar.theme,
      facilitator: newSeminar.facilitator,
      capacity,
      image_url: newSeminar.image_url || null,
      program: newSeminar.program || null,
      teaser_video_url: newSeminar.teaser_video_url || null,
      created_by: profile?.id
    }

    const { data, error } = await supabase.from('seminars').insert(payload).select('*').single()

    if (error) {
      console.warn('Ajout du séminaire en mode local :', error.message)
      setSeminars((prev) => [
        ...prev,
        { ...newSeminar, id: `${Date.now()}`, capacity, date: startDate, start_date: startDate, end_date: endDate }
      ])
    } else if (data) {
      setSeminars((prev) => [...prev, data])
    }

    setNewSeminar({
      id: '',
      title: '',
      date: '',
      start_date: '',
      end_date: '',
      location: '',
      theme: '',
      facilitator: '',
      capacity: null,
      image_url: '',
      program: '',
      teaser_video_url: ''
    })
  }

  const handleStartEdit = (seminar: Seminar) => {
    if (profile?.role !== 'admin') return
    setEditingSeminarId(seminar.id)
    setEditedSeminar({ ...seminar })
  }

  const handleUpdateSeminar = async () => {
    if (!editingSeminarId || !editedSeminar || profile?.role !== 'admin') return
    const startDate = editedSeminar.start_date || editedSeminar.date
    const endDate = editedSeminar.end_date

    if (!editedSeminar.title || !startDate) {
      alert('Merci de renseigner un titre et une date de début')
      return
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert('La date de fin doit être postérieure ou égale à la date de début')
      return
    }

    const capacity = editedSeminar.capacity ?? null
    const payload = {
      title: editedSeminar.title,
      date: startDate,
      start_date: startDate,
      end_date: endDate || null,
      location: editedSeminar.location,
      theme: editedSeminar.theme,
      facilitator: editedSeminar.facilitator,
      capacity,
      image_url: editedSeminar.image_url || null,
      program: editedSeminar.program || null,
      teaser_video_url: editedSeminar.teaser_video_url || null
    }

    const { data, error } = await supabase
      .from('seminars')
      .update(payload)
      .eq('id', editingSeminarId)
      .select('*')
      .single()

    if (error) {
      console.warn('Mise à jour locale du séminaire :', error.message)
    }

    const updatedSeminar = data || { ...editedSeminar, ...payload }

    setSeminars((prev) => prev.map((seminar) => (seminar.id === editingSeminarId ? updatedSeminar : seminar)))

    setEditingSeminarId(null)
    setEditedSeminar(null)
  }

  const handleDeleteSeminar = async (id: string) => {
    if (profile?.role !== 'admin') return
    if (!confirm('Supprimer définitivement ce séminaire ?')) return

    const { error } = await supabase.from('seminars').delete().eq('id', id)

    if (error) {
      console.warn('Suppression locale du séminaire :', error.message)
    }

    setSeminars((prev) => prev.filter((seminar) => seminar.id !== id))
    setUserRegistrations((prev) => prev.filter((registration) => registration.seminar_id !== id))
    setAllRegistrations((prev) => prev.filter((registration) => registration.seminar_id !== id))

    if (editingSeminarId === id) {
      setEditingSeminarId(null)
      setEditedSeminar(null)
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

  const isFree = profile?.role === 'free'

  // Composant Modal pour afficher les détails du séminaire
  const SeminarModal = () => {
    if (!selectedSeminar) return null

    const vimeoId = extractVimeoId(selectedSeminar.teaser_video_url || '')

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedSeminar(null)}>
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">{selectedSeminar.title}</h2>
              <p className="text-primary-100 text-sm">{selectedSeminar.theme}</p>
            </div>
            <button
              onClick={() => setSelectedSeminar(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Vidéo Vimeo */}
            {vimeoId && (
              <div className="relative w-full aspect-video bg-gray-900">
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={`Vidéo teaser - ${selectedSeminar.title}`}
                ></iframe>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Informations pratiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Dates</p>
                    <p className="font-medium">{formatSeminarDates(selectedSeminar)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Lieu</p>
                    <p className="font-medium">{selectedSeminar.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Encadrement</p>
                    <p className="font-medium">{selectedSeminar.facilitator}</p>
                  </div>
                </div>
                {selectedSeminar.capacity && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="h-5 w-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Capacité</p>
                      <p className="font-medium">{selectedSeminar.capacity} places</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Programme */}
              {selectedSeminar.program && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="h-1 w-8 bg-primary-600 rounded"></div>
                    Programme du séminaire
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedSeminar.program }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout>
      {selectedSeminar && <SeminarModal />}
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Calendar className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs font-semibold text-amber-100">
                  Séminaires Présentiels
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-100">
                Rencontres en présentiel
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Réservés aux abonnés Premium Gold <strong>actifs uniquement</strong>. Vous pouvez vous inscrire à <strong>1 séminaire maximum par période d'abonnement de 12 mois</strong>, calculée depuis votre date de souscription.
              </p>

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <Users className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-semibold">
                    {cycleRegistrations.length}/1 inscription autorisée entre {formatCycleWindow(currentCycle)}
                  </span>
                </div>
                {hasReachedLimit && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
                    Limite atteinte
                  </span>
                )}
              </div>

              {loadingError && (
                <div className="flex items-center gap-2 text-xs bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2 text-amber-100 mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  {loadingError}
                </div>
              )}
            </div>
          </div>
        </div>

        {(isFree || profile?.role === 'premium_silver') && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/80">Accès Premium Gold requis</p>
              <h2 className="text-xl font-bold">Séminaires présentiels inclus</h2>
              <p className="text-white/90 mt-2">
                {isFree
                  ? 'Passez Premium Gold pour accéder aux séminaires en présentiel avec Gérald Stoppini et Kevin Thubert.'
                  : 'Passez à Premium Gold pour débloquer l\'accès aux séminaires présentiels. Votre abonnement Silver vous donne accès à tout le contenu en ligne.'
                }
              </p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="bg-white text-amber-600 px-5 py-3 rounded-lg font-semibold hover:bg-white/90 transition whitespace-nowrap"
            >
              {isFree ? 'Activer Premium' : 'Passer à Gold'}
            </button>
          </div>
        )}

        {profile?.role === 'premium_gold' && !isGoldActive && (
          <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/80">Abonnement expiré</p>
              <h2 className="text-xl font-bold">Votre abonnement Premium Gold a expiré</h2>
              <p className="text-white/90 mt-2">
                Pour continuer à accéder aux séminaires présentiels, veuillez renouveler votre abonnement Premium Gold.
              </p>
            </div>
            <button
              onClick={() => router.push('/settings/subscription')}
              className="bg-white text-red-600 px-5 py-3 rounded-lg font-semibold hover:bg-white/90 transition whitespace-nowrap"
            >
              Renouveler
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
                {seminar.image_url && (
                  <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={seminar.image_url}
                      alt={`Visuel du séminaire ${seminar.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span>{formatSeminarDates(seminar)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span>{seminar.location}</span>
                </div>
                <div className="text-sm text-gray-700">Encadrement : {seminar.facilitator}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Inscription limitée à 1 séminaire (2 jours) par cycle</span>
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
                <div className="flex flex-col gap-2">
                  {/* Bouton Plus d'info */}
                  {(seminar.program || seminar.teaser_video_url) && (
                    <button
                      onClick={() => setSelectedSeminar(seminar)}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold border-2 border-primary-200 text-primary-700 bg-primary-50/50 hover:bg-primary-100 hover:border-primary-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Info className="h-4 w-4" />
                      Plus d'info
                    </button>
                  )}

                  {/* Bouton Réserver ma place */}
                  {!isRegistered ? (
                    <button
                      onClick={() => handleRegister(seminar.id)}
                      disabled={isFree || profile?.role === 'premium_silver' || !isGoldActive || hasReachedLimit || isFull}
                      className={`w-full px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                        isFree || profile?.role === 'premium_silver'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-300'
                          : profile?.role === 'premium_gold' && !isGoldActive
                            ? 'bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed'
                            : hasReachedLimit
                              ? 'bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed'
                              : isFull
                                ? 'bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-lg transform hover:scale-[1.02]'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                      {isFree
                        ? 'Gold requis'
                        : profile?.role === 'premium_silver'
                          ? 'Gold requis'
                          : profile?.role === 'premium_gold' && !isGoldActive
                            ? 'Abonnement expiré'
                            : hasReachedLimit
                              ? 'Limite atteinte'
                              : isFull
                                ? 'Complet'
                                : 'Réserver ma place'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        disabled
                        className="w-full px-6 py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md cursor-default flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Déjà inscrit
                      </button>
                      <button
                        onClick={() => handleUnregister(seminar.id)}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                      >
                        Se désinscrire
                      </button>
                    </div>
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {editingSeminarId === seminar.id ? (
                        <>
                          <button
                            onClick={handleUpdateSeminar}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => {
                              setEditingSeminarId(null)
                              setEditedSeminar(null)
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(seminar)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteSeminar(seminar.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                    {editingSeminarId === seminar.id && editedSeminar && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editedSeminar.title}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, title: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm"
                          placeholder="Titre"
                        />
                        <input
                          type="date"
                          value={editedSeminar.start_date || editedSeminar.date}
                          onChange={(e) =>
                            setEditedSeminar({ ...editedSeminar, start_date: e.target.value, date: e.target.value })
                          }
                          className="px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          value={editedSeminar.end_date || ''}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, end_date: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={editedSeminar.location}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, location: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm"
                          placeholder="Lieu"
                        />
                        <input
                          type="text"
                          value={editedSeminar.theme || ''}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, theme: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm"
                          placeholder="Thème"
                        />
                        <input
                          type="text"
                          value={editedSeminar.facilitator || ''}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, facilitator: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm"
                          placeholder="Encadré par"
                        />
                        <input
                          type="number"
                          min={1}
                          value={editedSeminar.capacity ?? ''}
                          onChange={(e) =>
                            setEditedSeminar({ ...editedSeminar, capacity: e.target.value ? parseInt(e.target.value, 10) : null })
                          }
                          className="px-3 py-2 border rounded-lg text-sm"
                          placeholder="Nombre de places"
                        />
                        <input
                          type="text"
                          value={editedSeminar.teaser_video_url || ''}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, teaser_video_url: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm md:col-span-2"
                          placeholder="URL vidéo teaser Vimeo (ex: https://vimeo.com/123456789)"
                        />
                        <textarea
                          value={editedSeminar.program || ''}
                          onChange={(e) => setEditedSeminar({ ...editedSeminar, program: e.target.value })}
                          className="px-3 py-2 border rounded-lg text-sm md:col-span-2 min-h-[120px]"
                          placeholder="Programme du séminaire (HTML supporté)"
                        />
                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          {editedSeminar.image_url && (
                            <img
                              src={editedSeminar.image_url}
                              alt={`Illustration du séminaire ${editedSeminar.title}`}
                              className="h-16 w-24 object-cover rounded-lg border border-gray-200"
                            />
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditImageChange}
                              className="hidden"
                              disabled={isUploadingEditImage}
                            />
                            {isUploadingEditImage ? 'Téléversement...' : 'Modifier la photo'}
                          </label>
                          {editedSeminar.image_url && (
                            <button
                              onClick={() => setEditedSeminar({ ...editedSeminar, image_url: '' })}
                              className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                              Retirer la photo
                            </button>
                          )}
                        </div>
                      </div>
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
                value={newSeminar.start_date || newSeminar.date}
                onChange={(e) => setNewSeminar({ ...newSeminar, start_date: e.target.value, date: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={newSeminar.end_date || ''}
                onChange={(e) => setNewSeminar({ ...newSeminar, end_date: e.target.value })}
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
              <input
                type="text"
                placeholder="URL vidéo teaser Vimeo (ex: https://vimeo.com/123456789)"
                value={newSeminar.teaser_video_url || ''}
                onChange={(e) => setNewSeminar({ ...newSeminar, teaser_video_url: e.target.value })}
                className="px-3 py-2 border rounded-lg md:col-span-2"
              />
              <textarea
                placeholder="Programme du séminaire (HTML supporté)"
                value={newSeminar.program || ''}
                onChange={(e) => setNewSeminar({ ...newSeminar, program: e.target.value })}
                className="px-3 py-2 border rounded-lg md:col-span-2 min-h-[120px]"
              />
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                {newSeminar.image_url && (
                  <img
                    src={newSeminar.image_url}
                    alt={`Illustration du séminaire ${newSeminar.title}`}
                    className="h-16 w-24 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewImageChange}
                    className="hidden"
                    disabled={isUploadingNewImage}
                  />
                  {isUploadingNewImage ? 'Téléversement...' : 'Ajouter une photo'}
                </label>
                {newSeminar.image_url && (
                  <button
                    onClick={() => setNewSeminar({ ...newSeminar, image_url: '' })}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
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
