'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { Dumbbell, Download, Edit, Plus, Save, Search, Trash2, X } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface RehabExercise {
  id: string
  name: string
  region: string
  type: string
  level: number
  nerve_target?: string | null
  description: string
  progression_regression?: string | null
  is_active: boolean
}

interface PlanItem {
  uid: string
  exerciseId: string
  repetitions: string
  holdTime: string
  sets: string
  rest: string
  comment: string
}

const ALLOWED_ROLES = ['premium_silver', 'premium_gold', 'admin']

const EMPTY_PLAN_ITEM = (exerciseId: string): PlanItem => ({
  uid: `${exerciseId}-${Date.now()}`,
  exerciseId,
  repetitions: '10',
  holdTime: '',
  sets: '3',
  rest: '45s',
  comment: ''
})

const EMPTY_PATIENT = {
  firstName: '',
  lastName: '',
  age: '',
  reason: '',
  notes: ''
}

const EMPTY_EXERCISE_FORM = {
  name: '',
  region: '',
  type: '',
  level: 1,
  nerve_target: '',
  description: '',
  progression_regression: '',
  is_active: true
}

const EXERCISE_ILLUSTRATIONS: Record<string, string> = {
  renforcement: '/exercices/renforcement.svg',
  mobilisation: '/exercices/mobilisation.svg',
  etirement: '/exercices/etirement.svg',
  étirement: '/exercices/etirement.svg',
  stabilisation: '/exercices/stabilisation.svg',
  respiration: '/exercices/respiration.svg',
  defaut: '/exercices/defaut.svg'
}

const getExerciseIllustration = (exercise: RehabExercise) => {
  const typeKey = exercise.type?.toLowerCase() || ''
  const matchedKey = Object.keys(EXERCISE_ILLUSTRATIONS).find((key) => key !== 'defaut' && typeKey.includes(key))
  return EXERCISE_ILLUSTRATIONS[matchedKey || 'defaut']
}

