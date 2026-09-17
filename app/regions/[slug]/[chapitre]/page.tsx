'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import FreeContentGate from '@/components/FreeContentGate'
import ChapterActivities from '@/components/regions/ChapterActivities'
import Passation from '@/components/questionnaires/Passation'
import type { Questionnaire, QuestionnaireItem } from '@/lib/questionnaires'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { hasOsteoupgrade } from '@/lib/entitlements'
import {
  APPROACH_LABELS,
  EVIDENCE_LABELS,
  EVIDENCE_STYLES,
  KIND_LABELS,
  PATHOLOGY_ROLE_LABELS,
  SOURCE_TYPE_LABELS,
  vimeoEmbedUrl,
  youtubeEmbed,
  youtubeThumbnail,
  type RegionActivity,
  type RegionChapter,
  type RegionModule,
  type RegionReference,
  type RegionSection,
  type RegionTechnique,
  type SectionCallout,
} from '@/lib/region-modules'
import {
  ClipboardList,
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Clipboard,
  Clock,
  Dumbbell,
  ExternalLink,
  Film,
  FlaskConical,
  Key,
  Layers,
  Lightbulb,
  Loader2,
  PlayCircle,
  Send,
  Stethoscope,
  Target,
} from 'lucide-react'

type LinkedTest = {
  note: string | null
  order_index: number
  test: any
}

type LinkedCluster = {
  note: string | null
  order_index: number
  cluster: any
}

type LinkedPathology = {
  role: string
  note: string | null
  order_index: number
  pathology: any
}

type LinkedExercise = {
  note: string | null
  order_index: number
  exercise: any
}

type LinkedQuestionnaire = {
  note: string | null
  order_index: number
  questionnaire: Questionnaire
}

type TechniqueWithVideo = RegionTechnique & { video: any | null }

const CALLOUT_STYLES: Record<SectionCallout, { wrapper: string; label: string | null; icon: any }> = {
  none: { wrapper: 'border-slate-200 bg-white', label: null, icon: null },
  cle: { wrapper: 'border-sky-200 bg-sky-50/70', label: 'À retenir', icon: Key },
  drapeau_rouge: { wrapper: 'border-rose-200 bg-rose-50/70', label: 'Drapeau rouge', icon: AlertTriangle },
  preuve: { wrapper: 'border-emerald-200 bg-emerald-50/70', label: 'Niveau de preuve', icon: FlaskConical },
  piege: { wrapper: 'border-amber-200 bg-amber-50/70', label: 'Piège fréquent', icon: Lightbulb },
  pratique: { wrapper: 'border-violet-200 bg-violet-50/70', label: 'En pratique', icon: Activity },
  reorientation: { wrapper: 'border-orange-200 bg-orange-50/70', label: 'Réorientation', icon: Send },
}

const percent = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(num) ? `${Math.round(num)} %` : null
}

const ratio = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(num) ? num.toString().replace('.', ',') : null
}

