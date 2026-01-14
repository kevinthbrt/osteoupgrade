'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Grid3x3,
  Loader2,
  Lock,
  PlayCircle,
  Save,
  Video,
  X,
  Maximize2,
  LayoutGrid,
  Filter,
  Tag
} from 'lucide-react'
import CategoryManager, { PracticeCategory } from './CategoryManager'

const regions = [
  { value: 'cervical', label: 'Cervicales' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'lombaire', label: 'Lombaires' },
  { value: 'epaule', label: 'Épaule' },
  { value: 'coude', label: 'Coude' },
  { value: 'poignet', label: 'Poignet + main' },
  { value: 'hanche', label: 'Hanche' },
  { value: 'genou', label: 'Genou' },
  { value: 'cheville', label: 'Cheville' },
  { value: 'pied', label: 'Pied' }
]

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

const getVimeoThumbnail = (video: PracticeVideo) => {
  // Si on a déjà un vimeo_id, on l'utilise directement
  if (video.vimeo_id) {
    return `https://vumbnail.com/${video.vimeo_id}.jpg`
  }

  // Sinon, on extrait l'ID depuis l'URL Vimeo
  if (video.vimeo_url) {
    try {
      const parsed = new URL(video.vimeo_url)
      const segments = parsed.pathname.split('/').filter(Boolean)
      const id = segments.pop()
      return id ? `https://vumbnail.com/${id}.jpg` : ''
    } catch (error) {
      console.error('Impossible d\'extraire l\'ID Vimeo pour la miniature', error)
      return ''
    }
  }

  return ''
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
  const [categories, setCategories] = useState<PracticeCategory[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('cervical')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'scroll'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [editingVideo, setEditingVideo] = useState<PracticeVideo | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [form, setForm] = useState({
    title: '',
    region: 'cervical',
    category_id: '',
    vimeo_url: '',
    vimeo_id: '',
    thumbnail_url: '',
    order_index: 0,
    description: '',
    is_active: true
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
          await Promise.all([fetchVideos(), fetchCategories()])
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

  const fetchCategories = async () => {
    const query = supabase
      .from('practice_categories')
      .select('*')
      .order('order_index', { ascending: true })

    // Admins can see all categories, users only active ones
    if (!isAdmin(profile?.role)) {
      query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur de chargement des catégories', error)
      setCategories([])
      return
    }

    setCategories((data || []) as PracticeCategory[])
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
      category_id: '',
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
      category_id: video.category_id || '',
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
            category_id: form.category_id || null,
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
          category_id: form.category_id || null,
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
    let filtered = videos.filter((video) => video.region === selectedRegion)

    // Filter by category if one is selected
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((video) => video.category_id === selectedCategory)
    }

    if (isAdmin(profile?.role)) return filtered
    return filtered.filter((video) => video.is_active)
  }, [videos, selectedRegion, selectedCategory, profile?.role])

  const scrollToVideo = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const videoHeight = container.clientHeight
      container.scrollTo({
        top: index * videoHeight,
        behavior: 'smooth'
      })
    }
  }

  const handleNextVideo = () => {
    if (currentVideoIndex < visibleVideos.length - 1) {
      const nextIndex = currentVideoIndex + 1
      setCurrentVideoIndex(nextIndex)
      scrollToVideo(nextIndex)
      trackVideoView(visibleVideos[nextIndex].id)
    }
  }

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1
      setCurrentVideoIndex(prevIndex)
      scrollToVideo(prevIndex)
    }
  }

  const handleVideoClick = (video: PracticeVideo) => {
    const index = visibleVideos.findIndex((v) => v.id === video.id)
    if (index !== -1) {
      setCurrentVideoIndex(index)
      setViewMode('scroll')
      trackVideoView(video.id)
    }
  }

  // Track current video on scroll in scroll mode
  useEffect(() => {
    if (viewMode !== 'scroll' || !scrollContainerRef.current) return

    const handleScroll = () => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const scrollTop = container.scrollTop
      const videoHeight = container.clientHeight
      const index = Math.round(scrollTop / videoHeight)

      if (index !== currentVideoIndex && index >= 0 && index < visibleVideos.length) {
        setCurrentVideoIndex(index)
        trackVideoView(visibleVideos[index].id)
      }
    }

    const container = scrollContainerRef.current
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [viewMode, currentVideoIndex, visibleVideos])

  // Exit scroll mode with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'scroll') {
        setViewMode('grid')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode])

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

  // Scroll Mode - TikTok Style
  if (viewMode === 'scroll') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              <div className="text-white">
                <p className="text-sm font-semibold">{regions.find(r => r.value === selectedRegion)?.label}</p>
                <p className="text-xs text-white/70">{currentVideoIndex + 1} / {visibleVideos.length}</p>
              </div>
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value)
                setCurrentVideoIndex(0)
              }}
              className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white text-sm"
            >
              {regions.map((region) => (
                <option key={region.value} value={region.value} className="text-gray-900">
                  {region.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Video scroll container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleVideos.map((video, index) => (
            <div
              key={video.id}
              className="h-screen w-full snap-start snap-always flex items-center justify-center relative"
            >
              {/* Video iframe */}
              <div className="w-full h-full flex items-center justify-center bg-black">
                {getVimeoEmbedUrl(video) ? (
                  <iframe
                    src={`${getVimeoEmbedUrl(video)}?autoplay=${index === currentVideoIndex ? '1' : '0'}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={video.title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Vidéo non disponible</span>
                  </div>
                )}
              </div>

              {/* Navigation arrows */}
              {index > 0 && (
                <button
                  onClick={handlePrevVideo}
                  className="absolute top-1/2 left-4 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition text-white"
                >
                  <ChevronUp className="h-6 w-6" />
                </button>
              )}
              {index < visibleVideos.length - 1 && (
                <button
                  onClick={handleNextVideo}
                  className="absolute top-1/2 right-4 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition text-white"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {visibleVideos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucune vidéo disponible pour cette région</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Grid Mode - Default
  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Video className="h-3.5 w-3.5 text-pink-300" />
                <span className="text-xs font-semibold text-pink-100">
                  Module Pratique Premium
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">
                Techniques par région
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Explorez nos vidéos de techniques cliniques organisées par région anatomique. Mode défilement immersif disponible.
              </p>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Région :</span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value)
                      setForm((prev) => ({ ...prev, region: e.target.value }))
                      setCurrentVideoIndex(0)
                    }}
                    className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white shadow-sm"
                  >
                    {regions.map((region) => (
                      <option key={region.value} value={region.value} className="text-gray-900">
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>

                {categories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-300" />
                    <span className="text-sm text-slate-300">Catégorie :</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setCurrentVideoIndex(0)
                      }}
                      className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white shadow-sm"
                    >
                      <option value="all" className="text-gray-900">Toutes les catégories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="text-gray-900">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Affichage :</span>
                  <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                    <button
                      onClick={() => setViewMode('grid')}
                      className="px-3 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-2 bg-white text-slate-900"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Grille
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('scroll')
                        setCurrentVideoIndex(0)
                        if (visibleVideos.length > 0) {
                          trackVideoView(visibleVideos[0].id)
                        }
                      }}
                      className="px-3 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-2 text-white hover:bg-white/10"
                    >
                      <Maximize2 className="h-4 w-4" />
                      Défilement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isAdmin(profile?.role) && (
          <>
            {/* Category Manager */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowCategoryManager(!showCategoryManager)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 transition shadow-lg"
                >
                  <Tag className="h-5 w-5" />
                  {showCategoryManager ? 'Masquer' : 'Gérer'} les catégories
                </button>
              </div>
              {showCategoryManager && (
                <CategoryManager onCategoryChange={fetchCategories} />
              )}
            </div>

            {/* Video Form */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-pink-600" />
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
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
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
                <label className="text-sm font-medium text-gray-700">Catégorie (optionnelle)</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-white"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL Vimeo</label>
                <input
                  value={form.vimeo_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, vimeo_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                  placeholder="https://vimeo.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID Vimeo (optionnel)</label>
                <input
                  value={form.vimeo_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, vimeo_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Miniature (URL)</label>
                <input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                  placeholder="https://...jpg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingVideo ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {editingVideo ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
          </>
        )}

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visibleVideos.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 mb-4">
                <Video className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune vidéo disponible</h3>
              <p className="text-gray-600 text-sm">Les vidéos pour cette région apparaîtront ici.</p>
            </div>
          )}

          {visibleVideos.map((video) => (
            <div
              key={video.id}
              className="group bg-white border-2 border-transparent hover:border-pink-200 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="relative h-48 bg-gradient-to-br from-slate-100 to-gray-100 cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                {video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : getVimeoThumbnail(video) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getVimeoThumbnail(video)} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Video className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="transform scale-75 group-hover:scale-100 transition-transform">
                    <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                  </div>
                </div>
              </div>
              <div
                className="p-5 flex-1 flex flex-col gap-3 cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{video.title}</h3>
                  {!video.is_active && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">Brouillon</span>
                  )}
                </div>
                {video.description ? (
                  <div className="text-gray-700 text-sm leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: video.description }} />
                ) : (
                  <p className="text-gray-500 text-sm">Aucune description fournie.</p>
                )}
              </div>
              {isAdmin(profile?.role) && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gradient-to-br from-gray-50 to-slate-50 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(video)
                    }}
                    className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-semibold"
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
    </AuthLayout>
  )
}