const loadImageData = async (path: string) => {
  const response = await fetch(path)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function ExercisesModule() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [exercises, setExercises] = useState<RehabExercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<PlanItem[]>([])
  const [patientInfo, setPatientInfo] = useState({ ...EMPTY_PATIENT })

  const [exerciseForm, setExerciseForm] = useState({ ...EMPTY_EXERCISE_FORM })
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userResponse } = await supabase.auth.getUser()
        const user = userResponse?.user

        if (!user) {
          setAccessDenied(true)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        if (!profileData || !ALLOWED_ROLES.includes(profileData.role)) {
          setAccessDenied(true)
          return
        }

        await fetchExercises()
      } catch (error) {
        console.error('Erreur de chargement du module exercices', error)
        setAccessDenied(true)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('rehab_exercises')
      .select('*')
      .order('region', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.warn('Impossible de charger les exercices Supabase, utilisation de données locales', error.message)
      setExercises([
        {
          id: 'fallback-1',
          name: 'Renforcement gainage lombaire',
          region: 'lombaire',
          type: 'renforcement',
          level: 1,
          description: 'Gainage quadrupédie avec activation transverse',
          is_active: true,
          progression_regression: 'Progression: ajouter instabilité. Régression: soutien sur un genou.'
        },
        {
          id: 'fallback-2',
          name: 'Mobilisation épaule',
          region: 'epaule',
          type: 'mobilisation',
          level: 1,
          description: 'Mobilisation active assistée en flexion avec bâton',
          is_active: true,
          progression_regression: 'Progression: ajouter charge légère.',
          nerve_target: null
        }
      ])
      return
    }

    setExercises((data as RehabExercise[]) || [])
  }

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const haystack = `${exercise.name} ${exercise.region} ${exercise.type}`.toLowerCase()
      const matchesSearch = haystack.includes(searchTerm.toLowerCase())
      const matchesRegion = !filterRegion || exercise.region === filterRegion
      const matchesType = !filterType || exercise.type === filterType
      return matchesSearch && matchesRegion && matchesType && exercise.is_active
    })
  }, [exercises, searchTerm, filterRegion, filterType])

  const regionOptions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(exercises.map((ex) => ex.region).filter(Boolean)))
    return uniqueRegions.sort()
  }, [exercises])

  const typeOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(exercises.map((ex) => ex.type).filter(Boolean)))
    return uniqueTypes.sort()
  }, [exercises])

  const addToPlan = (exerciseId: string) => {
    setSelectedExercises((prev) => [...prev, EMPTY_PLAN_ITEM(exerciseId)])
  }

  const removeFromPlan = (uid: string) => {
    setSelectedExercises((prev) => prev.filter((item) => item.uid !== uid))
  }

  const updatePlanItem = (uid: string, field: keyof PlanItem, value: string) => {
    setSelectedExercises((prev) => prev.map((item) => (item.uid === uid ? { ...item, [field]: value } : item)))
  }

  const exportToPDF = async () => {
    if (!selectedExercises.length) {
      alert('Ajoutez au moins un exercice avant de générer le PDF')
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Fiche d'exercices", 14, 18)

    doc.setFontSize(11)
    doc.text(`Patient : ${patientInfo.firstName} ${patientInfo.lastName}`, 14, 28)
    if (patientInfo.age) doc.text(`Âge : ${patientInfo.age} ans`, 14, 34)
    if (patientInfo.reason) doc.text(`Motif : ${patientInfo.reason}`, 14, 40)
    if (patientInfo.notes) doc.text(`Informations générales : ${patientInfo.notes}`, 14, 46)

    ;(doc as any).autoTable({
      startY: 54,
      head: [['Exercice', 'Description', 'Répétitions / Temps', 'Séries', 'Repos', 'Commentaire']],
      body: selectedExercises.map((item) => {
        const exercise = exercises.find((ex) => ex.id === item.exerciseId)
        return [
          exercise?.name || 'Exercice',
          exercise?.description || '',
          item.repetitions || item.holdTime || '-',
          item.sets || '-',
          item.rest || '-',
          item.comment || ''
        ]
      }),
      styles: { fontSize: 9, cellPadding: 2 }
    })

    let cursorY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(13)
    doc.text('Détails et illustrations', 14, cursorY)
    cursorY += 8

    const illustrationCache = new Map<string, string>()

    for (const item of selectedExercises) {
      const exercise = exercises.find((ex) => ex.id === item.exerciseId)
      if (!exercise) continue

      if (cursorY > 250) {
        doc.addPage()
        cursorY = 18
      }

      doc.setFontSize(12)
      doc.text(exercise.name, 14, cursorY)
      cursorY += 6

      let imageData = ''
      const illustrationPath = getExerciseIllustration(exercise)
      try {
        if (illustrationCache.has(illustrationPath)) {
          imageData = illustrationCache.get(illustrationPath) || ''
        } else {
          imageData = await loadImageData(illustrationPath)
          illustrationCache.set(illustrationPath, imageData)
        }
      } catch {
        imageData = ''
      }

      if (imageData) {
        doc.addImage(imageData, 'SVG', 14, cursorY, 40, 28)
      }

      const textStartX = imageData ? 60 : 14
      const descriptionLines = doc.splitTextToSize(`Description : ${exercise.description}`, 140)
      doc.setFontSize(10)
      doc.text(descriptionLines, textStartX, cursorY + 6)

      let detailLineY = cursorY + 6 + descriptionLines.length * 5
      const setupLine = `Consignes : ${item.repetitions || '-'} • Séries ${item.sets || '-'} • Repos ${item.rest || '-'}`
      doc.text(doc.splitTextToSize(setupLine, 140), textStartX, detailLineY)
      detailLineY += 6

      if (exercise.progression_regression) {
        const progressionLines = doc.splitTextToSize(`Progression / régression : ${exercise.progression_regression}`, 140)
        doc.text(progressionLines, textStartX, detailLineY)
        detailLineY += progressionLines.length * 5
      }

      if (item.comment) {
        const commentLines = doc.splitTextToSize(`Commentaire : ${item.comment}`, 140)
        doc.text(commentLines, textStartX, detailLineY)
        detailLineY += commentLines.length * 5
      }

      cursorY = Math.max(cursorY + 34, detailLineY + 8)
    }

    doc.save('fiche-exercices.pdf')
  }

  const resetExerciseForm = () => {
    setExerciseForm({ ...EMPTY_EXERCISE_FORM })
    setEditingExerciseId(null)
  }

  const handleSaveExercise = async () => {
    if (profile?.role !== 'admin') return

    setFeedback(null)
    const payload = {
      ...exerciseForm,
      level: Number(exerciseForm.level) || 1,
      nerve_target: exerciseForm.nerve_target || null,
      progression_regression: exerciseForm.progression_regression || null
    }

    const { error } = editingExerciseId
      ? await supabase.from('rehab_exercises').update(payload).eq('id', editingExerciseId)
      : await supabase.from('rehab_exercises').insert(payload)

    if (error) {
      setFeedback("Impossible d'enregistrer l'exercice : " + error.message)
      return
    }

    setFeedback(editingExerciseId ? 'Exercice mis à jour' : 'Exercice ajouté')
    resetExerciseForm()
    await fetchExercises()
  }

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Supprimer définitivement cet exercice ?')) return

    const { error } = await supabase.from('rehab_exercises').delete().eq('id', id)
    if (error) {
      setFeedback('Suppression impossible : ' + error.message)
      return
    }

    setFeedback('Exercice supprimé')
    await fetchExercises()
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-80 text-gray-500">Chargement du module…</div>
      </AuthLayout>
    )
  }

  if (accessDenied) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <X className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Accès réservé</h2>
          </div>
          <p className="mt-2 text-gray-600">
            Le module exercices est réservé aux membres Premium Silver/Gold et aux administrateurs.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-xs font-semibold text-emerald-100">
                  Module Exercices
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-100">
                Planifier et exporter une fiche
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Sélectionnez des exercices, personnalisez les paramètres puis exportez en PDF pour le patient.
              </p>

              {/* Action button */}
              <button
                onClick={() => void exportToPDF()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
              >
                <Download className="h-4 w-4" />
                Exporter en PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900">Informations patient</h2>
            <p className="text-sm text-gray-500">Aucune sauvegarde en ligne, uniquement pour la fiche PDF.</p>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-600">Prénom</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    value={patientInfo.firstName}
                    onChange={(e) => setPatientInfo({ ...patientInfo, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nom</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    value={patientInfo.lastName}
                    onChange={(e) => setPatientInfo({ ...patientInfo, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-600">Âge</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    value={patientInfo.age}
                    onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Motif</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    value={patientInfo.reason}
                    onChange={(e) => setPatientInfo({ ...patientInfo, reason: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Informations générales</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={patientInfo.notes}
                  onChange={(e) => setPatientInfo({ ...patientInfo, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Fiche patient</h2>
                <p className="text-sm text-gray-500">Ajustez répétitions, séries, repos et commentaires pour chaque exercice.</p>
              </div>
              {selectedExercises.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedExercises.length} exercice(s) sélectionné(s)
                </div>
              )}
            </div>

            {selectedExercises.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
                Ajoutez des exercices depuis le catalogue pour constituer la fiche.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {selectedExercises.map((item) => {
                  const exercise = exercises.find((ex) => ex.id === item.exerciseId)
                  return (
                    <div key={item.uid} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          {exercise && (
                            <img
                              src={getExerciseIllustration(exercise)}
                              alt={`Illustration ${exercise.name}`}
                              className="h-16 w-16 rounded-lg border border-gray-100 object-cover"
                            />
                          )}
                          <div>
                          <h3 className="text-base font-semibold text-gray-900">{exercise?.name}</h3>
                          <p className="text-sm text-gray-600">{exercise?.description}</p>
                          {exercise?.progression_regression && (
                            <p className="mt-1 text-xs text-gray-500">{exercise.progression_regression}</p>
                          )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromPlan(item.uid)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div>
                          <label className="text-sm text-gray-600">Répétitions / temps</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={item.repetitions}
                            onChange={(e) => updatePlanItem(item.uid, 'repetitions', e.target.value)}
                            placeholder="ex: 12 ou 30s"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Séries</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={item.sets}
                            onChange={(e) => updatePlanItem(item.uid, 'sets', e.target.value)}
                            placeholder="ex: 3"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Repos</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={item.rest}
                            onChange={(e) => updatePlanItem(item.uid, 'rest', e.target.value)}
                            placeholder="ex: 45s"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Commentaire</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={item.comment}
                            onChange={(e) => updatePlanItem(item.uid, 'comment', e.target.value)}
                            placeholder="Consigne, douleur max…"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Catalogue des exercices</h2>
              <p className="text-sm text-gray-500">Sélectionnez un exercice pour l'ajouter à la fiche.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Rechercher un exercice"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-40"
              >
                <option value="">Toutes les régions</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region} className="capitalize">
                    {region}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-40"
              >
                <option value="">Tous les types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredExercises.map((exercise) => (
              <div key={exercise.id} className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="space-y-2">
                  <img
                    src={getExerciseIllustration(exercise)}
                    alt={`Illustration ${exercise.name}`}
                    className="h-28 w-full rounded-lg border border-gray-100 object-cover"
                  />
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{exercise.name}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Niveau {exercise.level}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{exercise.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="mr-2 rounded-full bg-gray-100 px-2 py-1">{exercise.region}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">{exercise.type}</span>
                  </div>
                  {exercise.progression_regression && (
                    <p className="text-xs text-gray-500">{exercise.progression_regression}</p>
                  )}
                </div>
                <button
                  onClick={() => addToPlan(exercise.id)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black"
                >
                  <Plus className="h-4 w-4" /> Ajouter à la fiche
                </button>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
              Aucun exercice ne correspond à votre recherche.
            </div>
          )}
        </div>

        {profile?.role === 'admin' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Dumbbell className="h-4 w-4" />
              <span>Gestion administrateur</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Ajouter ou modifier un exercice</h2>
              {feedback && <span className="text-sm text-green-600">{feedback}</span>}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm text-gray-600">Nom</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Région</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.region}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, region: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.type}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Niveau (1-3)</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.level}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, level: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Cible nerveuse (optionnel)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.nerve_target}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, nerve_target: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Progression / régression</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.progression_regression}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, progression_regression: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-sm text-gray-600">Description</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  value={exerciseForm.description}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={exerciseForm.is_active}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm text-gray-600">Actif</label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleSaveExercise}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                {editingExerciseId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingExerciseId ? 'Mettre à jour' : 'Ajouter'}
              </button>
              {editingExerciseId && (
                <button
                  onClick={resetExerciseForm}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </button>
              )}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 font-medium text-gray-700">Nom</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Région</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Type</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Niveau</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Statut</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exercises.map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="px-3 py-2">{exercise.name}</td>
                      <td className="px-3 py-2 capitalize text-gray-600">{exercise.region}</td>
                      <td className="px-3 py-2 text-gray-600">{exercise.type}</td>
                      <td className="px-3 py-2 text-gray-600">{exercise.level}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${exercise.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {exercise.is_active ? 'Actif' : 'Archivé'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingExerciseId(exercise.id)
                              setExerciseForm({ ...exercise, nerve_target: exercise.nerve_target || '', progression_regression: exercise.progression_regression || '' })
                            }}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