export default function RegionChapterPage() {
  const router = useRouter()
  const params = useParams<{ slug: string; chapitre: string }>()
  const slug = params?.slug
  const chapterSlug = params?.chapitre

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [module, setModule] = useState<RegionModule | null>(null)
  const [chapter, setChapter] = useState<RegionChapter | null>(null)
  const [siblings, setSiblings] = useState<RegionChapter[]>([])
  const [sections, setSections] = useState<RegionSection[]>([])
  const [tests, setTests] = useState<LinkedTest[]>([])
  const [clusters, setClusters] = useState<LinkedCluster[]>([])
  const [clusterItems, setClusterItems] = useState<Record<string, string[]>>({})
  const [pathologies, setPathologies] = useState<LinkedPathology[]>([])
  const [exercises, setExercises] = useState<LinkedExercise[]>([])
  const [techniques, setTechniques] = useState<TechniqueWithVideo[]>([])
  const [references, setReferences] = useState<RegionReference[]>([])
  const [activities, setActivities] = useState<RegionActivity[]>([])
  const [questionnaires, setQuestionnaires] = useState<LinkedQuestionnaire[]>([])
  const [questionnaireItems, setQuestionnaireItems] = useState<Record<string, QuestionnaireItem[]>>({})
  const [solvedActivities, setSolvedActivities] = useState<Set<string>>(new Set())
  const [playingTest, setPlayingTest] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    if (slug && chapterSlug) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, chapterSlug])

  const load = async () => {
    setLoading(true)
    try {
      const payload = await fetchProfilePayload()
      if (!payload?.user) {
        router.push('/')
        return
      }
      setProfile(payload.profile)
      setUserId(payload.user.id)

      const { data: moduleRow } = await supabase
        .from('region_modules')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (!moduleRow) {
        setChapter(null)
        return
      }
      setModule(moduleRow as RegionModule)

      const { data: chapterRows } = await supabase
        .from('region_chapters')
        .select('*')
        .eq('module_id', moduleRow.id)
        .order('order_index', { ascending: true })

      const list = (chapterRows || []) as RegionChapter[]
      setSiblings(list)
      const current = list.find((c) => c.slug === chapterSlug) || null
      setChapter(current)
      if (!current) return

      const [
        sectionRes,
        testRes,
        clusterRes,
        pathologyRes,
        exerciseRes,
        techniqueRes,
        referenceRes,
        activityRes,
        questionnaireRes,
        progressRes,
      ] = await Promise.all([
        supabase
          .from('region_chapter_sections')
          .select('*')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_tests')
          .select('note, order_index, test:orthopedic_tests(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_clusters')
          .select('note, order_index, cluster:orthopedic_test_clusters(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_pathologies')
          .select('role, note, order_index, pathology:pathologies(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_exercises')
          .select('note, order_index, exercise:rehab_exercises(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_techniques')
          .select('*, video:practice_videos(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_references')
          .select('*')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_activities')
          .select('*')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_questionnaires')
          .select('note, order_index, questionnaire:questionnaires(*)')
          .eq('chapter_id', current.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('region_chapter_progress')
          .select('chapter_id')
          .eq('user_id', payload.user.id)
          .eq('chapter_id', current.id)
          .maybeSingle(),
      ])

      setSections((sectionRes.data || []) as RegionSection[])
      setTests((testRes.data || []) as unknown as LinkedTest[])
      setPathologies((pathologyRes.data || []) as unknown as LinkedPathology[])
      setExercises((exerciseRes.data || []) as unknown as LinkedExercise[])
      setTechniques((techniqueRes.data || []) as unknown as TechniqueWithVideo[])
      setReferences((referenceRes.data || []) as RegionReference[])
      setDone(Boolean(progressRes.data))

      // Les items d'un questionnaire ne sont lisibles que par un abonné : la
      // politique de lecture les filtre, et un compte gratuit reçoit la fiche
      // sans les items. Le composant affiche alors un questionnaire vide, ce
      // que la page évite en ne le montrant pas du tout.
      const linkedQuestionnaires = (questionnaireRes.data || []) as unknown as LinkedQuestionnaire[]
      setQuestionnaires(linkedQuestionnaires)
      if (linkedQuestionnaires.length) {
        const { data: lignes } = await supabase
          .from('questionnaire_items')
          .select('*')
          .in('questionnaire_id', linkedQuestionnaires.map((l) => l.questionnaire.id))
          .order('order_index', { ascending: true })

        const parQuestionnaire: Record<string, QuestionnaireItem[]> = {}
        for (const ligne of (lignes || []) as QuestionnaireItem[]) {
          parQuestionnaire[ligne.questionnaire_id] = [
            ...(parQuestionnaire[ligne.questionnaire_id] || []),
            ligne,
          ]
        }
        setQuestionnaireItems(parQuestionnaire)
      } else {
        setQuestionnaireItems({})
      }

      const chapterActivities = (activityRes.data || []) as unknown as RegionActivity[]
      setActivities(chapterActivities)
      if (chapterActivities.length) {
        const { data: attempts } = await supabase
          .from('region_activity_attempts')
          .select('activity_id, is_correct')
          .eq('user_id', payload.user.id)
          .in('activity_id', chapterActivities.map((a) => a.id))
        setSolvedActivities(
          new Set((attempts || []).filter((a: any) => a.is_correct).map((a: any) => a.activity_id))
        )
      } else {
        setSolvedActivities(new Set())
      }

      const linkedClusters = (clusterRes.data || []) as unknown as LinkedCluster[]
      setClusters(linkedClusters)

      // Les tests d'un cluster sont affichés en clair : sans eux, une fiche
      // « 3 positifs sur 5 » ne dit pas sur quels cinq tests on compte.
      const clusterIds = linkedClusters.map((c) => c.cluster?.id).filter(Boolean)
      if (clusterIds.length) {
        const { data: items } = await supabase
          .from('orthopedic_test_cluster_items')
          .select('cluster_id, order_index, test:orthopedic_tests(name)')
          .in('cluster_id', clusterIds)
          .order('order_index', { ascending: true })

        const map: Record<string, string[]> = {}
        for (const item of (items || []) as any[]) {
          const name = Array.isArray(item.test) ? item.test[0]?.name : item.test?.name
          if (!name) continue
          map[item.cluster_id] = [...(map[item.cluster_id] || []), name]
        }
        setClusterItems(map)
      } else {
        setClusterItems({})
      }
    } catch (error) {
      console.error('Erreur de chargement du chapitre:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDone = async () => {
    if (!chapter || !userId) return
    setSaving(true)
    try {
      if (done) {
        await supabase
          .from('region_chapter_progress')
          .delete()
          .eq('user_id', userId)
          .eq('chapter_id', chapter.id)
        setDone(false)
      } else {
        await supabase
          .from('region_chapter_progress')
          .insert({ user_id: userId, chapter_id: chapter.id })
        setDone(true)
      }
    } catch (error) {
      console.error('Erreur d’enregistrement de la progression:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </AuthLayout>
    )
  }

  if (!module || !chapter) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">Chapitre introuvable.</p>
          <Link href="/regions" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parcours
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const locked = !hasOsteoupgrade(profile) && !module.is_free_access && !chapter.is_free_access
  const index = siblings.findIndex((c) => c.id === chapter.id)
  const previous = index > 0 ? siblings[index - 1] : null
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href={`/regions/${module.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {module.title}
        </Link>

        <header className="rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {chapter.part && (
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">{chapter.part}</span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              {KIND_LABELS[chapter.kind]}
            </span>
            {chapter.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {chapter.estimated_minutes} min
              </span>
            )}
            <span className="text-slate-400">
              Chapitre {index + 1} sur {siblings.length}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">{chapter.title}</h1>
          {chapter.subtitle && <p className="mt-2 text-lg text-slate-600">{chapter.subtitle}</p>}
          {chapter.summary && <p className="mt-4 text-slate-600">{chapter.summary}</p>}

          {chapter.objectives?.length > 0 && (
            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Target className="h-4 w-4" />
                Objectifs du chapitre
              </h2>
              <ul className="mt-3 space-y-1.5">
                {chapter.objectives.map((objective, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <FreeContentGate isLocked={locked}>
          <div className="space-y-8">
            {sections.map((section) => {
              const style = CALLOUT_STYLES[section.callout] || CALLOUT_STYLES.none
              const Icon = style.icon
              return (
                <section
                  key={section.id}
                  className={`rounded-2xl border p-6 ${style.wrapper}`}
                >
                  {style.label && (
                    <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {style.label}
                    </div>
                  )}
                  {section.title && (
                    <h2 className="mb-3 text-xl font-semibold text-slate-900">{section.title}</h2>
                  )}
                  <div
                    className="region-html text-slate-700"
                    dangerouslySetInnerHTML={{ __html: section.body_html }}
                  />
                </section>
              )
            })}

            {questionnaires.some((lien) => (questionnaireItems[lien.questionnaire.id] || []).length > 0) && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <ClipboardList className="h-4 w-4" />
                  Les questionnaires de ce chapitre
                </h2>
                <div className="space-y-3">
                  {questionnaires.map((lien) => {
                    const items = questionnaireItems[lien.questionnaire.id] || []
                    if (!items.length) return null
                    return (
                      <Passation
                        key={lien.questionnaire.id}
                        questionnaire={lien.questionnaire}
                        items={items}
                        note={lien.note}
                        replie
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {pathologies.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Stethoscope className="h-4 w-4" />
                  Diagnostics abordés
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pathologies.map((item) => {
                    const pathology = Array.isArray(item.pathology) ? item.pathology[0] : item.pathology
                    if (!pathology) return null
                    const isRedFlag = item.role === 'drapeau_rouge' || pathology.is_red_flag
                    return (
                      <article
                        key={pathology.id}
                        className={`rounded-xl border p-4 ${
                          isRedFlag ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">{pathology.name}</h3>
                          {isRedFlag && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />}
                        </div>
                        <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {PATHOLOGY_ROLE_LABELS[item.role] || item.role}
                        </span>
                        {item.note && <p className="mt-2 text-sm text-slate-600">{item.note}</p>}
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {clusters.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Layers className="h-4 w-4" />
                  Clusters et règles de décision
                </h2>
                <div className="space-y-3">
                  {clusters.map((item) => {
                    const cluster = Array.isArray(item.cluster) ? item.cluster[0] : item.cluster
                    if (!cluster) return null
                    const items = clusterItems[cluster.id] || []
                    return (
                      <article key={cluster.id} className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="font-semibold text-slate-900">{cluster.name}</h3>
                        {item.note && <p className="mt-1 text-sm text-slate-600">{item.note}</p>}

                        {items.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {items.map((name) => (
                              <li key={name} className="flex gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                                {name}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          {percent(cluster.sensitivity) && <span>Se {percent(cluster.sensitivity)}</span>}
                          {percent(cluster.specificity) && <span>Sp {percent(cluster.specificity)}</span>}
                          {ratio(cluster.rv_positive) && <span>RV+ {ratio(cluster.rv_positive)}</span>}
                          {ratio(cluster.rv_negative) && <span>RV- {ratio(cluster.rv_negative)}</span>}
                        </div>

                        {cluster.interest && (
                          <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                            {cluster.interest}
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>
                <Link
                  href="/tests"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900"
                >
                  Voir les fiches complètes
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </section>
            )}

            {tests.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Clipboard className="h-4 w-4" />
                  Tests du chapitre
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {tests.map((item, i) => {
                    const test = Array.isArray(item.test) ? item.test[0] : item.test
                    if (!test) return null
                    return (
                      <div key={test.id} className={`p-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">{test.name}</h3>
                          <div className="flex flex-wrap gap-2.5 text-xs text-slate-500">
                            {percent(test.sensitivity) && <span>Se {percent(test.sensitivity)}</span>}
                            {percent(test.specificity) && <span>Sp {percent(test.specificity)}</span>}
                            {ratio(test.rv_positive) && <span>RV+ {ratio(test.rv_positive)}</span>}
                            {ratio(test.rv_negative) && <span>RV- {ratio(test.rv_negative)}</span>}
                          </div>
                        </div>
                        {item.note && <p className="mt-1.5 text-sm text-slate-600">{item.note}</p>}

                        {youtubeThumbnail(test.video_url) && (
                          playingTest === test.id ? (
                            <div className="mt-3 aspect-video w-full max-w-lg overflow-hidden rounded-lg bg-black">
                              <iframe
                                src={youtubeEmbed(test.video_url) || ''}
                                className="h-full w-full"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                title={test.name}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setPlayingTest(test.id)}
                              className="group/video relative mt-3 block w-40 overflow-hidden rounded-lg ring-1 ring-slate-200"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={youtubeThumbnail(test.video_url) || ''}
                                alt=""
                                className="aspect-video w-full object-cover transition-transform group-hover/video:scale-105"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                                <PlayCircle className="h-8 w-8 text-white drop-shadow" />
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {techniques.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Activity className="h-4 w-4" />
                  Techniques recommandées
                </h2>
                <div className="space-y-4">
                  {techniques.map((technique) => {
                    const video = Array.isArray(technique.video) ? technique.video[0] : technique.video
                    const embed = vimeoEmbedUrl(video?.vimeo_id, video?.vimeo_url || technique.vimeo_url)
                    const isPlaying = playing === technique.id

                    return (
                      <article key={technique.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
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

                          {technique.description_html && (
                            <div
                              className="region-html mt-3 text-sm text-slate-700"
                              dangerouslySetInnerHTML={{ __html: technique.description_html }}
                            />
                          )}

                          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            {technique.indications && (
                              <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Indications</dt>
                                <dd className="text-slate-700">{technique.indications}</dd>
                              </div>
                            )}
                            {technique.contraindications && (
                              <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-rose-400">Contre-indications</dt>
                                <dd className="text-slate-700">{technique.contraindications}</dd>
                              </div>
                            )}
                            {technique.dosage && (
                              <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dosage</dt>
                                <dd className="text-slate-700">{technique.dosage}</dd>
                              </div>
                            )}
                            {technique.evidence_summary && (
                              <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ce que dit la littérature</dt>
                                <dd className="text-slate-700">{technique.evidence_summary}</dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {embed ? (
                          <div className="border-t border-slate-100 bg-slate-50 p-4">
                            {isPlaying ? (
                              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                                <iframe
                                  src={`${embed}?autoplay=1`}
                                  className="h-full w-full"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                  title={technique.name}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setPlaying(technique.id)}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
                              >
                                <PlayCircle className="h-5 w-5" />
                                Voir la démonstration
                                {video?.title && (
                                  <span className="font-normal text-slate-500">({video.title})</span>
                                )}
                              </button>
                            )}
                          </div>
                        ) : technique.to_film ? (
                          <div className="flex items-start gap-2 border-t border-slate-100 bg-amber-50/60 px-5 py-3 text-sm text-amber-800">
                            <Film className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                              Démonstration en cours de tournage.
                              {profile?.role === 'admin' && technique.film_brief && (
                                <span className="mt-1 block text-xs text-amber-700">
                                  <span className="font-semibold">Brief :</span> {technique.film_brief}
                                </span>
                              )}
                            </span>
                          </div>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {exercises.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Dumbbell className="h-4 w-4" />
                  Exercices associés
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {exercises.map((item) => {
                    const exercise = Array.isArray(item.exercise) ? item.exercise[0] : item.exercise
                    if (!exercise) return null
                    return (
                      <article key={exercise.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">{exercise.name}</h3>
                          {exercise.level && (
                            <span className="text-xs text-slate-400">Niveau {exercise.level}</span>
                          )}
                        </div>
                        {item.note && <p className="mt-1.5 text-sm text-slate-600">{item.note}</p>}
                      </article>
                    )
                  })}
                </div>
                <Link
                  href="/exercices"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900"
                >
                  Ouvrir la bibliothèque d’exercices
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </section>
            )}

            <ChapterActivities
              activities={activities}
              userId={userId}
              solved={solvedActivities}
            />

            {chapter.key_points?.length > 0 && (
              <section className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-300">
                  <Key className="h-4 w-4" />
                  Ce qu’il faut retenir
                </h2>
                <ul className="mt-4 space-y-3">
                  {chapter.key_points.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-100">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[11px] font-bold text-sky-300">
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {references.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <BookMarked className="h-4 w-4" />
                  Sources
                </h2>
                <ol className="space-y-3">
                  {references.map((reference, i) => (
                    <li key={reference.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                      <span className="mt-0.5 text-xs font-semibold text-slate-400">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            {SOURCE_TYPE_LABELS[reference.source_type] || reference.source_type}
                          </span>
                          {reference.year && (
                            <span className="text-[11px] text-slate-400">{reference.year}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm text-slate-800">{reference.citation}</p>
                        {reference.takeaway && (
                          <p className="mt-1 text-sm italic text-slate-500">{reference.takeaway}</p>
                        )}
                        {reference.url && (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-700"
                          >
                            Ouvrir
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={toggleDone}
                disabled={saving}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  done
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {done ? 'Chapitre terminé' : 'Marquer comme terminé'}
              </button>

              <div className="flex gap-3">
                {previous && (
                  <Link
                    href={`/regions/${module.slug}/${previous.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Précédent
                  </Link>
                )}
                {next && (
                  <Link
                    href={`/regions/${module.slug}/${next.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </FreeContentGate>
      </div>
    </AuthLayout>
  )
}
