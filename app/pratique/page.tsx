'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Loader2,
  Lock,
  PlayCircle,
  Plus,
  Save,
  Tag,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import CategoryManager, { PracticeCategory } from './CategoryManager'
import FreeContentGate from '@/components/FreeContentGate'
import FreeUserBanner from '@/components/FreeUserBanner'

const regions = [
  { value: 'cervical', label: 'Cervicales' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'lombaire', label: 'Lombaires' },
  { value: 'epaule', label: 'Épaule' },
  { value: 'coude', label: 'Coude' },
  { value: 'poignet', label: 'Poignet + main' },
  { value: 'bassin', label: 'Bassin' },
  { value: 'hanche', label: 'Hanche' },
  { value: 'genou', label: 'Genou' },
  { value: 'pied_cheville', label: 'Pied & Cheville' },
]

const VIDEOS_PER_PAGE = 12

type Profile = { id: string; role: string; full_name?: string }

type PracticeVideo = {
  id: string
  region: string
  category_id?: string | null
  topographic_zone_id?: string | null
  title: string
  description?: string | null
  vimeo_id?: string | null
  vimeo_url?: string | null
  thumbnail_url?: string | null
  duration_seconds?: number | null
  order_index?: number | null
  is_active: boolean
}

const isPremium = (role?: string) => ['premium_silver', 'premium_gold', 'admin'].includes(role || '')
const isAdmin = (role?: string) => role === 'admin'

const getVimeoEmbedUrl = (video: PracticeVideo): string => {
  if (video.vimeo_id) return `https://player.vimeo.com/video/${video.vimeo_id}?autoplay=1`
  if (!video.vimeo_url) return ''
  try {
    const parsed = new URL(video.vimeo_url)
    if (parsed.hostname.includes('player.vimeo.com')) {
      const sep = video.vimeo_url.includes('?') ? '&' : '?'
      return `${video.vimeo_url}${sep}autoplay=1`
    }
    const segments = parsed.pathname.split('/').filter(Boolean)
    const id = segments.pop()
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : ''
  } catch {
    return ''
  }
}

const getVimeoThumbnail = (video: PracticeVideo): string => {
  if (video.thumbnail_url) return video.thumbnail_url
  if (video.vimeo_id) return `https://vumbnail.com/${video.vimeo_id}.jpg`
  if (video.vimeo_url) {
    try {
      const parsed = new URL(video.vimeo_url)
      const segments = parsed.pathname.split('/').filter(Boolean)
      const id = segments.pop()
      return id ? `https://vumbnail.com/${id}.jpg` : ''
    } catch {
      return ''
    }
  }
  return ''
}

/* ─── Rich Text Editor ──────────────────────────────────────────── */

const ToolbarButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50"
  >
    {label}
  </button>
)

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyFormat = (command: string, val?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, val)
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <ToolbarButton label="Gras" onClick={() => applyFormat('bold')} />
        <ToolbarButton label="Italique" onClick={() => applyFormat('italic')} />
        <ToolbarButton label="Liste" onClick={() => applyFormat('insertUnorderedList')} />
        <ToolbarButton label="Titre" onClick={() => applyFormat('formatBlock', 'h3')} />
        <select
          className="px-2 py-1 text-sm rounded border border-gray-200 bg-white"
          onChange={(e) => applyFormat('fontSize', e.target.value)}
          defaultValue="16"
        >
          {[12, 14, 16, 20, 24].map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        <input
          type="color"
          className="w-10 h-8 border border-gray-200 rounded"
          onChange={(e) => applyFormat('foreColor', e.target.value)}
          aria-label="Choisir une couleur"
        />
      </div>
      <div
        ref={editorRef}
        className="min-h-[140px] p-4 focus:outline-none"
        contentEditable
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML) }}
        suppressContentEditableWarning
      />
    </div>
  )
}

/* ─── Empty form factory ────────────────────────────────────────── */

const emptyForm = (region = 'cervical') => ({
  title: '',
  region,
  category_id: '',
  vimeo_url: '',
  vimeo_id: '',
  thumbnail_url: '',
  order_index: '',
  description: '',
  is_active: true,
})

/* ─── Page ──────────────────────────────────────────────────────── */

