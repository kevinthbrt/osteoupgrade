'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import FreeUserBanner from '@/components/FreeUserBanner'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { hasOsteoupgrade } from '@/lib/entitlements'
import { type RegionModule } from '@/lib/region-modules'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  Loader2,
  Lock,
  Route,
  Sparkles,
} from 'lucide-react'

type ModuleCard = RegionModule & {
  chapters: number
  completed: number
}

export default function RegionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [modules, setModules] = useState<ModuleCard[]>([])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    try {
      const payload = await fetchProfilePayload()
      if (!payload?.user) {
        router.push('/')
        return
      }
      setProfile(payload.profile)

      // La RLS masque déjà les brouillons aux non-administrateurs : inutile de
      // filtrer sur `status` ici, et le filtrer masquerait le brouillon à
      // l'administrateur qui doit justement le relire.
      const { data: moduleRows } = await supabase
        .from('region_modules')
        .select('*')
        .neq('status', 'archived')
        .order('order_index', { ascending: true })

      const list = (moduleRows || []) as RegionModule[]
      if (list.length === 0) {
        setModules([])
        return
      }

      const ids = list.map((m) => m.id)
      const [{ data: chapterRows }, { data: progressRows }] = await Promise.all([
        supabase.from('region_chapters').select('id, module_id').in('module_id', ids),
        supabase.from('region_chapter_progress').select('chapter_id').eq('user_id', payload.user.id),
      ])

      const done = new Set((progressRows || []).map((p: any) => p.chapter_id))
      const byModule = new Map<string, { total: number; completed: number }>()
      for (const row of chapterRows || []) {
        const entry = byModule.get(row.module_id) || { total: 0, completed: 0 }
        entry.total += 1
        if (done.has(row.id)) entry.completed += 1
        byModule.set(row.module_id, entry)
      }

      setModules(
        list.map((m) => ({
          ...m,
          chapters: byModule.get(m.id)?.total ?? 0,
          completed: byModule.get(m.id)?.completed ?? 0,
        }))
      )
    } catch (error) {
      console.error('Erreur de chargement des parcours régionaux:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlocked = hasOsteoupgrade(profile)

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
      <div className="mx-auto max-w-6xl space-y-8">
        {!unlocked && <FreeUserBanner />}

        <header className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-lg">
          <div className="flex items-center gap-2 text-sky-300">
            <Route className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Parcours régionaux</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold">Devenir expert d’une région, chapitre par chapitre</h1>
          <p className="mt-3 max-w-3xl text-sky-100">
            Chaque parcours reprend une région anatomique dans l’ordre où le problème se pose en
            consultation : trier, reconnaître le tableau clinique, choisir un traitement dont
            l’effet est documenté, et savoir quand passer la main. Les tests, clusters, vidéos et
            diagnostics cités sont ceux de la plateforme.
          </p>
        </header>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Aucun parcours disponible pour le moment.</p>
            <p className="mt-1 text-sm text-slate-500">
              Les parcours régionaux sont publiés au fur et à mesure de leur relecture.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module) => {
              const locked = !unlocked && !module.is_free_access
              const percent = module.chapters
                ? Math.round((module.completed / module.chapters) * 100)
                : 0

              return (
                <Link
                  key={module.id}
                  href={locked ? '/settings/subscription' : `/regions/${module.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{module.title}</h2>
                        {module.subtitle && (
                          <p className="mt-1 text-sm text-slate-600">{module.subtitle}</p>
                        )}
                      </div>
                      {module.status === 'draft' && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Brouillon
                        </span>
                      )}
                      {locked && <Lock className="h-4 w-4 shrink-0 text-slate-400" />}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        {module.chapters} chapitres
                      </span>
                      {module.estimated_hours && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {module.estimated_hours} h
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    {module.completed > 0 && (
                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                          <span>Progression</span>
                          <span>{percent} %</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 group-hover:gap-2.5 transition-all">
                      {locked ? (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Débloquer
                        </>
                      ) : module.completed > 0 ? (
                        <>Reprendre le parcours <ArrowRight className="h-4 w-4" /></>
                      ) : (
                        <>Commencer <ArrowRight className="h-4 w-4" /></>
                      )}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
