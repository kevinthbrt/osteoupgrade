'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Video,
  X,
  Globe,
  Monitor,
  ArrowUpRight,
  Calendar,
  Eye,
} from 'lucide-react'

type Broadcast = {
  id: string
  title: string
  body: string
  image_url: string | null
  video_url: string | null
  target: 'osteoflow' | 'osteoupgrade' | 'both'
  created_at: string
  created_by: string | null
}

const TARGET_CONFIG = {
  osteoflow:    { label: 'MyOsteoFlow', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Monitor },
  osteoupgrade: { label: 'OsteoUpgrade', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: ArrowUpRight },
  both:         { label: 'Les deux', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Globe },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminBroadcastsPage() {
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'osteoflow' | 'osteoupgrade' | 'both'>('both')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    fetchBroadcasts()
  }

  const fetchBroadcasts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/broadcasts')
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(data.broadcasts ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const uploadMedia = async (file: File, type: 'image' | 'video') => {
    setUploadingMedia(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/broadcast-media-upload', { method: 'POST', body: form })
      if (!res.ok) { alert('Erreur lors du téléversement'); return }
      const { url } = await res.json()
      if (type === 'image') setImageUrl(url)
      else setVideoUrl(url)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, image_url: imageUrl || null, video_url: videoUrl || null, target }),
      })
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(prev => [data.broadcast, ...prev])
        resetForm()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la création')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette diffusion ? Elle disparaîtra de toutes les cloches de notification.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/broadcasts/${id}`, { method: 'DELETE' })
      if (res.ok) setBroadcasts(prev => prev.filter(b => b.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setTarget('both')
    setImageUrl('')
    setVideoUrl('')
    setShowForm(false)
  }

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Administration
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Diffusions
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Envoyez un message à tous vos utilisateurs sur MyOsteoFlow et/ou OsteoUpgrade
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        </div>

        {/* Body */}
        <div className="relative bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 space-y-6">

          {/* Create button / form */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Nouvelle diffusion
            </button>
          ) : (
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  Nouvelle diffusion
                </h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex : Nouvelle fonctionnalité disponible !"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  placeholder="Décrivez la nouveauté, l'annonce, la mise à jour…"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
                />
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Diffuser sur</label>
                <div className="flex flex-wrap gap-2">
                  {(['both', 'osteoupgrade', 'osteoflow'] as const).map(t => {
                    const cfg = TARGET_CONFIG[t]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={t}
                        onClick={() => setTarget(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          target === t
                            ? cfg.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Media */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Image */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Image (optionnel)</label>
                  {imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="aperçu" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow"
                      >
                        <X className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm"
                    >
                      {uploadingMedia ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                      {uploadingMedia ? 'Téléversement…' : 'Ajouter une image'}
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'image'); e.target.value = '' }} />
                </div>

                {/* Video */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vidéo (optionnel)</label>
                  {videoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24 flex items-center justify-center gap-2">
                      <Video className="h-5 w-5 text-slate-500" />
                      <span className="text-xs text-slate-600 truncate max-w-[140px]">Vidéo ajoutée</span>
                      <button
                        onClick={() => setVideoUrl('')}
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow"
                      >
                        <X className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm"
                    >
                      {uploadingMedia ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
                      {uploadingMedia ? 'Téléversement…' : 'Ajouter une vidéo'}
                    </button>
                  )}
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'video'); e.target.value = '' }} />
                </div>
              </div>

              {/* Or video URL */}
              {!videoUrl && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ou lien vidéo (YouTube, Vimeo…)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim() || !body.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  Diffuser maintenant
                </button>
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Broadcasts list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="rounded-2xl bg-white/80 border border-white/70 shadow p-12 text-center">
              <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Aucune diffusion pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                  {broadcasts.length} diffusion{broadcasts.length > 1 ? 's' : ''} active{broadcasts.length > 1 ? 's' : ''}
                </h2>
              </div>
              {broadcasts.map(b => {
                const cfg = TARGET_CONFIG[b.target]
                const TargetIcon = cfg.icon
                return (
                  <div key={b.id} className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-lg ring-1 ring-inset ring-white/60 overflow-hidden">
                    {b.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.image_url} alt={b.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                              <TargetIcon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {timeAgo(b.created_at)}
                            </span>
                            {b.created_by && (
                              <span className="text-xs text-slate-400">par {b.created_by}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mb-1">{b.title}</h3>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">{b.body}</p>
                          {b.video_url && (
                            <a href={b.video_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:underline">
                              <Video className="h-3.5 w-3.5" /> Voir la vidéo
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deletingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
