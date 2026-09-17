import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import ArbreDecisionVisuel from '@/components/regions/ArbreDecisionVisuel'
import {
  APPROACH_LABELS,
  EVIDENCE_LABELS,
  KIND_LABELS,
  PATHOLOGY_ROLE_LABELS,
  SOURCE_TYPE_LABELS,
  formatDuration,
  sortParts,
  type RegionChapterKind,
} from '@/lib/region-modules'

// Le contenu est relu pendant qu'il est corrigé : une page en cache
// montrerait au relecteur une version antérieure à ses propres remarques.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Relecture d’un parcours',
  robots: { index: false, follow: false },
}

/**
 * Page de relecture d'un parcours régional (/apercu/<token>).
 *
 * Même mécanisme que les enquêtes `/avis/<token>` : rendue côté serveur avec
 * la clé service-role, aucune politique `anon` n'est ouverte, et le jeton est
 * la seule clé. Il n'ouvre que ce parcours, en lecture seule, et le remettre à
 * NULL depuis l'administration le révoque immédiatement.
 *
 * Tout le parcours tient sur une page, volontairement : un relecteur lit d'un
 * bout à l'autre et cherche au clavier, il ne navigue pas de chapitre en
 * chapitre. Pour la même raison les activités sont affichées avec leurs
 * réponses attendues, ce qui est justement ce qu'il faut vérifier.
 */

type Row = Record<string, any>

async function chargerParcours(token: string) {
  const { data: module } = await supabaseAdmin
    .from('region_modules')
    .select('id, slug, title, subtitle, intro_html, objectives, prerequisites, estimated_hours, status')
    .eq('preview_token', token)
    .maybeSingle()

  if (!module) return null

  const { data: chapters } = await supabaseAdmin
    .from('region_chapters')
    .select('*')
    .eq('module_id', module.id)
    .order('order_index', { ascending: true })

  const ids = (chapters || []).map((c: Row) => c.id)
  if (ids.length === 0) return { module, chapters: [], par: {} as Record<string, any> }

  const [sections, tests, clusters, pathologies, techniques, references, activities] =
    await Promise.all([
      supabaseAdmin.from('region_chapter_sections').select('*').in('chapter_id', ids).order('order_index'),
      supabaseAdmin
        .from('region_chapter_tests')
        .select('chapter_id, note, order_index, test:orthopedic_tests(name, sensitivity, specificity)')
        .in('chapter_id', ids)
        .order('order_index'),
      supabaseAdmin
        .from('region_chapter_clusters')
        .select('chapter_id, note, order_index, cluster:orthopedic_test_clusters(name, rv_positive)')
        .in('chapter_id', ids)
        .order('order_index'),
      supabaseAdmin
        .from('region_chapter_pathologies')
        .select('chapter_id, role, note, order_index, pathology:pathologies(name)')
        .in('chapter_id', ids)
        .order('order_index'),
      supabaseAdmin.from('region_chapter_techniques').select('*').in('chapter_id', ids).order('order_index'),
      supabaseAdmin.from('region_chapter_references').select('*').in('chapter_id', ids).order('order_index'),
      supabaseAdmin.from('region_chapter_activities').select('*').in('chapter_id', ids).order('order_index'),
    ])

  const grouper = (rows: Row[] | null) => {
    const map: Record<string, Row[]> = {}
    for (const row of rows || []) {
      map[row.chapter_id] = [...(map[row.chapter_id] || []), row]
    }
    return map
  }

  return {
    module,
    chapters: chapters || [],
    par: {
      sections: grouper(sections.data),
      tests: grouper(tests.data),
      clusters: grouper(clusters.data),
      pathologies: grouper(pathologies.data),
      techniques: grouper(techniques.data),
      references: grouper(references.data),
      activities: grouper(activities.data),
    },
  }
}

const un = (value: any) => (Array.isArray(value) ? value[0] : value)

const pourcent = (value: any) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(num) ? `${Math.round(num)} %` : null
}

const CALLOUT_LABELS: Record<string, string> = {
  cle: 'À retenir',
  drapeau_rouge: 'Drapeau rouge',
  preuve: 'Niveau de preuve',
  piege: 'Piège fréquent',
  pratique: 'En pratique',
  reorientation: 'Réorientation',
}

const CALLOUT_STYLES: Record<string, string> = {
  none: 'border-slate-200 bg-white',
  cle: 'border-sky-200 bg-sky-50/70',
  drapeau_rouge: 'border-rose-200 bg-rose-50/70',
  preuve: 'border-emerald-200 bg-emerald-50/70',
  piege: 'border-amber-200 bg-amber-50/70',
  pratique: 'border-violet-200 bg-violet-50/70',
  reorientation: 'border-orange-200 bg-orange-50/70',
}