export default function PracticePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [videos, setVideos] = useState<PracticeVideo[]>([])
  const [categories, setCategories] = useState<PracticeCategory[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('cervical')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)

  // Modals
  const [playingVideo, setPlayingVideo] = useState<PracticeVideo | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number>(0)
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<PracticeVideo | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  const [form, setForm] = useState(emptyForm())

  /* ── Data loading ── */

  useEffect(() => {
    const loadData = async () => {
      try {
        const payload = await fetchProfilePayload()
        if (!payload?.user) { router.push('/'); return }
        const profileData = payload.profile
        setProfile(profileData as Profile)
        await Promise.all([fetchVideos(), fetchCategories()])
      } catch (error) {
        console.error('Impossible de charger les données Pratique', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('practice_videos')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) { console.error('Erreur de chargement des vidéos', error); setVideos([]); return }
    setVideos((data || []) as PracticeVideo[])
  }

  const fetchCategories = async () => {
    const query = supabase.from('practice_categories').select('*').order('order_index', { ascending: true })
    if (!isAdmin(profile?.role)) query.eq('is_active', true)
    const { data, error } = await query
    if (error) { console.error('Erreur de chargement des catégories', error); setCategories([]); return }
    setCategories((data || []) as PracticeCategory[])
  }

  /* ── Video tracking ── */

  const trackVideoView = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_practice_progress').insert({
          user_id: user.id,
          practice_video_id: videoId,
          viewed_at: new Date().toISOString(),
          completed: true,
        })
      }
    } catch (error: any) {
      if (!error?.message?.includes('duplicate key')) {
        console.error('Erreur tracking vidéo pratique:', error)
      }
    }
  }

  /* ── Admin CRUD ── */

  const resetForm = () => {
    setEditingVideo(null)
    setShowVideoForm(false)
    setForm(emptyForm(selectedRegion))
  }

  const handleEdit = (video: PracticeVideo) => {
    setEditingVideo(video)
    setForm({
      title: video.title,
      region: video.region,
      category_id: video.category_id || '',
      vimeo_url: video.vimeo_url || '',
      vimeo_id: video.vimeo_id || '',
      thumbnail_url: video.thumbnail_url || '',
      order_index: video.order_index != null ? String(video.order_index) : '',
      description: video.description || '',
      is_active: video.is_active,
    })
    setShowVideoForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      // Auto order_index: if empty or 0, assign max + 1 for that region
      let orderIndex: number
      const parsed = form.order_index !== '' ? Number(form.order_index) : 0
      if (!parsed || parsed <= 0) {
        const regionVideos = videos.filter(v => v.region === form.region && v.id !== editingVideo?.id)
        const maxOrder = regionVideos.reduce((max: number, v: PracticeVideo) => Math.max(max, v.order_index ?? 0), 0)
        orderIndex = maxOrder + 1
      } else {
        orderIndex = parsed
      }

      const payload = {
        title: form.title.trim(),
        region: form.region,
        category_id: form.category_id || null,
        vimeo_url: form.vimeo_url || null,
        vimeo_id: form.vimeo_id || null,
        thumbnail_url: form.thumbnail_url || null,
        order_index: orderIndex,
        description: form.description,
        is_active: form.is_active,
      }

      if (editingVideo) {
        const { error } = await supabase.from('practice_videos').update(payload).eq('id', editingVideo.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('practice_videos').insert(payload)
        if (error) throw error
      }

      await fetchVideos()
      resetForm()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la vidéo', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('Supprimer cette vidéo ? Cette action est irréversible.')) return
    try {
      const { error } = await supabase.from('practice_videos').delete().eq('id', videoId)
      if (error) throw error
      if (playingVideo?.id === videoId) setPlayingVideo(null)
      await fetchVideos()
    } catch (error) {
      console.error('Erreur lors de la suppression de la vidéo', error)
    }
  }

  /* ── Derived state ── */

  const visibleVideos = useMemo(() => {
    let filtered = videos.filter((v) => v.region === selectedRegion)
    if (selectedCategory !== 'all') filtered = filtered.filter((v) => v.category_id === selectedCategory)
    if (!isAdmin(profile?.role)) filtered = filtered.filter((v) => v.is_active)
    return filtered
  }, [videos, selectedRegion, selectedCategory, profile?.role])

  const totalPages = Math.ceil(visibleVideos.length / VIDEOS_PER_PAGE)
  const paginatedVideos = visibleVideos.slice((page - 1) * VIDEOS_PER_PAGE, page * VIDEOS_PER_PAGE)

  // Count of visible videos per region for the tab badge
  const regionCount = (regionValue: string) =>
    videos.filter(v => v.region === regionValue && (isAdmin(profile?.role) || v.is_active)).length

  /* ── Video modal controls ── */

  const openVideo = (video: PracticeVideo) => {
    const index = visibleVideos.findIndex(v => v.id === video.id)
    setPlayingVideo(video)
    setPlayingIndex(index >= 0 ? index : 0)
    trackVideoView(video.id)
  }

  const closeVideo = () => setPlayingVideo(null)

  const goToPrev = () => {
    if (playingIndex > 0) {
      const prev = visibleVideos[playingIndex - 1]
      setPlayingVideo(prev)
      setPlayingIndex(playingIndex - 1)
      trackVideoView(prev.id)
    }
  }

  const goToNext = () => {
    if (playingIndex < visibleVideos.length - 1) {
      const next = visibleVideos[playingIndex + 1]
      setPlayingVideo(next)
      setPlayingIndex(playingIndex + 1)
      trackVideoView(next.id)
    }
  }

  /* ── Keyboard shortcuts ── */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playingVideo) { closeVideo(); return }
        if (showVideoForm) { resetForm(); return }
        if (showCategoryManager) { setShowCategoryManager(false); return }
      }
      if (playingVideo) {
        if (e.key === 'ArrowLeft') goToPrev()
        if (e.key === 'ArrowRight') goToNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingVideo, playingIndex, showVideoForm, showCategoryManager])

  /* ── Reset page on filter change ── */
  useEffect(() => { setPage(1) }, [selectedRegion, selectedCategory])

  /* ── Guards ── */

  const premiumAccess = isPremium(profile?.role) || isAdmin(profile?.role)

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p>Chargement du module Pratique...</p>
        </div>
      </AuthLayout>
    )
  }

  const isFreeUser = profile?.role === 'free'

  /* ─────────────────────────────────────────────────────────────── */
  /*  RENDER                                                         */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <AuthLayout>

      {/* ══════════════ VIDEO PLAYER MODAL ══════════════ */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={closeVideo}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-sm">
                {playingIndex + 1} / {visibleVideos.length}
              </p>
              <button
                onClick={closeVideo}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition"
                title="Fermer (Échap)"
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>

            {/* Player area */}
            <div className="relative">
              {/* Prev */}
              {playingIndex > 0 && (
                <button
                  onClick={goToPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hidden md:flex"
                  title="Vidéo précédente (←)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {/* Next */}
              {playingIndex < visibleVideos.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hidden md:flex"
                  title="Vidéo suivante (→)"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Iframe */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
                {getVimeoEmbedUrl(playingVideo) ? (
                  <iframe
                    key={playingVideo.id}
                    src={getVimeoEmbedUrl(playingVideo)}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={playingVideo.title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Vidéo non disponible</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title + description */}
            <div className="mt-4">
              <h2 className="text-white text-xl font-bold">{playingVideo.title}</h2>
              {playingVideo.description && (
                <div
                  className="mt-2 text-white/60 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: playingVideo.description }}
                />
              )}
            </div>

            {/* Mobile navigation */}
            <div className="flex items-center justify-between mt-4 md:hidden">
              <button
                onClick={goToPrev}
                disabled={playingIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30 text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Précédente
              </button>
              <button
                onClick={goToNext}
                disabled={playingIndex === visibleVideos.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30 text-sm"
              >
                Suivante <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ VIDEO FORM MODAL ══════════════ */}
      {showVideoForm && isAdmin(profile?.role) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={resetForm}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-pink-600" />
                {editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
              </h2>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Titre *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                    placeholder="Titre de la vidéo"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Région</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
                  >
                    {regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Catégorie (optionnelle)</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Vimeo URL */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">URL Vimeo</label>
                  <input
                    value={form.vimeo_url}
                    onChange={(e) => setForm(prev => ({ ...prev, vimeo_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                    placeholder="https://vimeo.com/..."
                  />
                </div>

                {/* Vimeo ID */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">ID Vimeo (optionnel)</label>
                  <input
                    value={form.vimeo_id}
                    onChange={(e) => setForm(prev => ({ ...prev, vimeo_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                    placeholder="123456789"
                  />
                </div>

                {/* Thumbnail */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Miniature (URL personnalisée)</label>
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                    placeholder="https://...jpg (optionnel, sinon Vimeo auto)"
                  />
                </div>

                {/* Order */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    min="1"
                    value={form.order_index}
                    onChange={(e) => setForm(prev => ({ ...prev, order_index: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                    placeholder="Auto (laissez vide)"
                  />
                  <p className="text-xs text-gray-400">Laissez vide pour ajouter à la fin automatiquement.</p>
                </div>

                {/* Active */}
                <div className="flex items-center gap-3 pt-4">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Vidéo active (visible par les utilisateurs)
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => setForm(prev => ({ ...prev, description: html }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingVideo ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {editingVideo ? 'Mettre à jour' : 'Ajouter la vidéo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CATEGORY MANAGER MODAL ══════════════ */}
      {showCategoryManager && isAdmin(profile?.role) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCategoryManager(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-pink-600" />
                Gérer les catégories
              </h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <CategoryManager onCategoryChange={fetchCategories} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="space-y-6">
        {isFreeUser && <FreeUserBanner />}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
              <Video className="h-3.5 w-3.5 text-pink-300" />
              <span className="text-xs font-semibold text-pink-100">Module Pratique Premium</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">
              Techniques par région
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl">
              Explorez nos vidéos de techniques cliniques organisées par région anatomique.
              Cliquez sur une vidéo pour la lancer.
            </p>
          </div>
        </div>

        {/* Admin toolbar */}
        {isAdmin(profile?.role) && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingVideo(null)
                setForm(emptyForm(selectedRegion))
                setShowVideoForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition shadow"
            >
              <Plus className="h-4 w-4" />
              Ajouter une vidéo
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 transition shadow-sm"
            >
              <Tag className="h-4 w-4" />
              Gérer les catégories
            </button>
          </div>
        )}

        {/* Region tabs */}
        <div className="flex flex-wrap gap-2">
          {regions.map(region => {
            const count = regionCount(region.value)
            const active = selectedRegion === region.value
            const isRegionLocked = isFreeUser && region.value !== 'epaule'
            return (
              <FreeContentGate key={region.value} isLocked={isRegionLocked} compact>
                <button
                  onClick={() => !isRegionLocked && setSelectedRegion(region.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  {region.label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              </FreeContentGate>
            )
          })}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>Filtrer :</span>
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                  selectedCategory === cat.id
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Video grid */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedVideos.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 mb-4">
                <Video className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune vidéo disponible</h3>
              <p className="text-gray-600 text-sm">Les vidéos pour cette région apparaîtront ici.</p>
              {isAdmin(profile?.role) && (
                <button
                  onClick={() => {
                    setEditingVideo(null)
                    setForm(emptyForm(selectedRegion))
                    setShowVideoForm(true)
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-sm"
                >
                  <Plus className="h-4 w-4" /> Ajouter une vidéo
                </button>
              )}
            </div>
          )}

          {paginatedVideos.map((video) => {
            const thumb = getVimeoThumbnail(video)
            const isVideoLocked = isFreeUser && !video.is_free_access
            return (
              <FreeContentGate key={video.id} isLocked={isVideoLocked}>
              <div
                className="group bg-white border border-gray-100 hover:border-pink-200 rounded-2xl shadow-sm hover:shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div
                  className="relative h-44 bg-gradient-to-br from-slate-100 to-gray-100 cursor-pointer overflow-hidden"
                  onClick={() => openVideo(video)}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Video className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="h-14 w-14 text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform" />
                  </div>
                  {!video.is_active && (
                    <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-amber-500/90 text-white font-semibold">
                      Brouillon
                    </span>
                  )}
                </div>

                {/* Info */}
                <div
                  className="p-4 flex-1 flex flex-col gap-2 cursor-pointer"
                  onClick={() => openVideo(video)}
                >
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  {video.description && (
                    <div
                      className="text-gray-400 text-xs leading-relaxed line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: video.description }}
                    />
                  )}
                </div>

                {/* Admin bar */}
                {isAdmin(profile?.role) && (
                  <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(video) }}
                        className="text-xs text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 transition"
                      >
                        <Edit className="h-3 w-3" /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(video.id) }}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="h-3 w-3" /> Supprimer
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">#{video.order_index}</span>
                  </div>
                )}
              </div>
              </FreeContentGate>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                  p === page
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

      </div>
    </AuthLayout>
  )
}
