'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import { supabase } from '@/lib/supabase'
import {
  APPROACH_LABELS,
  EVIDENCE_LABELS,
  EVIDENCE_STYLES,
  type RegionTechnique,
} from '@/lib/region-modules'
import {
  Check,
  Clapperboard,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Link2,
  Loader2,
  Route,
  Trash2,
} from 'lucide-react'

type ModuleRow = {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published' | 'archived'
  preview_token: string | null
  chapters: number
  toFilm: number
}

type TechniqueRow = RegionTechnique & {
  chapter: { slug: string; title: string; module_id: string } | null
}

type VideoOption = { id: string; title: string; region: string }

export default function AdminRegionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [techniques, setTechniques] = useState<TechniqueRow[]>([])
  const [videos, setVideos] = useState<VideoOption[]>([])
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    void checkAdminAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    await load()
    setLoading(false)
  }

  const load = async () => {
    const { data: moduleRows } = await supabase
      .from('region_modules')
      .select('id, slug, title, status, preview_token')
      .order('order_index', { ascending: true })

    const list = moduleRows || []
    const { data: chapterRows } = await supabase
      .from('region_chapters')
      .select('id, slug, title, module_id')

    const { data: techniqueRows } = await supabase
      .from('region_chapter_techniques')
      .select('*, chapter:region_chapters(slug, title, module_id)')
      .eq('to_film', true)
      .order('order_index', { ascending: true })

    const { data: videoRows } = await supabase
      .from('practice_videos')
      .select('id, title, region')
      .eq('is_active', true)
      .order('region', { ascending: true })
      .order('title', { ascending: true })

    const pending = (techniqueRows || []) as unknown as TechniqueRow[]
    const byModule = new Map<string, { chapters: number; toFilm: number }>()
    for (const chapter of chapterRows || []) {
      const entry = byModule.get(chapter.module_id) || { chapters: 0, toFilm: 0 }
      entry.chapters += 1
      byModule.set(chapter.module_id, entry)
    }
    for (const technique of pending) {
      const moduleId = technique.chapter?.module_id
      if (!moduleId) continue
      const entry = byModule.get(moduleId) || { chapters: 0, toFilm: 0 }
      entry.toFilm += 1
      byModule.set(moduleId, entry)
    }

    setModules(
      list.map((m: any) => ({
        ...m,
        chapters: byModule.get(m.id)?.chapters ?? 0,
        toFilm: byModule.get(m.id)?.toFilm ?? 0,
      }))
    )
    setTechniques(pending)
    setVideos((videoRows || []) as VideoOption[])
  }

  const toggleStatus = async (module: ModuleRow) => {
    const next = module.status === 'published' ? 'draft' : 'published'
    if (
      next === 'published' &&
      !confirm(`Publier « ${module.title} » le rendra visible de tous les abonnés. Continuer ?`)
    ) {
      return
    }
    setBusy(module.id)
    const { error } = await supabase.from('region_modules').update({ status: next }).eq('id', module.id)
    setBusy(null)
    if (error) {
      alert('Échec : ' + error.message)
      return
    }
    setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, status: next } : m)))
  }

  /**
   * Le jeton est généré dans le navigateur : c'est un identifiant aléatoire,
   * pas un secret dérivé d'autre chose, et la seule exigence est qu'il ne soit
   * pas devinable. `crypto.randomUUID` suffit et évite un aller-retour serveur.
   */
  const createPreviewLink = async (module: ModuleRow) => {
    setBusy(module.id)
    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('region_modules')
      .update({ preview_token: token, preview_created_at: new Date().toISOString() })
      .eq('id', module.id)
    setBusy(null)
    if (error) {
      alert('Échec : ' + error.message)
      return
    }
    setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, preview_token: token } : m)))
  }

  const revokePreviewLink = async (module: ModuleRow) => {
    if (!confirm('Révoquer ce lien ? Il cessera de fonctionner immédiatement pour tous ceux à qui vous l’avez envoyé.')) {
      return
    }
    setBusy(module.id)
    const { error } = await supabase
      .from('region_modules')
      .update({ preview_token: null, preview_created_at: null })
      .eq('id', module.id)
    setBusy(null)
    if (error) {
      alert('Échec : ' + error.message)
      return
    }
    setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, preview_token: null } : m)))
  }

  const copyPreviewLink = (module: ModuleRow) => {
    if (!module.preview_token) return
    navigator.clipboard.writeText(`${window.location.origin}/apercu/${module.preview_token}`)
    setCopied(module.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const attachVideo = async (technique: TechniqueRow) => {
    const videoId = selection[technique.id]
    if (!videoId) return
    setBusy(technique.id)
    const { error } = await supabase
      .from('region_chapter_techniques')
      .update({ practice_video_id: videoId, to_film: false })
      .eq('id', technique.id)
    setBusy(null)
    if (error) {
      alert('Échec : ' + error.message)
      return
    }
    setTechniques((prev) => prev.filter((t) => t.id !== technique.id))
  }

  const markFilmed = async (technique: TechniqueRow) => {
    setBusy(technique.id)
    const { error } = await supabase
      .from('region_chapter_techniques')
      .update({ to_film: false })
      .eq('id', technique.id)
    setBusy(null)
    if (error) {
      alert('Échec : ' + error.message)
      return
    }
    setTechniques((prev) => prev.filter((t) => t.id !== technique.id))
  }

  const moduleBySlug = useMemo(() => {
    const map = new Map<string, ModuleRow>()
    for (const module of modules) map.set(module.id, module)
    return map
  }, [modules])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminBackButton />

        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Route className="h-6 w-6 text-sky-600" />
            Parcours régionaux
          </h1>
          <p className="mt-2 text-slate-600">
            Publication des parcours et suivi des démonstrations vidéo à produire. Le contenu des
            chapitres est géré par migration : cette page pilote ce qui change souvent, la
            visibilité et les vidéos.
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Modules</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {modules.length === 0 && (
              <p className="p-6 text-sm text-slate-500">Aucun module pour le moment.</p>
            )}
            {modules.map((module, index) => (
              <div
                key={module.id}
                className={`flex flex-wrap items-center justify-between gap-4 p-5 ${
                  index > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{module.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        module.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {module.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {module.chapters} chapitres
                    {module.toFilm > 0 && ` · ${module.toFilm} vidéo${module.toFilm > 1 ? 's' : ''} à tourner`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/regions/${module.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ouvrir
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => toggleStatus(module)}
                    disabled={busy === module.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {busy === module.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : module.status === 'published' ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {module.status === 'published' ? 'Dépublier' : 'Publier'}
                  </button>
                </div>

                <div className="w-full rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lien de relecture
                  </p>
                  {module.preview_token ? (
                    <>
                      <p className="mt-1.5 text-sm text-slate-600">
                        Lisible sans compte, en lecture seule, même si le parcours n’est pas publié.
                        Les activités y apparaissent avec leurs réponses attendues.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                          /apercu/{module.preview_token}
                        </code>
                        <button
                          onClick={() => copyPreviewLink(module)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                          {copied === module.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === module.id ? 'Copié' : 'Copier'}
                        </button>
                        <a
                          href={`/apercu/${module.preview_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ouvrir
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => revokePreviewLink(module)}
                          disabled={busy === module.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Révoquer
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-1.5 text-sm text-slate-600">
                        Aucun lien pour le moment. En créer un permet de faire relire le parcours par
                        un confrère sans le publier et sans lui ouvrir un compte.
                      </p>
                      <button
                        onClick={() => createPreviewLink(module)}
                        disabled={busy === module.id}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busy === module.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        Créer un lien de relecture
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Clapperboard className="h-4 w-4" />
            Liste de tournage ({techniques.length})
          </h2>

          {techniques.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-8 text-center">
              <Check className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 font-medium text-emerald-800">
                Toutes les techniques recommandées ont leur démonstration.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {techniques.map((technique) => {
                const module = technique.chapter?.module_id
                  ? moduleBySlug.get(technique.chapter.module_id)
                  : undefined

                return (
                  <article key={technique.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Film className="h-4 w-4 text-amber-500" />
                      <h3 className="font-semibold text-slate-900">{technique.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {APPROACH_LABELS[technique.approach]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          EVIDENCE_STYLES[technique.evidence_level]
                        }`}
                      >
                        {EVIDENCE_LABELS[technique.evidence_level]}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {module?.title}
                      {technique.chapter && ` · ${technique.chapter.title}`}
                    </p>

                    {technique.film_brief && (
                      <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                        <span className="font-semibold">Ce que la vidéo doit montrer : </span>
                        {technique.film_brief}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <select
                        value={selection[technique.id] || ''}
                        onChange={(event) =>
                          setSelection((prev) => ({ ...prev, [technique.id]: event.target.value }))
                        }
                        className="min-w-[16rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="">Associer une vidéo existante…</option>
                        {videos.map((video) => (
                          <option key={video.id} value={video.id}>
                            {video.region} · {video.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => attachVideo(technique)}
                        disabled={!selection[technique.id] || busy === technique.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        {busy === technique.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Associer
                      </button>
                      <button
                        onClick={() => markFilmed(technique)}
                        disabled={busy === technique.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Retirer de la liste
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AuthLayout>
  )
}