export default async function PageApercu({ params }: { params: { token: string } }) {
  const data = await chargerParcours(params.token)
  if (!data) notFound()

  const { module, chapters, par } = data
  const parts = sortParts([...new Set(chapters.map((c: Row) => c.part || 'Chapitres'))] as string[])
  const totalMinutes = chapters.reduce((sum: number, c: Row) => sum + (c.estimated_minutes || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Version de travail, transmise pour relecture
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{module.title}</h1>
          {module.subtitle && <p className="mt-2 text-lg text-slate-600">{module.subtitle}</p>}
          <p className="mt-4 text-sm text-slate-500">
            {chapters.length} chapitres · {formatDuration(totalMinutes)} de lecture
            {module.status !== 'published' && ' · non publié'}
          </p>
          <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Ce lien est privé et n’est pas référencé. Le contenu n’est pas encore publié : il est
            soumis à votre relecture. Les activités sont affichées avec leurs réponses attendues,
            pour que vous puissiez les vérifier.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {module.intro_html && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="region-html text-slate-700" dangerouslySetInnerHTML={{ __html: module.intro_html }} />
            {Array.isArray(module.objectives) && module.objectives.length > 0 && (
              <ul className="mt-5 space-y-1.5 border-t border-slate-100 pt-5">
                {module.objectives.map((objectif: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {objectif}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sommaire</h2>
          <ol className="mt-4 space-y-4">
            {parts.map((part) => (
              <li key={part}>
                <p className="text-sm font-semibold text-slate-900">{part}</p>
                <ul className="mt-1.5 space-y-1">
                  {chapters
                    .filter((c: Row) => (c.part || 'Chapitres') === part)
                    .map((c: Row) => (
                      <li key={c.id}>
                        <a href={`#${c.slug}`} className="text-sm text-sky-700 hover:underline">
                          {c.title}
                        </a>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ol>
        </nav>

        {chapters.map((chapter: Row, index: number) => (
          <article key={chapter.id} id={chapter.slug} className="mb-12 scroll-mt-6">
            <div className="mb-4 border-b border-slate-200 pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {chapter.part} · {KIND_LABELS[chapter.kind as RegionChapterKind]} · chapitre {index + 1}
              </p>
              <h2 className="mt-1.5 text-2xl font-bold text-slate-900">{chapter.title}</h2>
              {chapter.subtitle && <p className="mt-1 text-slate-600">{chapter.subtitle}</p>}
              {chapter.summary && <p className="mt-3 text-sm text-slate-600">{chapter.summary}</p>}
            </div>

            {(par.sections[chapter.id] || []).map((section: Row) => (
              <section
                key={section.id}
                className={`mb-4 rounded-2xl border p-5 ${CALLOUT_STYLES[section.callout] || CALLOUT_STYLES.none}`}
              >
                {CALLOUT_LABELS[section.callout] && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {CALLOUT_LABELS[section.callout]}
                  </p>
                )}
                {section.title && (
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{section.title}</h3>
                )}
                <div className="region-html text-slate-700" dangerouslySetInnerHTML={{ __html: section.body_html }} />
              </section>
            ))}

            {(par.pathologies[chapter.id] || []).length > 0 && (
              <Bloc titre="Diagnostics abordés">
                {(par.pathologies[chapter.id] || []).map((item: Row) => (
                  <p key={item.pathology?.name ?? Math.random()} className="text-sm text-slate-700">
                    <strong>{un(item.pathology)?.name}</strong>
                    <span className="text-slate-400"> · {PATHOLOGY_ROLE_LABELS[item.role] || item.role}</span>
                    {item.note && <span className="block text-slate-600">{item.note}</span>}
                  </p>
                ))}
              </Bloc>
            )}

            {(par.clusters[chapter.id] || []).length > 0 && (
              <Bloc titre="Clusters et règles de décision">
                {(par.clusters[chapter.id] || []).map((item: Row) => {
                  const cluster = un(item.cluster)
                  return (
                    <p key={cluster?.name ?? Math.random()} className="text-sm text-slate-700">
                      <strong>{cluster?.name}</strong>
                      {cluster?.rv_positive && (
                        <span className="text-slate-400"> · RV+ {cluster.rv_positive}</span>
                      )}
                      {item.note && <span className="block text-slate-600">{item.note}</span>}
                    </p>
                  )
                })}
              </Bloc>
            )}

            {(par.tests[chapter.id] || []).length > 0 && (
              <Bloc titre="Tests du chapitre">
                {(par.tests[chapter.id] || []).map((item: Row) => {
                  const test = un(item.test)
                  return (
                    <p key={test?.name ?? Math.random()} className="text-sm text-slate-700">
                      <strong>{test?.name}</strong>
                      {pourcent(test?.sensitivity) && (
                        <span className="text-slate-400">
                          {' '}· Se {pourcent(test.sensitivity)} · Sp {pourcent(test.specificity)}
                        </span>
                      )}
                      {item.note && <span className="block text-slate-600">{item.note}</span>}
                    </p>
                  )
                })}
              </Bloc>
            )}

            {(par.techniques[chapter.id] || []).length > 0 && (
              <Bloc titre="Techniques recommandées">
                {(par.techniques[chapter.id] || []).map((technique: Row) => (
                  <div key={technique.id} className="text-sm text-slate-700">
                    <strong>{technique.name}</strong>
                    <span className="text-slate-400">
                      {' '}· {APPROACH_LABELS[technique.approach as keyof typeof APPROACH_LABELS]} ·{' '}
                      {EVIDENCE_LABELS[technique.evidence_level as keyof typeof EVIDENCE_LABELS]}
                      {technique.to_film && ' · démonstration à tourner'}
                    </span>
                    {technique.evidence_summary && (
                      <span className="block text-slate-600">{technique.evidence_summary}</span>
                    )}
                  </div>
                ))}
              </Bloc>
            )}

            {(par.activities[chapter.id] || []).length > 0 && (
              <Bloc titre="Activités, avec les réponses attendues">
                {(par.activities[chapter.id] || []).map((activity: Row) => (
                  <div key={activity.id} className="text-sm text-slate-700">
                    <strong>{activity.title}</strong>
                    {activity.prompt && <span className="block text-slate-600">{activity.prompt}</span>}
                    <CorrigeActivite activity={activity} />
                    {activity.explanation && (
                      <span className="mt-1 block italic text-slate-500">{activity.explanation}</span>
                    )}
                  </div>
                ))}
              </Bloc>
            )}

            {Array.isArray(chapter.key_points) && chapter.key_points.length > 0 && (
              <Bloc titre="Ce qu’il faut retenir">
                <ul className="space-y-1.5">
                  {chapter.key_points.map((point: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Bloc>
            )}

            {(par.references[chapter.id] || []).length > 0 && (
              <Bloc titre="Sources">
                <ol className="space-y-1.5">
                  {(par.references[chapter.id] || []).map((reference: Row) => (
                    <li key={reference.id} className="text-sm text-slate-600">
                      <span className="text-slate-400">
                        [{SOURCE_TYPE_LABELS[reference.source_type] || reference.source_type}
                        {reference.year ? `, ${reference.year}` : ''}]
                      </span>{' '}
                      {reference.url ? (
                        <a href={reference.url} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                          {reference.citation}
                        </a>
                      ) : (
                        reference.citation
                      )}
                    </li>
                  ))}
                </ol>
              </Bloc>
            )}
          </article>
        ))}

        <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>
            Merci de votre relecture. Vos remarques sont attendues sur le fond comme sur la forme :
            une affirmation trop forte, une source mal citée, un tableau clinique manquant.
          </p>
        </footer>
      </div>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{titre}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

/** Réponses attendues d'une activité, mises à plat pour la relecture. */
function CorrigeActivite({ activity }: { activity: Row }) {
  const payload = activity.payload || {}

  if (activity.kind === 'qcm') {
    return (
      <ul className="mt-1.5 space-y-1">
        {(payload.options || []).map((option: Row, i: number) => (
          <li key={i} className={option.correct ? 'text-emerald-700' : 'text-slate-500'}>
            {option.correct ? '✓' : '·'} {option.label}
            {option.feedback && <span className="block pl-4 text-xs text-slate-500">{option.feedback}</span>}
          </li>
        ))}
      </ul>
    )
  }

  if (activity.kind === 'vrai_faux') {
    return (
      <ul className="mt-1.5 space-y-1">
        {(payload.statements || []).map((statement: Row, i: number) => (
          <li key={i} className="text-slate-600">
            <span className={statement.correct ? 'text-emerald-700' : 'text-rose-700'}>
              {statement.correct ? 'Vrai' : 'Faux'}
            </span>{' '}
            · {statement.label}
            {statement.feedback && <span className="block pl-4 text-xs text-slate-500">{statement.feedback}</span>}
          </li>
        ))}
      </ul>
    )
  }

  if (activity.kind === 'tri_drapeaux') {
    return (
      <ul className="mt-1.5 space-y-1">
        {(payload.items || []).map((item: Row, i: number) => (
          <li key={i} className="text-slate-600">
            <span className="font-medium text-slate-800">{item.niveau}</span> · {item.label}
            {item.feedback && <span className="block pl-4 text-xs text-slate-500">{item.feedback}</span>}
          </li>
        ))}
      </ul>
    )
  }

  if (activity.kind === 'cas_etape') {
    return (
      <ol className="mt-1.5 space-y-2">
        {(payload.steps || []).map((step: Row, i: number) => (
          <li key={i} className="text-slate-600">
            <span className="block text-xs text-slate-500">{step.situation}</span>
            <span className="font-medium text-slate-800">{step.question}</span>
            <ul className="mt-1 space-y-0.5 pl-4">
              {(step.options || []).map((option: Row, j: number) => (
                <li key={j} className={option.correct ? 'text-emerald-700' : 'text-slate-500'}>
                  {option.correct ? '✓' : '·'} {option.label}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    )
  }

  if (activity.kind === 'arbre_decision') {
    // Le relecteur voit le schéma complet, comme l'apprenant : c'est la forme
    // sur laquelle il peut juger, une liste à plat ne dirait rien des branches.
    return (
      <div className="mt-2">
        <ArbreDecisionVisuel payload={payload} />
      </div>
    )
  }

  if (activity.kind === 'probabilite') {
    return (
      <p className="mt-1.5 text-slate-600">
        Calculateur, probabilité de départ {payload.prevalence} %, à partir de{' '}
        {(payload.tests || []).map((t: Row) => t.name).join(', ')}.
      </p>
    )
  }

  return null
}
