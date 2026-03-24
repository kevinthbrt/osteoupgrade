'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import FreeContentGate from '@/components/FreeContentGate'
import EntryModal from '../components/EntryModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import {
  ArrowLeft,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'

type Entry = {
  id: string
  subject_id: string
  parent_id: string | null
  title: string
  content_html: string | null
  vimeo_url: string | null
  images: { url: string; caption?: string }[] | null
  order_index: number
  is_free_access: boolean
  children?: Entry[]
}

type Subject = {
  id: string
  title: string
  description: string | null
  color: string | null
  is_free_access: boolean
}

type Profile = {
  id: string
  role: string
}

function buildTree(entries: Entry[]): Entry[] {
  const map: Record<string, Entry> = {}
  const roots: Entry[] = []

  entries.forEach(e => {
    map[e.id] = { ...e, children: [] }
  })

  entries.forEach(e => {
    if (e.parent_id && map[e.parent_id]) {
      map[e.parent_id].children!.push(map[e.id])
    } else {
      roots.push(map[e.id])
    }
  })

  // Sort children by order_index
  const sortChildren = (nodes: Entry[]) => {
    nodes.sort((a, b) => a.order_index - b.order_index)
    nodes.forEach(n => {
      if (n.children && n.children.length > 0) sortChildren(n.children)
    })
  }
  sortChildren(roots)

  return roots
}

function hasContent(entry: Entry): boolean {
  return !!(entry.content_html || entry.vimeo_url || (entry.images && entry.images.length > 0))
}

interface TreeNodeProps {
  entry: Entry
  depth: number
  isAdmin: boolean
  isFreeUser: boolean
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
  onAddChild: (parentId: string) => void
  onViewEntry: (entry: Entry) => void
}

function TreeNode({ entry, depth, isAdmin, isFreeUser, onEdit, onDelete, onAddChild, onViewEntry }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = entry.children && entry.children.length > 0
  const entryHasContent = hasContent(entry)
  const locked = isFreeUser && !entry.is_free_access

  const depthColors = [
    'border-purple-300 bg-purple-50/50',
    'border-indigo-200 bg-indigo-50/30',
    'border-blue-200 bg-blue-50/30',
    'border-cyan-200 bg-cyan-50/20',
    'border-teal-200 bg-teal-50/20',
  ]
  const colorClass = depthColors[depth % depthColors.length]

  return (
    <div className={`${depth > 0 ? 'ml-4 md:ml-6' : ''}`}>
      <FreeContentGate isLocked={locked} compact>
        <div className={`rounded-xl border ${colorClass} transition-all duration-200 hover:shadow-md mb-2`}>
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Expand/collapse toggle */}
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-white/80 rounded-lg transition"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Icon */}
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-purple-500 flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
            )}

            {/* Title - clickable if has content */}
            {entryHasContent ? (
              <button
                onClick={() => !locked && onViewEntry(entry)}
                className="flex-1 text-left font-semibold text-slate-800 hover:text-purple-700 transition truncate"
                disabled={locked}
              >
                {entry.title}
              </button>
            ) : (
              <button
                onClick={() => hasChildren && setExpanded(!expanded)}
                className="flex-1 text-left font-semibold text-slate-800 truncate"
              >
                {entry.title}
              </button>
            )}

            {/* Entry badge */}
            {entryHasContent && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                Fiche
              </span>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onAddChild(entry.id)}
                  className="p-1.5 hover:bg-white/80 rounded-lg transition"
                  title="Ajouter un sous-élément"
                >
                  <Plus className="h-3.5 w-3.5 text-green-600" />
                </button>
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 hover:bg-white/80 rounded-lg transition"
                  title="Modifier"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => onDelete(entry)}
                  className="p-1.5 hover:bg-white/80 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </FreeContentGate>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1">
          {entry.children!.map((child) => (
            <TreeNode
              key={child.id}
              entry={child}
              depth={depth + 1}
              isAdmin={isAdmin}
              isFreeUser={isFreeUser}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onViewEntry={onViewEntry}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SubjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params?.subjectId as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [tree, setTree] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null)

  const isAdmin = profile?.role === 'admin'
  const isFreeUser = profile?.role === 'free'

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      const { data: subjectData, error: subjectError } = await supabase
        .from('encyclopedia_subjects')
        .select('*')
        .eq('id', subjectId)
        .single()

      if (subjectError || !subjectData) {
        router.push('/elearning/encyclopedie')
        return
      }

      setSubject(subjectData)

      const { data: entriesData, error: entriesError } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_index', { ascending: true })

      if (entriesError) throw entriesError

      const allEntries = entriesData || []
      setEntries(allEntries)
      setTree(buildTree(allEntries))
    } catch (err) {
      console.error('Erreur chargement matière:', err)
    } finally {
      setLoading(false)
    }
  }, [subjectId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return
    const { error } = await supabase
      .from('encyclopedia_entries')
      .delete()
      .eq('id', entryToDelete.id)
    if (error) throw error
    setEntryToDelete(null)
    loadData()
  }

  const handleAddChild = (parentId: string) => {
    setParentIdForNew(parentId)
    setEntryToEdit(null)
    setShowEntryModal(true)
  }

  const handleAddRoot = () => {
    setParentIdForNew(null)
    setEntryToEdit(null)
    setShowEntryModal(true)
  }

  const handleEditEntry = (entry: Entry) => {
    setEntryToEdit(entry)
    setParentIdForNew(entry.parent_id)
    setShowEntryModal(true)
  }

  const handleViewEntry = (entry: Entry) => {
    router.push(`/elearning/encyclopedie/${subjectId}/${entry.id}`)
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!subject) return null

  const gradient = subject.color || 'from-purple-500 to-indigo-600'

  return (
    <AuthLayout>
      <div className="min-h-screen max-w-5xl mx-auto">
        {/* Subject header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white shadow-2xl mb-8`}>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <button
              onClick={() => router.push('/elearning/encyclopedie')}
              className="text-sm text-white/70 hover:text-white mb-4 flex items-center gap-2"
            >
              &larr; Retour à l&apos;encyclopédie
            </button>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <BookMarked className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs font-semibold text-white/80">Encyclopédie</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                {subject.title}
              </h1>

              {subject.description && (
                <p className="text-base md:text-lg text-white/80 max-w-2xl mb-2">
                  {subject.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>{entries.length} entrée{entries.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin: add root entry */}
        {isAdmin && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddRoot}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Ajouter un chapitre
            </button>
          </div>
        )}

        {/* Tree */}
        {tree.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              Aucun contenu
            </h3>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'Commencez par ajouter un chapitre.' : 'Contenu en cours de rédaction.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((entry) => (
              <TreeNode
                key={entry.id}
                entry={entry}
                depth={0}
                isAdmin={isAdmin}
                isFreeUser={isFreeUser}
                onEdit={handleEditEntry}
                onDelete={(e) => { setEntryToDelete(e); setShowDeleteModal(true) }}
                onAddChild={handleAddChild}
                onViewEntry={handleViewEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <EntryModal
        open={showEntryModal}
        onClose={() => { setShowEntryModal(false); setEntryToEdit(null); setParentIdForNew(null) }}
        onSaved={loadData}
        subjectId={subjectId}
        parentId={parentIdForNew}
        entry={entryToEdit}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setEntryToDelete(null) }}
        onConfirm={handleDeleteEntry}
        title="Supprimer l'entrée"
        message={`Êtes-vous sûr de vouloir supprimer « ${entryToDelete?.title} » ? Toutes les sous-entrées seront également supprimées. Cette action est irréversible.`}
      />
    </AuthLayout>
  )
}
