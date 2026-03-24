'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import FreeContentGate from '@/components/FreeContentGate'
import SubjectModal from './components/SubjectModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

type Subject = {
  id: string
  title: string
  description: string | null
  icon: string | null
  color: string | null
  order_index: number
  is_free_access: boolean
  entry_count?: number
}

type Profile = {
  id: string
  role: string
}

export default function EncyclopediePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)

  const isAdmin = profile?.role === 'admin'
  const isFreeUser = profile?.role === 'free'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      const { data: subjectsData, error } = await supabase
        .from('encyclopedia_subjects')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error

      // Get entry counts per subject
      if (subjectsData && subjectsData.length > 0) {
        const { data: entryCounts } = await supabase
          .from('encyclopedia_entries')
          .select('subject_id')

        const countMap: Record<string, number> = {}
        entryCounts?.forEach((e: any) => {
          countMap[e.subject_id] = (countMap[e.subject_id] || 0) + 1
        })

        setSubjects(subjectsData.map(s => ({
          ...s,
          entry_count: countMap[s.id] || 0,
        })))
      } else {
        setSubjects([])
      }
    } catch (err) {
      console.error('Erreur chargement encyclopédie:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return
    const { error } = await supabase
      .from('encyclopedia_subjects')
      .delete()
      .eq('id', subjectToDelete.id)
    if (error) throw error
    setSubjectToDelete(null)
    loadData()
  }

  const filteredSubjects = subjects.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/elearning')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            E-Learning
          </button>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900 text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

            <div className="relative px-6 py-8 md:px-10 md:py-10">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                  <BookMarked className="h-3.5 w-3.5 text-purple-200" />
                  <span className="text-xs font-semibold text-purple-100">Encyclopédie</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                  Encyclopédie
                </h1>

                <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                  Accédez à l&apos;ensemble des fiches de référence organisées par matière. Des contenus structurés pour consolider vos connaissances.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Admin actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une matière..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => { setSubjectToEdit(null); setShowSubjectModal(true) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Nouvelle matière
            </button>
          )}
        </div>

        {/* Subject Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <BookMarked className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {searchTerm ? 'Aucune matière trouvée' : 'Aucune matière créée'}
            </h3>
            <p className="text-sm text-slate-500">
              {searchTerm ? 'Essayez un autre terme de recherche.' : isAdmin ? 'Commencez par créer une matière.' : 'Contenu en cours de préparation.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => {
              const gradient = subject.color || 'from-purple-500 to-indigo-600'
              const locked = isFreeUser && !subject.is_free_access

              return (
                <FreeContentGate key={subject.id} isLocked={locked}>
                  <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {/* Admin controls */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 z-10 flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSubjectToEdit(subject); setShowSubjectModal(true) }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:bg-white transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSubjectToDelete(subject); setShowDeleteModal(true) }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:bg-white transition"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => !locked && router.push(`/elearning/encyclopedie/${subject.id}`)}
                      className="w-full p-6 text-left"
                      disabled={locked}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transform transition-transform group-hover:scale-110`}>
                          <BookMarked className="h-7 w-7 text-white" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          {subject.entry_count || 0} fiches
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">{subject.title}</h3>
                      {subject.description && (
                        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">{subject.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-purple-600 transition-colors">
                        <span className="text-sm font-semibold">Explorer</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </FreeContentGate>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SubjectModal
        open={showSubjectModal}
        onClose={() => { setShowSubjectModal(false); setSubjectToEdit(null) }}
        onSaved={loadData}
        subject={subjectToEdit}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSubjectToDelete(null) }}
        onConfirm={handleDeleteSubject}
        title="Supprimer la matière"
        message={`Êtes-vous sûr de vouloir supprimer « ${subjectToDelete?.title} » ? Tous les chapitres et fiches associés seront également supprimés. Cette action est irréversible.`}
      />
    </AuthLayout>
  )
}
