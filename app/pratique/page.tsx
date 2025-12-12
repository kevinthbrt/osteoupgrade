'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  Check,
  Edit,
  Loader2,
  Lock,
  PlayCircle,
  Save,
  Video,
  X
} from 'lucide-react'

const regions = [
  { value: 'cervical', label: 'Cervicales' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'lombaire', label: 'Lombaires' },
  { value: 'epaule', label: 'Épaule' },
  { value: 'coude', label: 'Coude' },
  { value: 'poignet', label: 'Poignet' },
  { value: 'main', label: 'Main' },
  { value: 'hanche', label: 'Hanche' },
  { value: 'genou', label: 'Genou' },
  { value: 'cheville', label: 'Cheville' },
  { value: 'pied', label: 'Pied' }
]

type Profile = { id: string; role: string; full_name?: string }

type PracticeVideo = {
  id: string
  region: string
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

const getVimeoEmbedUrl = (video: PracticeVideo) => {
  if (video.vimeo_id) return `https://player.vimeo.com/video/${video.vimeo_id}`
  if (!video.vimeo_url) return ''

  try {
    const parsed = new URL(video.vimeo_url)
    if (parsed.hostname.includes('player.vimeo.com')) return video.vimeo_url
    const segments = parsed.pathname.split('/').filter(Boolean)
    const id = segments.pop()
    return id ? `https://player.vimeo.com/video/${id}` : video.vimeo_url
  } catch (error) {
    console.error('URL Vimeo invalide', error)
    return video.vimeo_url
  }
}

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

  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    onChange(editorRef.current.innerHTML)
  }

  const handleInput = () => {
    if (!editorRef.current) return
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
            <option key={size} value={size}>
              {size}px
            </option>
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
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  )
}

export default function PracticePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [videos, setVideos] = useState<PracticeVideo[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('cervical')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<PracticeVideo | null>(null)
  const [editingVideo, setEditingVideo] = useState<PracticeVideo | null>(null)
  const [form, setForm] = useState({
    title: '',
    region: 'cervical',
    vimeo_url: '',
    vimeo_id: '',
    thumbnail_url: '',
    order_index: 0,
    description: '',
    is_active: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .single()

        setProfile(profileData as Profile)

        if (isPremium(profileData?.role) || isAdmin(profileData?.role)) {
          await fetchVideos()
        }
      } catch (error) {
        console.error('Impossible de charger les données Pratique', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('practice_videos')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur de chargement des vidéos', error)
      setVideos([])
      return
    }

    setVideos((data || []) as PracticeVideo[])
  }

  const handleOpenVideo = async (video: PracticeVideo) => {
    setSelectedVideo(video)
    setShowModal(true)

    // Track video view for gamification
    await trackVideoView(video.id)
  }

  const trackVideoView = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_practice_progress').insert({
          user_id: user.id,
          practice_video_id: videoId,
          viewed_at: new Date().toISOString(),
          completed: true
        })
        console.log('✅ Vue de vidéo pratique enregistrée (+30 XP)')
      }
    } catch (error: any) {
      // Ignore duplicate key errors (user already viewed this video)
      if (!error?.message?.includes('duplicate key')) {
        console.error('❌ Erreur tracking vidéo pratique:', error)
      }
    }
  }

  const resetForm = () => {
    setEditingVideo(null)
    setForm({
      title: '',
      region: selectedRegion,
      vimeo_url: '',
      vimeo_id: '',
      thumbnail_url: '',
      order_index: 0,
      description: '',
      is_active: true
    })
  }

  const handleEdit = (video: PracticeVideo) => {
    setEditingVideo(video)
    setForm({
      title: video.title,
      region: video.region,
      vimeo_url: video.vimeo_url || '',
      vimeo_id: video.vimeo_id || '',
      thumbnail_url: video.thumbnail_url || '',
      order_index: video.order_index || 0,
      description: video.description || '',
      is_active: video.is_active
    })
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('practice_videos')
          .update({
            title: form.title,
            region: form.region,
            vimeo_url: form.vimeo_url || null,
            vimeo_id: form.vimeo_id || null,
            thumbnail_url: form.thumbnail_url || null,
            order_index: form.order_index,
            description: form.description,
            is_active: form.is_active
          })
          .eq('id', editingVideo.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('practice_videos').insert({
          title: form.title,
          region: form.region,
          vimeo_url: form.vimeo_url || null,
          vimeo_id: form.vimeo_id || null,
          thumbnail_url: form.thumbnail_url || null,
          order_index: form.order_index,
          description: form.description,
          is_active: form.is_active
        })

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

  const visibleVideos = useMemo(() => {
    const filtered = videos.filter((video) => video.region === selectedRegion)
    if (isAdmin(profile?.role)) return filtered
    return filtered.filter((video) => video.is_active)
  }, [videos, selectedRegion, profile?.role])

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

  if (!premiumAccess) {
    return (
      <AuthLayout>
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold mt-4">Accès réservé</h1>
          <p className="text-gray-600 mt-2">
            Le module Pratique est disponible pour les membres premium. Passe au niveau supérieur pour accéder aux
            vidéos et aux ressources cliniques.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-xl border border-white/10">
          <div className="p-6 space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
              <Video className="h-4 w-4" />
              Module Pratique
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight">Pratique par région</h1>
                <p className="text-slate-200 text-sm md:text-base">
                  Sélectionne une région pour explorer les vidéos pratiques. Les vidéos s&apos;ouvrent dans un modal afin de
                  rester concentré sur l&apos;essentiel.
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-sm font-medium text-slate-200">Choisir la région</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setForm((prev) => ({ ...prev, region: e.target.value }))
                  }}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur"
                >
                  {regions.map((region) => (
                    <option key={region.value} value={region.value} className="text-gray-900">
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {isAdmin(profile?.role) && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVideo ? 'Modifier une vidéo' : 'Ajouter une vidéo'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Titre</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Titre de la vidéo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Région</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-white"
                >
                  {regions.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL Vimeo</label>
                <input
                  value={form.vimeo_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, vimeo_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                  placeholder="https://vimeo.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID Vimeo (optionnel)</label>
                <input
                  value={form.vimeo_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, vimeo_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Miniature (URL)</label>
                <input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                  placeholder="https://...jpg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Vidéo active
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
              />
            </div>

            <div className="flex gap-3 justify-end">
              {editingVideo && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingVideo ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {editingVideo ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visibleVideos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-gray-600">
              <AlertCircle className="h-6 w-6" />
              <p>Aucune vidéo disponible pour cette région pour le moment.</p>
            </div>
          )}

          {visibleVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative h-44 bg-gray-100">
                {video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Video className="h-10 w-10" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenVideo(video)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 hover:opacity-100 transition"
                >
                  <PlayCircle className="h-12 w-12" />
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                  {!video.is_active && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Brouillon</span>
                  )}
                </div>
                {video.description ? (
                  <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: video.description }} />
                ) : (
                  <p className="text-gray-500 text-sm">Aucune description fournie.</p>
                )}
              </div>
              {isAdmin(profile?.role) && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(video)}
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </button>
                  <span className="text-xs text-gray-500">Ordre : {video.order_index ?? 0}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">{selectedVideo.region}</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {getVimeoEmbedUrl(selectedVideo) ? (
                <iframe
                  src={getVimeoEmbedUrl(selectedVideo)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Vidéo non disponible</span>
                </div>
              )}
            </div>
            {selectedVideo.description && (
              <div className="p-6 bg-gray-50">
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: selectedVideo.description }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
