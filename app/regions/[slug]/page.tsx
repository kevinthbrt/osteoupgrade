'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import FreeContentGate from '@/components/FreeContentGate'
import FreeUserBanner from '@/components/FreeUserBanner'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { hasOsteoupgrade } from '@/lib/entitlements'
import {
  formatDuration,
  KIND_LABELS,
  sortParts,
  type RegionChapter,
  type RegionModule,
} from '@/lib/region-modules'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock,
  Clapperboard,
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  Target,
} from 'lucide-react'

export default function RegionModulePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [module, setModule] = useState<RegionModule | null>(null)
  const [chapters, setChapters] = useState<RegionChapter[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [toFilm, setToFilm] = useState(0)
  // Sans repère dans le sommaire, un questionnaire posé au milieu de trente-quatre
  // chapitres est introuvable : il faut ouvrir les chapitres un par un pour le
  // trouver, ce qui revient à ne pas l'avoir mis.
  const [avecQuestionnaire, setAvecQuestionnaire] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (slug) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const load = async () => {
    try {
      const payload = await fetchProfilePayload()
      if (!payload?.user) {
        router.push('/')
        return
      }
      setProfile(payload.profile)

      const { data: moduleRow } = await supabase
        .from('region_modules')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (!moduleRow) {
        setModule(null)
        return
      }
      setModule(moduleRow as RegionModule)

      const { data: chapterRows } = await supabase
        .from('region_chapters')
        .select('*')
        .eq('module_id', moduleRow.id)
        .order('order_index', { ascending: true })

      const list = (chapterRows || []) as RegionChapter[]
      setChapters(list)

      if (list.length) {
        const { data: liens } = await supabase
          .from('region_chapter_questionnaires')
          .select('chapter_id')
          .in('chapter_id', list.map((c) => c.id))
        setAvecQuestionnaire(new Set((liens || []).map((l: any) => l.chapter_id)))
      }

      const { data: progressRows } = await supabase
        .from('region_chapter_progress')
        .select('chapter_id')
        .eq('user_id', payload.user.id)
      setCompleted(new Set((progressRows || []).map((p: any) => p.chapter_id)))

      if (payload.profile?.role === 'admin' && list.length) {
        const { count } = await supabase
          .from('region_chapter_techniques')
          .select('id', { count: 'exact', head: true })
          .eq('to_film', true)
          .in('chapter_id', list.map((c) => c.id))
        setToFilm(count || 0)
      }
    } catch (error) {
      console.error('Erreur de chargement du parcours:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePublication = async () => {
    if (!module) return
    const next = module.status === 'published' ? 'draft' : 'published'
    if (
      next === 'published' &&
      !confirm('Publier ce parcours le rendra visible de tous les abonnés. Continuer ?')
    ) {
      return
    }

    setPublishing(true)
    const { error } = await supabase
      .from('region_modules')
      .update({ status: next })
      .eq('id', module.id)
    setPublishing(false)

    if (error) {
      alert('Échec de la mise à jour : ' + error.message)
      return
    }
    setModule({ ...module, status: next })
  }

  const grouped = useMemo(() => {
    const byPart = new Map<string, RegionChapter[]>()
    for (const chapter of chapters) {
      const part = chapter.part || 'Chapitres'
      byPart.set(part, [...(byPart.get(part) || []), chapter])
    }
    return sortParts([...byPart.keys()]).map((part) => ({
      part,
      items: byPart.get(part) || [],
    }))
  }, [chapters])

  const unlocked = hasOsteoupgrade(profile)
  const isAdmin = profile?.role === 'admin'
  const nextChapter = chapters.find((c) => !completed.has(c.id)) || chapters[0]
  const totalMinutes = chapters.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0)
  const percent = chapters.length ? Math.round((completed.size / chapters.length) * 100) : 0

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </AuthLayout>
    )
  }

  if (!module) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">Parcours introuvable.</p>
          <Link href="/regions" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parcours
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const locked = !unlocked && !module.is_free_access

  return (
    <AuthLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {!unlocked && <FreeUserBanner />}

        <Link
          href="/regions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Parcours régionaux
        </Link>

        <header className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{module.title}</h1>
              {module.subtitle && <p className="mt-2 max-w-3xl text-sky-100">{module.subtitle}</p>}
            </div>
            {module.status === 'draft' && (
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-300/40">
                Brouillon, visible des administrateurs
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-sky-100">
            <span>{chapters.length} chapitres</span>
            {totalMinutes > 0 && <span>{formatDuration(totalMinutes)} de lecture</span>}
            <span>{completed.size} terminés</span>
          </div>

          <div className="mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {!locked && nextChapter && (
            <Link
              href={`/regions/${module.slug}/${nextChapter.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-50"
            >
              {completed.size > 0 ? 'Reprendre' : 'Commencer'} : {nextChapter.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </header>

        {!locked && (
          <Link
            href={`/regions/${module.slug}/simulateur`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 transition-colors hover:border-violet-300"
          >
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Simulateur de consultation</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Un patient tiré au sort, votre anamnèse, vos examens, votre conclusion. Corrigée
                  sur l’arbre de décision du parcours.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700">
              Recevoir un patient
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        )}

        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Administration du parcours</p>
              <p className="mt-0.5">
                {toFilm > 0
                  ? `${toFilm} technique${toFilm > 1 ? 's' : ''} recommandée${toFilm > 1 ? 's' : ''} attend${toFilm > 1 ? 'ent' : ''} sa démonstration vidéo.`
                  : 'Toutes les techniques recommandées ont leur démonstration.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/regions"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Clapperboard className="h-4 w-4" />
                Liste de tournage
              </Link>
              <button
                onClick={togglePublication}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : module.status === 'published' ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {module.status === 'published' ? 'Repasser en brouillon' : 'Publier'}
              </button>
            </div>
          </div>
        )}

        <FreeContentGate isLocked={locked}>
          <div className="space-y-8">
            {(module.intro_html || module.objectives?.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                {module.intro_html && (
                  <div
                    className="region-html text-slate-700"
                    dangerouslySetInnerHTML={{ __html: module.intro_html }}
                  />
                )}
                {module.objectives?.length > 0 && (
                  <div className="mt-6">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <Target className="h-4 w-4" />
                      À la fin de ce parcours
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {module.objectives.map((objective, index) => (
                        <li key={index} className="flex gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {module.prerequisites && (
                  <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Prérequis :</span>{' '}
                    {module.prerequisites}
                  </p>
                )}
              </section>
            )}

            {grouped.map(({ part, items }) => (
              <section key={part}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {part}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {items.map((chapter, index) => {
                    const done = completed.has(chapter.id)
                    return (
                      <Link
                        key={chapter.id}
                        href={`/regions/${module.slug}/${chapter.slug}`}
                        className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${
                          index > 0 ? 'border-t border-slate-100' : ''
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{chapter.title}</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {KIND_LABELS[chapter.kind]}
                            </span>
                            {avecQuestionnaire.has(chapter.id) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                                <ClipboardList className="h-3 w-3" />
                                Questionnaire
                              </span>
                            )}
                          </div>
                          {chapter.subtitle && (
                            <p className="mt-0.5 text-sm text-slate-500">{chapter.subtitle}</p>
                          )}
                          {chapter.summary && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{chapter.summary}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-sm text-slate-400">
                          {chapter.estimated_minutes && (
                            <span className="hidden items-center gap-1 sm:inline-flex">
                              <Clock className="h-3.5 w-3.5" />
                              {chapter.estimated_minutes} min
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </FreeContentGate>
      </div>
    </AuthLayout>
  )
}
